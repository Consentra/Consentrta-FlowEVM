
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE proposal_status AS ENUM ('active', 'passed', 'failed', 'pending');
CREATE TYPE vote_type AS ENUM ('for', 'against', 'abstain');
CREATE TYPE dao_member_role AS ENUM ('admin', 'member', 'moderator');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  identity_nft_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DAOs table
CREATE TABLE public.daos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  token_address TEXT,
  governor_address TEXT,
  timelock_address TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  proposal_count INTEGER DEFAULT 0,
  treasury_value TEXT DEFAULT '0',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create DAO memberships table
CREATE TABLE public.dao_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role dao_member_role DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dao_id, user_id)
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status proposal_status DEFAULT 'pending',
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  quorum INTEGER DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  category TEXT,
  blockchain_proposal_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  dao_id UUID REFERENCES public.daos(id) ON DELETE CASCADE,
  vote vote_type NOT NULL,
  automated BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- Create AI agent configurations table
CREATE TABLE public.ai_agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  daisy_enabled BOOLEAN DEFAULT FALSE,
  daisy_automation_level TEXT DEFAULT 'balanced' CHECK (daisy_automation_level IN ('conservative', 'balanced', 'aggressive')),
  ethra_verbosity TEXT DEFAULT 'balanced' CHECK (ethra_verbosity IN ('concise', 'balanced', 'detailed')),
  confidence_threshold DECIMAL(3,2) DEFAULT 0.70,
  auto_voting_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification settings table
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email BOOLEAN DEFAULT TRUE,
  proposal_alerts BOOLEAN DEFAULT TRUE,
  voting_reminders BOOLEAN DEFAULT TRUE,
  ai_summaries BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI analysis table for proposals
CREATE TABLE public.proposal_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE UNIQUE,
  summary TEXT,
  confidence_score DECIMAL(3,2),
  predicted_outcome TEXT CHECK (predicted_outcome IN ('pass', 'fail')),
  reasoning TEXT,
  tags TEXT[],
  complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
  risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dao_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for DAOs
CREATE POLICY "Anyone can view active DAOs" ON public.daos FOR SELECT USING (is_active = true);
CREATE POLICY "DAO creators can update their DAOs" ON public.daos FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Authenticated users can create DAOs" ON public.daos FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for DAO memberships
CREATE POLICY "Users can view DAO memberships" ON public.dao_memberships FOR SELECT USING (true);
CREATE POLICY "DAO admins can manage memberships" ON public.dao_memberships FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.dao_memberships dm 
    WHERE dm.dao_id = dao_memberships.dao_id 
    AND dm.user_id = auth.uid() 
    AND dm.role = 'admin'
  )
);
CREATE POLICY "Users can join DAOs" ON public.dao_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for proposals
CREATE POLICY "Users can view proposals in DAOs they're members of" ON public.proposals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.dao_memberships dm 
    WHERE dm.dao_id = proposals.dao_id 
    AND dm.user_id = auth.uid()
  )
);
CREATE POLICY "DAO members can create proposals" ON public.proposals FOR INSERT WITH CHECK (
  auth.uid() = creator_id AND
  EXISTS (
    SELECT 1 FROM public.dao_memberships dm 
    WHERE dm.dao_id = proposals.dao_id 
    AND dm.user_id = auth.uid()
  )
);

-- RLS Policies for votes
CREATE POLICY "Users can view votes in their DAOs" ON public.votes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.dao_memberships dm 
    WHERE dm.dao_id = votes.dao_id 
    AND dm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert their own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for AI configs
CREATE POLICY "Users can manage own AI config" ON public.ai_agent_configs FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for notification settings
CREATE POLICY "Users can manage own notification settings" ON public.notification_settings FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for AI analysis
CREATE POLICY "Users can view AI analysis for proposals they can see" ON public.proposal_ai_analysis FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.proposals p
    JOIN public.dao_memberships dm ON dm.dao_id = p.dao_id
    WHERE p.id = proposal_ai_analysis.proposal_id
    AND dm.user_id = auth.uid()
  )
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  -- Create default AI agent config
  INSERT INTO public.ai_agent_configs (user_id)
  VALUES (NEW.id);
  
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update DAO member count
CREATE OR REPLACE FUNCTION public.update_dao_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.daos 
    SET member_count = member_count + 1,
        updated_at = NOW()
    WHERE id = NEW.dao_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.daos 
    SET member_count = member_count - 1,
        updated_at = NOW()
    WHERE id = OLD.dao_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for DAO member count updates
CREATE TRIGGER update_dao_member_count_on_insert
  AFTER INSERT ON public.dao_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_dao_member_count();

CREATE TRIGGER update_dao_member_count_on_delete
  AFTER DELETE ON public.dao_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_dao_member_count();

-- Create function to update proposal counts and vote tallies
CREATE OR REPLACE FUNCTION public.update_proposal_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update DAO proposal count
    UPDATE public.daos 
    SET proposal_count = proposal_count + 1,
        updated_at = NOW()
    WHERE id = NEW.dao_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update DAO proposal count
    UPDATE public.daos 
    SET proposal_count = proposal_count - 1,
        updated_at = NOW()
    WHERE id = OLD.dao_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for proposal count updates
CREATE TRIGGER update_proposal_count_on_insert
  AFTER INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_proposal_counts();

CREATE TRIGGER update_proposal_count_on_delete
  AFTER DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_proposal_counts();

-- Create function to update vote tallies
CREATE OR REPLACE FUNCTION public.update_vote_tallies()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.proposals
    SET 
      votes_for = CASE WHEN NEW.vote = 'for' THEN votes_for + 1 ELSE votes_for END,
      votes_against = CASE WHEN NEW.vote = 'against' THEN votes_against + 1 ELSE votes_against END,
      total_votes = total_votes + 1,
      updated_at = NOW()
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote changes
    UPDATE public.proposals
    SET 
      votes_for = votes_for + 
        CASE WHEN NEW.vote = 'for' THEN 1 ELSE 0 END -
        CASE WHEN OLD.vote = 'for' THEN 1 ELSE 0 END,
      votes_against = votes_against + 
        CASE WHEN NEW.vote = 'against' THEN 1 ELSE 0 END -
        CASE WHEN OLD.vote = 'against' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.proposals
    SET 
      votes_for = CASE WHEN OLD.vote = 'for' THEN votes_for - 1 ELSE votes_for END,
      votes_against = CASE WHEN OLD.vote = 'against' THEN votes_against - 1 ELSE votes_against END,
      total_votes = total_votes - 1,
      updated_at = NOW()
    WHERE id = OLD.proposal_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for vote tally updates
CREATE TRIGGER update_vote_tallies_on_insert
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_tallies();

CREATE TRIGGER update_vote_tallies_on_update
  AFTER UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_tallies();

CREATE TRIGGER update_vote_tallies_on_delete
  AFTER DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_vote_tallies();

-- Create indexes for better performance
CREATE INDEX idx_dao_memberships_dao_user ON public.dao_memberships(dao_id, user_id);
CREATE INDEX idx_proposals_dao_id ON public.proposals(dao_id);
CREATE INDEX idx_proposals_creator_id ON public.proposals(creator_id);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_votes_proposal_id ON public.votes(proposal_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
