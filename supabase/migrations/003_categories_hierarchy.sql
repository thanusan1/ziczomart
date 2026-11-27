-- =========================================================
-- ZICZO MART - TWO-LEVEL CATEGORY & SUBCATEGORY HIERARCHY
-- Safe, idempotent migration preserving all existing data.
-- =========================================================

-- 1. ADD parent_id COLUMN TO public.categories
-- =========================================================
alter table public.categories
  add column if not exists parent_id uuid null
  references public.categories(id) on delete restrict;

-- Prevent self-referencing at the row level
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'categories_no_self_parent'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_no_self_parent
      check (parent_id is null or parent_id <> id);
  end if;
end $$;

-- 2. INDEXES FOR FAST HIERARCHY & STOREFRONT QUERIES
-- =========================================================
create index if not exists categories_parent_id_idx
  on public.categories(parent_id);

create index if not exists categories_parent_active_sort_idx
  on public.categories(parent_id, is_active, sort_order);

create index if not exists categories_active_sort_idx
  on public.categories(is_active, sort_order);

-- 3. HIERARCHY VALIDATION TRIGGER (2-LEVEL ENFORCEMENT)
-- =========================================================
create or replace function public.validate_category_hierarchy()
returns trigger
language plpgsql
as $$
declare
  v_parent_parent_id uuid;
  v_has_children boolean;
begin
  if new.parent_id is not null then
    -- Prevent self-parenting
    if new.parent_id = new.id then
      raise exception 'A category cannot be its own parent.';
    end if;

    -- Ensure parent exists and is a main category (parent_id is null)
    select parent_id
      into v_parent_parent_id
      from public.categories
     where id = new.parent_id;

    if not found then
      raise exception 'Selected parent category does not exist.';
    end if;

    if v_parent_parent_id is not null then
      raise exception 'Subcategories cannot be nested under another subcategory.';
    end if;

    -- Prevent demoting a main category that already has subcategories
    if tg_op = 'UPDATE' then
      select exists (
        select 1 from public.categories where parent_id = new.id
      ) into v_has_children;

      if v_has_children then
        raise exception 'Cannot assign a parent to a category that already has subcategories.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists categories_validate_hierarchy on public.categories;
create trigger categories_validate_hierarchy
before insert or update on public.categories
for each row execute procedure public.validate_category_hierarchy();

-- 4. ENSURE ALL 16 MAIN CATEGORIES EXIST (PRESERVING EXISTING)
-- =========================================================
do $$
declare
  v_next_sort integer;
begin
  select coalesce(max(sort_order), 0) + 1
    into v_next_sort
    from public.categories
   where parent_id is null;

  -- Health & Wellness (added only if missing)
  if not exists (
    select 1 from public.categories
    where parent_id is null and lower(name) = 'health & wellness'
  ) then
    insert into public.categories (name, slug, description, is_active, sort_order)
    values (
      'Health & Wellness',
      'health-wellness',
      'Health care products, personal wellness, medical supplies, fitness nutrition, and wellness equipment.',
      true,
      v_next_sort
    )
    on conflict (slug) do nothing;
  end if;
end $$;

-- 5. IDEMPOTENT SEED OF INITIAL SUBCATEGORIES FOR ALL 16 MAIN CATEGORIES
-- =========================================================
do $$
declare
  v_main_id uuid;
  v_sub text;
  v_sub_slug text;
  v_idx integer;
  v_group record;
begin
  for v_group in
    select * from (values
      ('Electronics', array[
        'Smartphones', 'Laptops', 'Headphones', 'Smart Watches', 'Tablets',
        'Cameras', 'Speakers', 'Gaming Accessories', 'Computer Accessories', 'Televisions'
      ]),
      ('Fashion & Clothing', array[
        'Men''s Clothing', 'Women''s Clothing', 'Kids'' Clothing', 'Shoes',
        'Bags', 'Watches', 'Fashion Accessories'
      ]),
      ('Home & Kitchen', array[
        'Furniture', 'Kitchen Appliances', 'Cookware', 'Home Decor',
        'Lighting', 'Storage & Organization', 'Bedding', 'Cleaning Supplies'
      ]),
      ('Beauty & Personal Care', array[
        'Skincare', 'Makeup', 'Haircare', 'Fragrances',
        'Personal Hygiene', 'Men''s Grooming'
      ]),
      ('Sports & Outdoors', array[
        'Fitness Equipment', 'Sportswear', 'Camping Equipment', 'Cycling',
        'Outdoor Gear', 'Team Sports', 'Yoga Accessories'
      ]),
      ('Baby, Kids & Toys', array[
        'Baby Clothing', 'Baby Care', 'Educational Toys', 'Action Figures',
        'Dolls', 'Board Games', 'Outdoor Toys'
      ]),
      ('Grocery & Food', array[
        'Snacks', 'Beverages', 'Dairy Products', 'Bakery',
        'Fresh Foods', 'Packaged Foods', 'Cooking Essentials'
      ]),
      ('Health & Wellness', array[
        'Health Care Products', 'Personal Wellness', 'Medical Supplies',
        'Fitness & Nutrition', 'Wellness Equipment'
      ]),
      ('Books, Stationery & Office', array[
        'Books', 'Notebooks', 'Pens & Pencils', 'Office Supplies',
        'School Supplies', 'Office Equipment'
      ]),
      ('Automotive & Motorcycle', array[
        'Car Accessories', 'Motorcycle Accessories', 'Car Electronics',
        'Spare Parts', 'Automotive Tools', 'Vehicle Care'
      ]),
      ('Jewelry & Watches', array[
        'Necklaces', 'Rings', 'Earrings', 'Bracelets',
        'Watches', 'Jewelry Accessories'
      ]),
      ('Garden & Outdoor Living', array[
        'Gardening Tools', 'Plants', 'Outdoor Furniture',
        'Garden Decor', 'Watering Equipment'
      ]),
      ('Tools & Hardware', array[
        'Power Tools', 'Hand Tools', 'Electrical Supplies',
        'Plumbing Supplies', 'Safety Equipment', 'Building Materials'
      ]),
      ('Travel & Luggage', array[
        'Suitcases', 'Backpacks', 'Travel Bags',
        'Travel Accessories', 'Travel Organizers'
      ]),
      ('Pet Supplies', array[
        'Dog Supplies', 'Cat Supplies', 'Pet Food',
        'Pet Toys', 'Grooming Supplies', 'Pet Accessories'
      ]),
      ('Arts, Crafts & Hobbies', array[
        'Art Supplies', 'Painting Supplies', 'DIY Crafts',
        'Musical Instruments', 'Hobby Kits', 'Sewing & Knitting'
      ])
    ) as t(main_name, subs)
  loop
    select id
      into v_main_id
      from public.categories
     where parent_id is null
       and lower(name) = lower(v_group.main_name)
     limit 1;

    if v_main_id is not null then
      v_idx := 0;
      foreach v_sub in array v_group.subs
      loop
        v_idx := v_idx + 1;

        -- Skip if subcategory already exists under this main category
        if not exists (
          select 1
            from public.categories
           where parent_id = v_main_id
             and lower(name) = lower(v_sub)
        ) then
          -- Generate clean slug; if taken globally, scope with main category prefix
          v_sub_slug := trim(both '-' from regexp_replace(lower(v_sub), '[^a-z0-9]+', '-', 'g'));
          if exists (select 1 from public.categories where slug = v_sub_slug) then
            v_sub_slug := trim(both '-' from regexp_replace(lower(v_group.main_name), '[^a-z0-9]+', '-', 'g')) || '-' || v_sub_slug;
          end if;
          if exists (select 1 from public.categories where slug = v_sub_slug) then
            v_sub_slug := v_sub_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
          end if;

          insert into public.categories (
            name,
            slug,
            parent_id,
            is_active,
            sort_order
          ) values (
            v_sub,
            v_sub_slug,
            v_main_id,
            true,
            v_idx
          );
        end if;
      end loop;
    end if;
  end loop;
end $$;
