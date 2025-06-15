
-- Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'in_progress', 'verified', 'rejected');

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('passport', 'drivers_license', 'national_id');

-- Create table for identity verification records
CREATE TABLE public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  document_type document_type NOT NULL,
  document_url TEXT,
  selfie_url TEXT,
  verification_hash TEXT UNIQUE,
  status verification_status DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  nft_token_id INTEGER,
  nft_transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on identity_verifications
ALTER TABLE public.identity_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for identity_verifications
CREATE POLICY "Users can view their own verification records"
  ON public.identity_verifications
  FOR SELECT
  USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create their own verification records"
  ON public.identity_verifications
  FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own verification records"
  ON public.identity_verifications
  FOR UPDATE
  USING (user_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

-- Update profiles table to include verification status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS soulbound_nft_token_id INTEGER,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMP WITH TIME ZONE;

-- Create function to update profile verification status
CREATE OR REPLACE FUNCTION public.update_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    UPDATE public.profiles 
    SET 
      verification_status = 'verified',
      is_verified = true,
      soulbound_nft_token_id = NEW.nft_token_id,
      verification_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.profiles 
    SET 
      verification_status = 'rejected',
      is_verified = false,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update profile when verification status changes
CREATE TRIGGER update_profile_on_verification_change
  AFTER UPDATE ON public.identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_verification();

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for verification documents storage
CREATE POLICY "Users can upload their verification documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their verification documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to check if user is verified (for RLS policies)
CREATE OR REPLACE FUNCTION public.is_user_verified(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_verified FROM public.profiles WHERE id = user_id),
    false
  );
$$;
