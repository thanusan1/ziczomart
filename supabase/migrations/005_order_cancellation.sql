-- =========================================================
-- ZICZO MART - CUSTOMER & ADMIN ORDER CANCELLATION SYSTEM
-- Safe, idempotent migration preserving all existing orders.
-- =========================================================

-- 1. ADD CANCELLATION & WORKFLOW TIMESTAMPS TO public.orders
-- =========================================================
alter table public.orders
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists refund_status text not null default 'none';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_cancelled_by_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_cancelled_by_check
      check (cancelled_by is null or cancelled_by in ('customer', 'admin'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_refund_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_refund_status_check
      check (refund_status in ('none', 'pending_review', 'refunded'));
  end if;
end $$;

create index if not exists orders_cancelled_at_idx
  on public.orders(cancelled_at desc)
  where cancelled_at is not null;

-- 2. ENFORCE ORDER STATUS TRANSITIONS AT DATABASE LEVEL
-- =========================================================
create or replace function public.enforce_order_status_transitions()
returns trigger
language plpgsql
as $$
declare
  v_old text;
  v_new text;
begin
  v_old := lower(old.status);
  v_new := lower(new.status);

  if v_new = v_old then
    return new;
  end if;

  -- Terminal statuses cannot transition to any other status
  if v_old in ('cancelled', 'refunded') then
    raise exception 'Order is already % and cannot be changed to %.', v_old, v_new;
  end if;

  -- Validate allowed transitions
  if v_old = 'pending' and v_new not in ('confirmed', 'processing', 'cancelled') then
    raise exception 'Invalid order status transition from pending to %.', v_new;
  elsif v_old = 'confirmed' and v_new not in ('processing', 'cancelled') then
    raise exception 'Invalid order status transition from confirmed to %.', v_new;
  elsif v_old = 'processing' and v_new not in ('shipped') then
    raise exception 'Orders in processing can only move to shipped (cannot be cancelled or reverted).';
  elsif v_old = 'shipped' and v_new not in ('delivered') then
    raise exception 'Shipped orders can only move to delivered.';
  elsif v_old = 'delivered' and v_new not in ('refunded') then
    raise exception 'Delivered orders cannot move to %.', v_new;
  end if;

  -- Automatic timestamps and metadata
  if v_new = 'confirmed' then
    new.confirmed_at := coalesce(old.confirmed_at, now());
  end if;

  if v_new = 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, now());
    new.cancelled_by := coalesce(new.cancelled_by, 'admin');
    if lower(old.payment_status) = 'paid' and coalesce(new.refund_status, 'none') = 'none' then
      new.refund_status := 'pending_review';
    end if;
  end if;

  if v_new = 'refunded' then
    new.refund_status := 'refunded';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_enforce_status_transitions on public.orders;
create trigger orders_enforce_status_transitions
before update on public.orders
for each row execute procedure public.enforce_order_status_transitions();

-- 3. ATOMIC CUSTOMER CANCELLATION RPC (WITH ROW-LEVEL LOCK)
-- =========================================================
create or replace function public.cancel_customer_order(
  p_order_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_order record;
  v_clean_reason text;
  v_refund_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to cancel an order.';
  end if;

  -- Lock order row to prevent race conditions with concurrent admin updates
  select id, user_id, status, payment_status
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if v_order.user_id <> v_user_id then
    raise exception 'You are not authorized to cancel this order.';
  end if;

  if lower(v_order.payment_status) = 'refunded' then
    raise exception 'Cannot cancel an order that has already been refunded.';
  end if;

  if lower(v_order.status) = 'cancelled' then
    raise exception 'This order has already been cancelled.';
  end if;

  if lower(v_order.status) not in ('pending', 'confirmed') then
    raise exception 'This order can no longer be cancelled because it is already %.', lower(v_order.status);
  end if;

  v_clean_reason := nullif(left(trim(coalesce(p_reason, '')), 300), '');
  v_refund_status := case
    when lower(v_order.payment_status) = 'paid' then 'pending_review'
    else 'none'
  end;

  update public.orders
     set status = 'cancelled',
         cancellation_reason = v_clean_reason,
         cancelled_at = now(),
         cancelled_by = 'customer',
         refund_status = v_refund_status
   where id = p_order_id;

  return jsonb_build_object(
    'order_id', p_order_id,
    'status', 'cancelled',
    'refund_status', v_refund_status,
    'cancelled_at', now()
  );
end;
$$;

revoke all on function public.cancel_customer_order(uuid, text) from public;
grant execute on function public.cancel_customer_order(uuid, text) to authenticated;
