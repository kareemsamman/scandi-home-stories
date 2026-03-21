-- Add email column to profiles for reliable phone→email login resolution
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
