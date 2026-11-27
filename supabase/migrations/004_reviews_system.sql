-- =========================================================
-- ZICZO MART - CUSTOMER PRODUCT REVIEW & RATING SYSTEM
-- Safe, idempotent migration preserving all existing data.
-- =========================================================

-- 1. SAFELY EXTEND public.reviews TABLE
-- =========================================================
alter table public.reviews
  add column if not exists order_item_id uuid references public.order_items(id) on delete set null,
  add column if not exists images text[] not null default '{}',
  add column if not exists status text not null default 'pending',
  add column if not exists is_verified_purchase boolean not null default false;

-- Add status check constraint if not present
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_status_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- Backfill status & verified flag for any existing rows without losing data
update public.reviews
set
  status = case when is_published = true then 'approved' else 'pending' end,
  is_verified_purchase = true
where status = 'pending' and (is_published = true or is_verified_purchase = false);

-- Enforce ONE REVIEW PER CUSTOMER PER PRODUCT
-- Deduplicate only if multiple rows exist for the same (product_id, user_id), keeping the latest
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_product_user_unique'
      and conrelid = 'public.reviews'::regclass
  ) then
    delete from public.reviews r1
    using public.reviews r2
    where r1.product_id = r2.product_id
      and r1.user_id = r2.user_id
      and r1.created_at < r2.created_at;

    alter table public.reviews
      add constraint reviews_product_user_unique
      unique (product_id, user_id);
  end if;
end $$;

-- 2. INDEXES
-- =========================================================
create index if not exists reviews_product_id_idx
  on public.reviews(product_id);

create index if not exists reviews_user_id_idx
  on public.reviews(user_id);

create index if not exists reviews_order_id_idx
  on public.reviews(order_id);

create index if not exists reviews_status_idx
  on public.reviews(status);

create index if not exists reviews_created_at_idx
  on public.reviews(created_at desc);

-- 3. SECURITY TRIGGER: ENFORCE DELIVERED PURCHASE & SERVER-CONTROLLED FLAGS
-- =========================================================
create or replace function public.enforce_review_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_order_item_id uuid;
begin
  v_is_admin := coalesce(public.is_admin(), false);

  if tg_op = 'INSERT' then
    -- Non-admin users can only insert for themselves
    if not v_is_admin then
      if new.user_id is distinct from auth.uid() then
        raise exception 'You can only submit reviews for your own account.';
      end if;

      -- Force moderation & verified flags on customer insert
      new.status := 'pending';
      new.is_published := false;
    end if;

    -- Verify the order belongs to user_id, is delivered, and contains product_id
    select oi.id
      into v_order_item_id
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
     where o.id = new.order_id
       and o.user_id = new.user_id
       and lower(o.status) = 'delivered'
       and oi.product_id = new.product_id
       and (new.order_item_id is null or oi.id = new.order_item_id)
     limit 1;

    if v_order_item_id is null then
      raise exception 'Reviews are only allowed for delivered purchases of this product.';
    end if;

    new.order_item_id := v_order_item_id;
    new.is_verified_purchase := true;
    new.is_published := (new.status = 'approved');
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Sync is_published with status
    if new.status is distinct from old.status then
      new.is_published := (new.status = 'approved');
    elsif new.is_published is distinct from old.is_published then
      new.status := case when new.is_published then 'approved' else 'pending' end;
    end if;

    if not v_is_admin then
      -- Customers cannot approve their own reviews or spoof verified status
      new.status := old.status;
      new.is_published := old.is_published;
      new.is_verified_purchase := old.is_verified_purchase;
      new.order_id := old.order_id;
      new.order_item_id := old.order_item_id;
      new.product_id := old.product_id;
      new.user_id := old.user_id;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_enforce_integrity on public.reviews;
create trigger reviews_enforce_integrity
before insert or update on public.reviews
for each row execute procedure public.enforce_review_integrity();

-- 4. ROW LEVEL SECURITY POLICIES
-- =========================================================
alter table public.reviews enable row level security;

drop policy if exists "Anyone can view published reviews" on public.reviews;
create policy "Anyone can view published reviews"
on public.reviews for select to anon, authenticated
using (status = 'approved' and is_published = true);

drop policy if exists "Users can view their own reviews" on public.reviews;
create policy "Users can view their own reviews"
on public.reviews for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can submit reviews for their delivered purchases" on public.reviews;
create policy "Users can submit reviews for their delivered purchases"
on public.reviews for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and is_published = false
  and exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.id = reviews.order_id
      and o.user_id = (select auth.uid())
      and lower(o.status) = 'delivered'
      and oi.product_id = reviews.product_id
  )
);

drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews"
on public.reviews for update to authenticated
using (
  user_id = (select auth.uid())
  and status = 'pending'
)
with check (
  user_id = (select auth.uid())
  and status = 'pending'
  and is_published = false
);

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews"
on public.reviews for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 5. SAFE PUBLIC REVIEWS RPC (PRIVACY-PRESERVING DISPLAY NAME)
-- =========================================================
create or replace function public.get_public_product_reviews(p_product_id uuid)
returns table (
  id uuid,
  product_id uuid,
  rating integer,
  title text,
  comment text,
  images text[],
  is_verified_purchase boolean,
  created_at timestamptz,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.product_id,
    r.rating,
    r.title,
    r.comment,
    coalesce(r.images, '{}'::text[]) as images,
    r.is_verified_purchase,
    r.created_at,
    case
      when p.full_name is null or trim(p.full_name) = '' then 'ZicZo Customer'
      when position(' ' in trim(p.full_name)) > 0 then
        split_part(trim(p.full_name), ' ', 1) || ' ' ||
        left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
      else trim(p.full_name)
    end as display_name
  from public.reviews r
  left join public.profiles p on p.id = r.user_id
  where r.product_id = p_product_id
    and r.status = 'approved'
    and r.is_published = true
  order by r.created_at desc;
$$;

grant execute on function public.get_public_product_reviews(uuid) to anon, authenticated;

-- 6. SUPABASE STORAGE BUCKET FOR REVIEW IMAGES
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'review-images',
  'review-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view review images" on storage.objects;
create policy "Public can view review images"
on storage.objects for select to public
using (bucket_id = 'review-images');

drop policy if exists "Authenticated customers can upload own review images" on storage.objects;
create policy "Authenticated customers can upload own review images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'review-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Customers can delete own review images" on storage.objects;
create policy "Customers can delete own review images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'review-images'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_admin())
  )
);
