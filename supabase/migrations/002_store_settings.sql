-- =========================================================
-- ZICZO MART - STOREFRONT & PROMOTIONS SETTINGS
-- =========================================================

create table if not exists public.store_settings (
  id text primary key default 'default',
  announcement_1 text not null default 'Free Delivery on Orders Over Rs. 5,000',
  announcement_2 text not null default 'Up to 50% Off – Special Deals!',
  announcement_3 text not null default 'Easy Returns Within 30 Days',
  announcement_mobile text not null default 'Free Delivery on Orders Over Rs. 5,000 · Cash on Delivery',
  announcement_link text not null default '/products?deals=true',
  promo_title text not null default 'Upgrade Your Everyday',
  promo_subtitle text not null default 'Discover products that make life better.',
  promo_cta_label text not null default 'Explore Now',
  promo_cta_href text not null default '/products',
  promo_image_url text,
  show_categories boolean not null default true,
  title_categories text not null default 'Shop by Category',
  show_deals boolean not null default true,
  title_deals text not null default 'Today''s Best Deals',
  show_featured boolean not null default true,
  title_featured text not null default 'Featured Products',
  show_new_arrivals boolean not null default true,
  title_new_arrivals text not null default 'New Arrivals',
  show_best_sellers boolean not null default true,
  title_best_sellers text not null default 'Best Sellers',
  updated_at timestamptz not null default now()
);

alter table public.store_settings
  add column if not exists show_categories boolean not null default true,
  add column if not exists title_categories text not null default 'Shop by Category',
  add column if not exists show_deals boolean not null default true,
  add column if not exists title_deals text not null default 'Today''s Best Deals',
  add column if not exists show_featured boolean not null default true,
  add column if not exists title_featured text not null default 'Featured Products',
  add column if not exists show_new_arrivals boolean not null default true,
  add column if not exists title_new_arrivals text not null default 'New Arrivals',
  add column if not exists show_best_sellers boolean not null default true,
  add column if not exists title_best_sellers text not null default 'Best Sellers';

alter table public.products
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_new_arrival boolean not null default false,
  add column if not exists is_best_deal boolean not null default false;

drop trigger if exists store_settings_updated_at on public.store_settings;
create trigger store_settings_updated_at
before update on public.store_settings
for each row execute procedure public.set_updated_at();

alter table public.store_settings enable row level security;

drop policy if exists "Anyone can view store settings" on public.store_settings;
create policy "Anyone can view store settings"
on public.store_settings for select to anon, authenticated
using (true);

drop policy if exists "Admins can manage store settings" on public.store_settings;
create policy "Admins can manage store settings"
on public.store_settings for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.store_settings (id)
values ('default')
on conflict (id) do nothing;
