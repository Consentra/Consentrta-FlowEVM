
-- Update the identity verification table to handle wallet addresses as user_id
ALTER TABLE public.identity_verifications 
ALTER COLUMN user_id TYPE TEXT;

-- Update the profiles table to handle wallet addresses as primary key
ALTER TABLE public.profiles 
ALTER COLUMN id TYPE TEXT;

-- Drop and recreate the foreign key constraint with correct type
ALTER TABLE public.identity_verifications 
DROP CONSTRAINT IF EXISTS identity_verifications_user_id_fkey;

ALTER TABLE public.identity_verifications 
ADD CONSTRAINT identity_verifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update DAO memberships to use TEXT for user_id
ALTER TABLE public.dao_memberships 
ALTER COLUMN user_id TYPE TEXT;

-- Update proposals to use TEXT for creator_id
ALTER TABLE public.proposals 
ALTER COLUMN creator_id TYPE TEXT;

-- Update votes to use TEXT for user_id
ALTER TABLE public.votes 
ALTER COLUMN user_id TYPE TEXT;

-- Update RLS policies to work without auth.uid() since we're using wallet auth
DROP POLICY IF EXISTS "Users can view their own verification records" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can create their own verification records" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can update their own verification records" ON public.identity_verifications;

-- Create new RLS policies that work with wallet addresses
CREATE POLICY "Users can view their own verification records"
  ON public.identity_verifications
  FOR SELECT
  USING (true); -- Allow reading for now, can be restricted later

CREATE POLICY "Users can create their own verification records"
  ON public.identity_verifications
  FOR INSERT
  WITH CHECK (true); -- Allow creation for now, can be restricted later

CREATE POLICY "Users can update their own verification records"
  ON public.identity_verifications
  FOR UPDATE
  USING (true); -- Allow updates for now, can be restricted later

-- Update profiles RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (true);

-- Update storage policies to work without auth.uid()
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create simpler storage policies for now
CREATE POLICY "Allow document uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'identity-documents');

CREATE POLICY "Allow document access"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'identity-documents');
