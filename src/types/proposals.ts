
export interface Proposal {
  id: string;
  title: string;
  description: string | null;
  dao_id: string;
  creator_id: string | null;
  status: 'active' | 'passed' | 'failed' | 'pending';
  votes_for: number;
  votes_against: number;
  total_votes: number;
  quorum: number;
  deadline: string | null;
  category: string | null;
  blockchain_proposal_id: string | null;
  created_at: string;
  updated_at: string;
  daos?: {
    name: string;
    id: string;
  } | null;
}

export interface Vote {
  id: string;
  proposal_id: string;
  user_id: string;
  dao_id: string;
  vote: 'for' | 'against' | 'abstain';
  automated: boolean;
  timestamp: string;
}

export interface VotingPreference {
  id: string;
  category: string;
  stance: 'for' | 'against' | 'abstain';
  weight: number;
}

export interface AIVotingConfig {
  autoVotingEnabled: boolean;
  daisyAutomation: 'conservative' | 'balanced' | 'aggressive';
  confidenceThreshold: number;
  votingDelay: number;
  preferences: VotingPreference[];
}

export interface ProposalForVoting {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: Date;
  aiAnalysis?: {
    confidenceScore: number;
    predictedOutcome: 'pass' | 'fail';
    reasoning: string;
  };
}
