import { APIResponse, ProposalData, DAOData, UserProfile, AIAnalysis } from '@/types/backend';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  }

  // Proposals
  async getProposals(filters?: {
    status?: string;
    dao?: string;
    category?: string;
    offset?: number;
    limit?: number;
  }): Promise<APIResponse<ProposalData[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return this.request<ProposalData[]>(`/proposals?${params}`);
  }

  async getProposal(id: string): Promise<APIResponse<ProposalData>> {
    return this.request<ProposalData>(`/proposals/${id}`);
  }

  async createProposal(data: Partial<ProposalData>): Promise<APIResponse<ProposalData>> {
    return this.request<ProposalData>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // DAOs
  async getDAOs(filters?: {
    category?: string;
    offset?: number;
    limit?: number;
  }): Promise<APIResponse<DAOData[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return this.request<DAOData[]>(`/daos?${params}`);
  }

  async getDAO(id: string): Promise<APIResponse<DAOData>> {
    return this.request<DAOData>(`/daos/${id}`);
  }

  async createDAO(data: Partial<DAOData>): Promise<APIResponse<DAOData>> {
    return this.request<DAOData>('/daos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Votes - NEW METHOD
  async getVotes(filters?: {
    proposal_id?: string;
    dao_id?: string;
    user_id?: string;
    offset?: number;
    limit?: number;
  }): Promise<APIResponse<any[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return this.request<any[]>(`/votes?${params}`);
  }

  // User Profile
  async getUserProfile(address: string): Promise<APIResponse<UserProfile>> {
    return this.request<UserProfile>(`/users/${address}`);
  }

  async updateUserProfile(
    address: string, 
    data: Partial<UserProfile>
  ): Promise<APIResponse<UserProfile>> {
    return this.request<UserProfile>(`/users/${address}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // AI Analysis
  async getAIAnalysis(proposalId: string): Promise<APIResponse<AIAnalysis>> {
    return this.request<AIAnalysis>(`/ai/analysis/${proposalId}`);
  }

  async requestAISummary(proposalId: string): Promise<APIResponse<string>> {
    return this.request<string>(`/ai/summarize/${proposalId}`, {
      method: 'POST',
    });
  }

  async chatWithAI(
    agent: 'daisy' | 'ethra',
    message: string,
    context?: any
  ): Promise<APIResponse<string>> {
    return this.request<string>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ agent, message, context }),
    });
  }

  // Enhanced Voting methods
  async submitVote(
    proposalId: string,
    vote: 'for' | 'against' | 'abstain',
    automated: boolean = false,
    reason?: string
  ): Promise<APIResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>('/votes', {
      method: 'POST',
      body: JSON.stringify({ proposalId, vote, automated, reason }),
    });
  }

  // AI Voting Configuration
  async saveAIVotingConfig(config: {
    autoVotingEnabled: boolean;
    daisyAutomation: 'conservative' | 'balanced' | 'aggressive';
    confidenceThreshold: number;
    votingDelay: number;
    preferences: Array<{
      category: string;
      stance: 'for' | 'against' | 'abstain';
      weight: number;
    }>;
  }): Promise<APIResponse<void>> {
    return this.request<void>('/ai/voting-config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getAIVotingConfig(userAddress: string): Promise<APIResponse<any>> {
    return this.request<any>(`/ai/voting-config/${userAddress}`);
  }

  // Blockchain Integration
  async scheduleAIVote(
    proposalId: string,
    userAddress: string,
    category: string
  ): Promise<APIResponse<{ scheduled: boolean; executeAt: number }>> {
    return this.request<{ scheduled: boolean; executeAt: number }>('/ai/schedule-vote', {
      method: 'POST',
      body: JSON.stringify({ proposalId, userAddress, category }),
    });
  }

  async executeAIVote(
    proposalId: string,
    userAddress: string,
    category: string
  ): Promise<APIResponse<{ transactionHash: string; vote: string }>> {
    return this.request<{ transactionHash: string; vote: string }>('/ai/execute-vote', {
      method: 'POST',
      body: JSON.stringify({ proposalId, userAddress, category }),
    });
  }

  async getContractInteraction(
    contractAddress: string,
    method: string,
    params: any[]
  ): Promise<APIResponse<any>> {
    return this.request<any>('/blockchain/interact', {
      method: 'POST',
      body: JSON.stringify({ contractAddress, method, params }),
    });
  }

  // Real-time updates
  async subscribeToProposalUpdates(proposalId: string): Promise<APIResponse<void>> {
    return this.request<void>(`/realtime/proposals/${proposalId}/subscribe`, {
      method: 'POST',
    });
  }

  async subscribeToDAOUpdates(daoId: string): Promise<APIResponse<void>> {
    return this.request<void>(`/realtime/daos/${daoId}/subscribe`, {
      method: 'POST',
    });
  }

  // Identity Verification
  async submitVerification(data: {
    fullName: string;
    email: string;
    documentType: string;
    documentFile: File;
    selfieFile: File;
  }): Promise<APIResponse<{ verified: boolean; nftId?: number }>> {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('documentType', data.documentType);
    formData.append('document', data.documentFile);
    formData.append('selfie', data.selfieFile);

    return this.request<{ verified: boolean; nftId?: number }>('/identity/verify', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to allow FormData to set it
    });
  }

  // Analytics
  async getGovernanceMetrics(address: string): Promise<APIResponse<any>> {
    return this.request<any>(`/analytics/governance/${address}`);
  }

  async getEcosystemStats(): Promise<APIResponse<any>> {
    return this.request<any>('/analytics/ecosystem');
  }
}

export const apiClient = new APIClient();
