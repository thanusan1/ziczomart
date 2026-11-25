-- =========================================================
-- ZICZO MART - INITIAL DATABASE SCHEMA
-- Supabase PostgreSQL | Sri Lanka | Currency: LKR
-- =========================================================


-- 1. HELPER FUNCTION
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- 2. CUSTOMER PROFILES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- Admin checking function.
-- IMPORTANT: This function is created AFTER the profiles table.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- Automatically create customer profiles after registration.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- Create profiles for existing Auth users.

insert into public.profiles (id, full_name)
select
  id,
  nullif(trim(raw_user_meta_data ->> 'full_name'), '')
from auth.users
on conflict (id) do nothing;


-- 3. CATEGORIES
-- =========================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 4. PRODUCTS
-- =========================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text unique,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2)
    check (compare_at_price is null or compare_at_price >= 0),
  stock_quantity integer not null default 0
    check (stock_quantity >= 0),
  is_active boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 5. PRODUCT IMAGES
-- =========================================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);


-- 6. CUSTOMER ADDRESSES
-- =========================================================

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  district text,
  postal_code text,
  country text not null default 'Sri Lanka',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 7. SHOPPING CARTS
-- =========================================================

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 8. CART ITEMS
-- =========================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null
    references public.carts(id) on delete cascade,
  product_id uuid not null
    references public.products(id) on delete cascade,
  quantity integer not null default 1
    check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);


-- 9. ORDERS
-- =========================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null
    references auth.users(id) on delete restrict,
  status text not null default 'pending'
    check (status in (
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    )),
  payment_method text not null
    check (payment_method in ('cod', 'online')),
  payment_status text not null default 'pending'
    check (payment_status in (
      'pending',
      'paid',
      'failed',
      'refunded'
    )),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping_fee numeric(12, 2) not null default 0
    check (shipping_fee >= 0),
  discount numeric(12, 2) not null default 0
    check (discount >= 0),
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'LKR'
    check (currency = 'LKR'),
  shipping_full_name text not null,
  shipping_phone text not null,
  shipping_address_line_1 text not null,
  shipping_address_line_2 text,
  shipping_city text not null,
  shipping_district text,
  shipping_postal_code text,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 10. ORDER ITEMS
-- =========================================================

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete cascade,
  product_id uuid
    references public.products(id) on delete set null,
  product_name text not null,
  product_sku text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);


-- 11. PAYMENTS
-- =========================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete restrict,
  provider text,
  provider_reference text,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'LKR'
    check (currency = 'LKR'),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- 12. REVIEWS
-- =========================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null
    references public.products(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  order_id uuid not null
    references public.orders(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  title text,
  comment text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id, order_id)
);


-- 13. WISHLISTS
-- =========================================================

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id) on delete cascade,
  product_id uuid not null
    references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);


-- 14. INDEXES
-- =========================================================

create index if not exists products_category_id_idx
  on public.products(category_id);

create index if not exists products_active_idx
  on public.products(is_active);

create index if not exists products_featured_idx
  on public.products(is_featured);

create index if not exists product_images_product_id_idx
  on public.product_images(product_id);

create index if not exists addresses_user_id_idx
  on public.addresses(user_id);

create index if not exists cart_items_cart_id_idx
  on public.cart_items(cart_id);

create index if not exists orders_user_id_idx
  on public.orders(user_id);

create index if not exists orders_status_idx
  on public.orders(status);

create index if not exists orders_created_at_idx
  on public.orders(created_at desc);

create index if not exists order_items_order_id_idx
  on public.order_items(order_id);

create index if not exists payments_order_id_idx
  on public.payments(order_id);

create index if not exists reviews_product_id_idx
  on public.reviews(product_id);

create index if not exists wishlists_user_id_idx
  on public.wishlists(user_id);


-- 15. UPDATED_AT TRIGGERS
-- =========================================================

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists addresses_updated_at on public.addresses;
create trigger addresses_updated_at
before update on public.addresses
for each row execute procedure public.set_updated_at();

drop trigger if exists carts_updated_at on public.carts;
create trigger carts_updated_at
before update on public.carts
for each row execute procedure public.set_updated_at();

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at
before update on public.cart_items
for each row execute procedure public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
before update on public.payments
for each row execute procedure public.set_updated_at();

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
before update on public.reviews
for each row execute procedure public.set_updated_at();


-- 16. ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;


-- 17. PROFILES POLICIES
-- =========================================================

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Customers can update only their name and phone.
-- They cannot grant themselves admin privileges.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;


-- 18. CATEGORIES POLICIES
-- =========================================================

drop policy if exists "Anyone can view active categories" on public.categories;
create policy "Anyone can view active categories"
on public.categories for select to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 19. PRODUCTS POLICIES
-- =========================================================

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
on public.products for select to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 20. PRODUCT IMAGES POLICIES
-- =========================================================

drop policy if exists "Anyone can view images of active products" on public.product_images;
create policy "Anyone can view images of active products"
on public.product_images for select to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active = true
  )
);

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
on public.product_images for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 21. ADDRESS POLICIES
-- =========================================================

drop policy if exists "Users can view their own addresses" on public.addresses;
create policy "Users can view their own addresses"
on public.addresses for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can add their own addresses" on public.addresses;
create policy "Users can add their own addresses"
on public.addresses for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own addresses" on public.addresses;
create policy "Users can update their own addresses"
on public.addresses for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own addresses" on public.addresses;
create policy "Users can delete their own addresses"
on public.addresses for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can manage addresses" on public.addresses;
create policy "Admins can manage addresses"
on public.addresses for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 22. CART POLICIES
-- =========================================================

drop policy if exists "Users can view their own cart" on public.carts;
create policy "Users can view their own cart"
on public.carts for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own cart" on public.carts;
create policy "Users can create their own cart"
on public.carts for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own cart" on public.carts;
create policy "Users can update their own cart"
on public.carts for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own cart" on public.carts;
create policy "Users can delete their own cart"
on public.carts for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can manage carts" on public.carts;
create policy "Admins can manage carts"
on public.carts for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 23. CART ITEM POLICIES
-- =========================================================

drop policy if exists "Users can view items in their own cart" on public.cart_items;
create policy "Users can view items in their own cart"
on public.cart_items for select to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can add items to their own cart" on public.cart_items;
create policy "Users can add items to their own cart"
on public.cart_items for insert to authenticated
with check (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update items in their own cart" on public.cart_items;
create policy "Users can update items in their own cart"
on public.cart_items for update to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete items in their own cart" on public.cart_items;
create policy "Users can delete items in their own cart"
on public.cart_items for delete to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can manage cart items" on public.cart_items;
create policy "Admins can manage cart items"
on public.cart_items for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 24. ORDER POLICIES
-- =========================================================

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 25. ORDER ITEM POLICIES
-- =========================================================

drop policy if exists "Users can view their own order items" on public.order_items;
create policy "Users can view their own order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
on public.order_items for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 26. PAYMENT POLICIES
-- =========================================================

drop policy if exists "Users can view payments for their own orders" on public.payments;
create policy "Users can view payments for their own orders"
on public.payments for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = payments.order_id
      and orders.user_id = (select auth.uid())
  )
);

drop policy if exists "Admins can manage payments" on public.payments;
create policy "Admins can manage payments"
on public.payments for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 27. REVIEW POLICIES
-- =========================================================

drop policy if exists "Anyone can view published reviews" on public.reviews;
create policy "Anyone can view published reviews"
on public.reviews for select to anon, authenticated
using (is_published = true);

drop policy if exists "Users can submit reviews for their delivered purchases" on public.reviews;
create policy "Users can submit reviews for their delivered purchases"
on public.reviews for insert to authenticated
with check (
  user_id = (select auth.uid())
  and is_published = false
  and exists (
    select 1
    from public.orders
    join public.order_items
      on order_items.order_id = orders.id
    where orders.id = reviews.order_id
      and orders.user_id = (select auth.uid())
      and orders.status = 'delivered'
      and order_items.product_id = reviews.product_id
  )
);

drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews"
on public.reviews for update to authenticated
using (
  user_id = (select auth.uid())
  and is_published = false
)
with check (
  user_id = (select auth.uid())
  and is_published = false
);

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews"
on public.reviews for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- 28. WISHLIST POLICIES
-- =========================================================

drop policy if exists "Users can view their own wishlist" on public.wishlists;
create policy "Users can view their own wishlist"
on public.wishlists for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can add to their own wishlist" on public.wishlists;
create policy "Users can add to their own wishlist"
on public.wishlists for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can remove from their own wishlist" on public.wishlists;
create policy "Users can remove from their own wishlist"
on public.wishlists for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can manage wishlists" on public.wishlists;
create policy "Admins can manage wishlists"
on public.wishlists for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));


-- =========================================================
-- ZICZO MART INITIAL SCHEMA COMPLETE
-- =========================================================