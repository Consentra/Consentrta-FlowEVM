
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ProposalData {
  id: string;
  title: string;
  description: string;
  dao: string;
  creator: string;
  status: 'active' | 'passed' | 'failed' | 'pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  quorum: number;
  deadline: Date;
  createdAt: Date;
  category: string;
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  summary: string;
  confidenceScore: number;
  predictedOutcome: 'pass' | 'fail';
  reasoning: string;
  tags: string[];
  complexityScore: number;
  riskScore: number;
}

export interface DAOData {
  id: string;
  name: string;
  description: string;
  tokenAddress: string;
  governorAddress: string;
  timelockAddress: string;
  creator: string;
  memberCount: number;
  proposalCount: number;
  treasuryValue: string;
  createdAt: Date;
}

export interface UserProfile {
  address: string;
  displayName: string;
  email: string;
  bio: string;
  isVerified: boolean;
  identityNFTId?: number;
  joinedDAOs: string[];
  votingHistory: VoteRecord[];
  createdProposals: string[];
}

export interface VoteRecord {
  proposalId: string;
  dao: string;
  vote: 'for' | 'against' | 'abstain';
  timestamp: Date;
  automated: boolean;
}

export interface AIAgentConfig {
  daisyEnabled: boolean;
  daisyAutomationLevel: 'conservative' | 'balanced' | 'aggressive';
  ethraVerbosity: 'concise' | 'balanced' | 'detailed';
  confidenceThreshold: number;
  autoVotingEnabled: boolean;
}

export interface NotificationSettings {
  email: boolean;
  proposalAlerts: boolean;
  votingReminders: boolean;
  aiSummaries: boolean;
}

export interface GovernanceMetrics {
  totalVotes: number;
  participationRate: number;
  proposalsCreated: number;
  successRate: number;
  averageVotingTime: string;
  governanceScore: number;
}
