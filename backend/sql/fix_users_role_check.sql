-- Run this in Supabase SQL editor to align roles with app code.
-- This expands the allowed values for public.users.role.

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('employee', 'manager', 'hr', 'admin'));

