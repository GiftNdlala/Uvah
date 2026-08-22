-- Uvah profile-avatar bucket for Supabase Storage.
-- Run this once in Supabase Dashboard -> SQL Editor.
--
-- The Django backend authenticates Uvah users itself, so avatar uploads should
-- go through Django using the Supabase service-role credential. No anon or
-- authenticated-client write policy is created here. The service role bypasses
-- RLS, while untrusted mobile clients cannot replace another user's avatar.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Remove permissive policies with these Uvah-specific names if this script is
-- rerun. Intentionally do not recreate client-side INSERT/UPDATE/DELETE rules.
drop policy if exists "uvah_avatar_client_insert" on storage.objects;
drop policy if exists "uvah_avatar_client_update" on storage.objects;
drop policy if exists "uvah_avatar_client_delete" on storage.objects;

commit;

-- Recommended object layout used by the backend:
-- avatars/<django-user-id>/<generated-filename>.jpg
--
-- Public URL format:
-- https://<project-ref>.supabase.co/storage/v1/object/public/avatars/<object-path>
