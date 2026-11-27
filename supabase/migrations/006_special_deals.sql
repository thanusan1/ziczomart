-- =========================================================
-- ZICZO MART - SPECIAL DEALS & PROMOTIONAL CAMPAIGNS
-- Safe, idempotent migration preserving all existing data.
-- =========================================================

-- 1. SPECIAL DEALS CAMPAIGNS TABLE
-- =========================================================
create table if not exists public.special_deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  banner_url text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'paused', 'expired')),
  is_featured boolean not null default false,
  show_on_homepage boolean not null default false,
  display_priority integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_deals_valid_dates check (end_at > start_at)
);

-- 2. SPECIAL DEAL PRODUCTS TABLE
-- =========================================================
create table if not exists public.special_deal_products (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.special_deals(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  deal_price numeric(12, 2) not null check (deal_price > 0),
  created_at timestamptz not null default now(),
  constraint special_deal_products_unique unique (deal_id, product_id)
);

-- 3. INDEXES
-- =========================================================
create index if not exists special_deals_status_dates_idx
  on public.special_deals(status, start_at, end_at);

create index if not exists special_deals_priority_idx
  on public.special_deals(display_priority desc, created_at desc);

create index if not exists special_deal_products_deal_id_idx
  on public.special_deal_products(deal_id);

create index if not exists special_deal_products_product_id_idx
  on public.special_deal_products(product_id);

-- 4. UPDATED_AT TRIGGER
-- =========================================================
drop trigger if exists special_deals_updated_at on public.special_deals;
create trigger special_deals_updated_at
before update on public.special_deals
for each row execute procedure public.set_updated_at();

-- 5. SERVER-SIDE DEAL PRICE VALIDATION TRIGGER
-- =========================================================
create or replace function public.validate_special_deal_product()
returns trigger
language plpgsql
as $$
declare
  v_regular_price numeric(12, 2);
begin
  select price into v_regular_price
    from public.products
   where id = new.product_id;

  if not found then
    raise exception 'Selected product does not exist.';
  end if;

  if new.deal_price <= 0 or new.deal_price >= v_regular_price then
    raise exception 'Deal price (%) must be greater than 0 and lower than regular price (%).',
      new.deal_price, v_regular_price;
  end if;

  return new;
end;
$$;

drop trigger if exists special_deal_products_validate on public.special_deal_products;
create trigger special_deal_products_validate
before insert or update on public.special_deal_products
for each row execute procedure public.validate_special_deal_product();

-- 6. ROW LEVEL SECURITY
-- =========================================================
alter table public.special_deals enable row level security;
alter table public.special_deal_products enable row level security;

drop policy if exists "Public can view active special deals" on public.special_deals;
create policy "Public can view active special deals"
on public.special_deals for select to anon, authenticated
using (
  status in ('scheduled', 'active')
  and now() >= start_at
  and now() <= end_at
);

drop policy if exists "Admins can manage special deals" on public.special_deals;
create policy "Admins can manage special deals"
on public.special_deals for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view active special deal products" on public.special_deal_products;
create policy "Public can view active special deal products"
on public.special_deal_products for select to anon, authenticated
using (
  exists (
    select 1
    from public.special_deals d
    where d.id = special_deal_products.deal_id
      and d.status in ('scheduled', 'active')
      and now() >= d.start_at
      and now() <= d.end_at
  )
);

drop policy if exists "Admins can manage special deal products" on public.special_deal_products;
create policy "Admins can manage special deal products"
on public.special_deal_products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 7. EFFECTIVE PRODUCT PRICE HELPER FUNCTION
-- =========================================================
create or replace function public.get_effective_product_price(p_product_id uuid)
returns numeric(12, 2)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select sdp.deal_price
      from public.special_deal_products sdp
      join public.special_deals sd on sd.id = sdp.deal_id
      where sdp.product_id = p_product_id
        and sd.status in ('scheduled', 'active')
        and now() >= sd.start_at
        and now() <= sd.end_at
      order by sd.display_priority desc, sdp.deal_price asc, sd.created_at desc
      limit 1
    ),
    (select price from public.products where id = p_product_id)
  );
$$;

grant execute on function public.get_effective_product_price(uuid) to anon, authenticated;

-- 8. STORAGE BUCKET FOR DEAL BANNERS
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deal-banners',
  'deal-banners',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view deal banners" on storage.objects;
create policy "Public can view deal banners"
on storage.objects for select to public
using (bucket_id = 'deal-banners');

drop policy if exists "Admins can upload deal banners" on storage.objects;
create policy "Admins can upload deal banners"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'deal-banners'
  and (select public.is_admin())
);

drop policy if exists "Admins can update deal banners" on storage.objects;
create policy "Admins can update deal banners"
on storage.objects for update to authenticated
using (
  bucket_id = 'deal-banners'
  and (select public.is_admin())
);

drop policy if exists "Admins can delete deal banners" on storage.objects;
create policy "Admins can delete deal banners"
on storage.objects for delete to authenticated
using (
  bucket_id = 'deal-banners'
  and (select public.is_admin())
);
