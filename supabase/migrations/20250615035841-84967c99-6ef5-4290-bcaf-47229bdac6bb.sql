
-- Enable RLS on proposals table
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policy to allow everyone to view proposals (public governance)
CREATE POLICY "Anyone can view proposals"
ON public.proposals
FOR SELECT
USING (true);

-- Policy to allow authenticated users to create proposals
CREATE POLICY "Authenticated users can create proposals"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (creator_id = auth.uid()::text);

-- Policy to allow proposal creators to update their proposals
CREATE POLICY "Proposal creators can update their proposals"
ON public.proposals
FOR UPDATE
TO authenticated
USING (creator_id = auth.uid()::text);

-- Policy to allow anyone to view votes (public transparency)
CREATE POLICY "Anyone can view votes"
ON public.votes
FOR SELECT
USING (true);

-- Policy to allow authenticated users to cast votes
CREATE POLICY "Authenticated users can vote"
ON public.votes
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Policy to allow users to update their own votes
CREATE POLICY "Users can update their own votes"
ON public.votes
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text);

-- Create function to update vote tallies
CREATE OR REPLACE FUNCTION update_vote_tallies()
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

-- Create trigger for vote tallies
DROP TRIGGER IF EXISTS trigger_update_vote_tallies ON public.votes;
CREATE TRIGGER trigger_update_vote_tallies
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION update_vote_tallies();

-- Create function to update proposal counts in DAOs
CREATE OR REPLACE FUNCTION update_proposal_counts()
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

-- Create trigger for proposal counts
DROP TRIGGER IF EXISTS trigger_update_proposal_counts ON public.proposals;
CREATE TRIGGER trigger_update_proposal_counts
AFTER INSERT OR DELETE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION update_proposal_counts();
