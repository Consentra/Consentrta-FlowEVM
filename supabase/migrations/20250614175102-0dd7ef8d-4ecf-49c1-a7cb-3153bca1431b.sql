
-- Drop ALL foreign key constraints that might reference profiles or other tables
ALTER TABLE public.identity_verifications DROP CONSTRAINT IF EXISTS identity_verifications_user_id_fkey;
ALTER TABLE public.dao_memberships DROP CONSTRAINT IF EXISTS dao_memberships_user_id_fkey;
ALTER TABLE public.dao_memberships DROP CONSTRAINT IF EXISTS dao_memberships_dao_id_fkey;
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_creator_id_fkey;
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_dao_id_fkey;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_proposal_id_fkey;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_dao_id_fkey;
ALTER TABLE public.ai_agent_configs DROP CONSTRAINT IF EXISTS ai_agent_configs_user_id_fkey;
ALTER TABLE public.notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;
ALTER TABLE public.proposal_ai_analysis DROP CONSTRAINT IF EXISTS proposal_ai_analysis_proposal_id_fkey;

-- Drop the profiles foreign key constraint and daos creator constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.daos DROP CONSTRAINT IF EXISTS daos_creator_id_fkey;

-- Drop ALL RLS policies that might reference user_id or creator_id columns
DROP POLICY IF EXISTS "Users can view their own verification records" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can create their own verification records" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can update their own verification records" ON public.identity_verifications;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view active DAOs" ON public.daos;
DROP POLICY IF EXISTS "DAO creators can update their DAOs" ON public.daos;
DROP POLICY IF EXISTS "Authenticated users can create DAOs" ON public.daos;
DROP POLICY IF EXISTS "DAO admins can manage memberships" ON public.dao_memberships;
DROP POLICY IF EXISTS "Users can join DAOs" ON public.dao_memberships;
DROP POLICY IF EXISTS "Users can view DAO memberships" ON public.dao_memberships;
DROP POLICY IF EXISTS "Users can manage memberships" ON public.dao_memberships;
DROP POLICY IF EXISTS "Users can view proposals in DAOs they're members of" ON public.proposals;
DROP POLICY IF EXISTS "DAO members can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view votes in their DAOs" ON public.votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;
DROP POLICY IF EXISTS "Users can cast votes" ON public.votes;
DROP POLICY IF EXISTS "Users can update votes" ON public.votes;
DROP POLICY IF EXISTS "Users can view AI analysis for proposals they can see" ON public.proposal_ai_analysis;
DROP POLICY IF EXISTS "Users can manage own AI config" ON public.ai_agent_configs;
DROP POLICY IF EXISTS "Users can manage own notification settings" ON public.notification_settings;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow document uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow document access" ON storage.objects;
DROP POLICY IF EXISTS "Allow document updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow document deletions" ON storage.objects;

-- Now alter column types to TEXT
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.identity_verifications ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.dao_memberships ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.daos ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE public.proposals ALTER COLUMN creator_id TYPE TEXT;
ALTER TABLE public.votes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.ai_agent_configs ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.notification_settings ALTER COLUMN user_id TYPE TEXT;

-- Recreate the foreign key constraint for identity_verifications
ALTER TABLE public.identity_verifications 
ADD CONSTRAINT identity_verifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create storage bucket for identity verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Recreate simplified RLS policies for wallet authentication
CREATE POLICY "Users can view their own verification records"
  ON public.identity_verifications FOR SELECT USING (true);

CREATE POLICY "Users can create their own verification records"
  ON public.identity_verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own verification records"
  ON public.identity_verifications FOR UPDATE USING (true);

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can create profiles"
  ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update profiles"
  ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Anyone can view active DAOs"
  ON public.daos FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create DAOs"
  ON public.daos FOR INSERT WITH CHECK (true);

CREATE POLICY "DAO creators can update their DAOs"
  ON public.daos FOR UPDATE USING (true);

CREATE POLICY "Users can view DAO memberships"
  ON public.dao_memberships FOR SELECT USING (true);

CREATE POLICY "Users can join DAOs"
  ON public.dao_memberships FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage memberships"
  ON public.dao_memberships FOR ALL USING (true);

CREATE POLICY "Users can view all proposals"
  ON public.proposals FOR SELECT USING (true);

CREATE POLICY "Users can create proposals"
  ON public.proposals FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all votes"
  ON public.votes FOR SELECT USING (true);

CREATE POLICY "Users can cast votes"
  ON public.votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update votes"
  ON public.votes FOR UPDATE USING (true);

-- Create storage policies for identity documents
CREATE POLICY "Allow document uploads"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'identity-documents');

CREATE POLICY "Allow document access"
  ON storage.objects FOR SELECT USING (bucket_id = 'identity-documents');

CREATE POLICY "Allow document updates"
  ON storage.objects FOR UPDATE USING (bucket_id = 'identity-documents');

CREATE POLICY "Allow document deletions"
  ON storage.objects FOR DELETE USING (bucket_id = 'identity-documents');
