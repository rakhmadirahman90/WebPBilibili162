-- Payment fields for tournament registration.
-- Run this migration in the Supabase SQL editor for the project used by WebPBilibili162.

alter table public.pendaftaran
  add column if not exists nominal_pendaftaran numeric(12,2) not null default 0,
  add column if not exists status_pembayaran text not null default 'Belum Bayar',
  add column if not exists dibayar_pada timestamptz;

update public.pendaftaran
set status_pembayaran = case
  when lower(coalesce(status_pembayaran, '')) in ('lunas', 'paid', 'terverifikasi', 'verified', 'dibayar', 'settled') then 'Lunas'
  else 'Belum Bayar'
end
where status_pembayaran is null or trim(status_pembayaran) = '';

alter table public.pendaftaran
  drop constraint if exists pendaftaran_status_pembayaran_check;

alter table public.pendaftaran
  add constraint pendaftaran_status_pembayaran_check
  check (status_pembayaran in ('Lunas', 'Belum Bayar'));

create index if not exists idx_pendaftaran_status_pembayaran
  on public.pendaftaran(status_pembayaran);
