-- SSEINY'S V8 — Supabase SQL setup
-- Run this file in Supabase Dashboard > SQL Editor as project owner.
create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','member')) default 'member',
  created_at timestamptz not null default now()
);
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin'); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  category text not null,
  service_or_product text not null,
  details text,
  payment_method text,
  status text not null default 'new' check (status in ('new','processing','paid','completed','cancelled')),
  source_page text,
  created_at timestamptz not null default now()
);
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  referrer text,
  created_at timestamptz not null default now()
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.content_media (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('project','partner')),
  content_slug text not null,
  title text not null,
  image_url text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.orders enable row level security;
alter table public.page_views enable row level security;
alter table public.announcements enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.gallery_items enable row level security;
alter table public.content_media enable row level security;

-- Roles: each signed-in user can read only their own role; only admins can manage roles.
drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles for select to authenticated using (user_id=auth.uid() or public.is_admin());
drop policy if exists "admin manage roles" on public.user_roles;
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public can submit orders; only admins can read and update them.
drop policy if exists "public submit orders" on public.orders;
create policy "public submit orders" on public.orders for insert to anon, authenticated with check (status='new');
drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anonymous analytics insert only; read restricted to admins.
drop policy if exists "public record page views" on public.page_views;
create policy "public record page views" on public.page_views for insert to anon, authenticated with check (length(path)<500);
drop policy if exists "admin read page views" on public.page_views;
create policy "admin read page views" on public.page_views for select to authenticated using (public.is_admin());

-- Published announcements are public; only admins can write/manage.
drop policy if exists "public read published announcements" on public.announcements;
create policy "public read published announcements" on public.announcements for select to anon, authenticated using (is_published=true or public.is_admin());
drop policy if exists "admin manage announcements" on public.announcements;
create policy "admin manage announcements" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Newsletter signups are public insert; admin-only read/manage.
drop policy if exists "public subscribe newsletter" on public.newsletter_subscribers;
create policy "public subscribe newsletter" on public.newsletter_subscribers for insert to anon, authenticated with check (length(email)<320);
drop policy if exists "admin manage subscribers" on public.newsletter_subscribers;
create policy "admin manage subscribers" on public.newsletter_subscribers for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Published gallery is public; only admins can manage.
drop policy if exists "public read published gallery" on public.gallery_items;
create policy "public read published gallery" on public.gallery_items for select to anon, authenticated using (is_published=true or public.is_admin());
drop policy if exists "admin manage gallery" on public.gallery_items;
create policy "admin manage gallery" on public.gallery_items for all to authenticated using (public.is_admin()) with check (public.is_admin());


drop policy if exists "public read published content media" on public.content_media;
create policy "public read published content media" on public.content_media for select to anon, authenticated using (is_published=true or public.is_admin());
drop policy if exists "admin manage content media" on public.content_media;
create policy "admin manage content media" on public.content_media for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin-only aggregate views. Counts are computed from real records.
create or replace view public.admin_analytics_daily with (security_invoker=true) as
select date_trunc('day',d)::date as day,
 (select count(*) from public.page_views p where p.created_at>=d and p.created_at<d+interval '1 day') as visits,
 (select count(*) from public.orders o where o.created_at>=d and o.created_at<d+interval '1 day') as orders,
 (select count(*) from public.orders o where o.created_at>=d and o.created_at<d+interval '1 day' and o.status in ('paid','completed')) as paid_orders
from generate_series(date_trunc('day',now())-interval '29 days',date_trunc('day',now()),interval '1 day') d;
create or replace view public.admin_analytics_monthly with (security_invoker=true) as
select date_trunc('month',d)::date as month,
 (select count(*) from public.page_views p where date_trunc('month',p.created_at)=date_trunc('month',d)) as visits,
 (select count(*) from public.orders o where date_trunc('month',o.created_at)=date_trunc('month',d)) as orders,
 (select count(*) from public.orders o where date_trunc('month',o.created_at)=date_trunc('month',d) and o.status in ('paid','completed')) as paid_orders
from generate_series(date_trunc('month',now())-interval '11 months',date_trunc('month',now()),interval '1 month') d;
create or replace view public.admin_analytics_yearly with (security_invoker=true) as
select date_trunc('year',d)::date as year,
 (select count(*) from public.page_views p where date_trunc('year',p.created_at)=date_trunc('year',d)) as visits,
 (select count(*) from public.orders o where date_trunc('year',o.created_at)=date_trunc('year',d)) as orders,
 (select count(*) from public.orders o where date_trunc('year',o.created_at)=date_trunc('year',d) and o.status in ('paid','completed')) as paid_orders
from generate_series(date_trunc('year',now())-interval '4 years',date_trunc('year',now()),interval '1 year') d;
revoke all on public.admin_analytics_daily,public.admin_analytics_monthly,public.admin_analytics_yearly from anon,authenticated;
grant select on public.admin_analytics_daily,public.admin_analytics_monthly,public.admin_analytics_yearly to authenticated;

-- Explicit API grants. RLS policies above still decide which rows each role may access.
grant select on public.user_roles to authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;
grant insert on public.page_views to anon, authenticated;
grant select on public.page_views to authenticated;
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select, update, delete on public.newsletter_subscribers to authenticated;
grant select on public.gallery_items to anon, authenticated;
grant insert, update, delete on public.gallery_items to authenticated;
grant select on public.content_media to anon, authenticated;
grant insert, update, delete on public.content_media to authenticated;

create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists page_views_created_at_idx on public.page_views(created_at desc);
create index if not exists announcements_published_at_idx on public.announcements(published_at desc) where is_published=true;
create index if not exists gallery_items_created_at_idx on public.gallery_items(created_at desc);
create index if not exists content_media_lookup_idx on public.content_media(content_type,content_slug,created_at desc);

-- Enable realtime for announcements so open pages receive live updates (safe to re-run).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='announcements') then
    alter publication supabase_realtime add table public.announcements;
  end if;
end $$;


-- Public, read-only aggregate for homepage counters (no customer information exposed).
create or replace function public.public_home_stats()
returns table(month_visits bigint, month_orders bigint, published_announcements bigint)
language sql stable security definer set search_path=public
as $$
  select
    (select count(*) from public.page_views where created_at >= date_trunc('month', now())),
    (select count(*) from public.orders where created_at >= date_trunc('month', now())),
    (select count(*) from public.announcements where is_published=true);
$$;
revoke all on function public.public_home_stats() from public;
grant execute on function public.public_home_stats() to anon, authenticated;
