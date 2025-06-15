
import { AIVotingConfig } from '@/types/proposals';

const API_BASE_URL = 'https://ubshntkfzkptcworxtdb.supabase.co/functions/v1';

class RealAPIClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVic2hudGtmemtwdGN3b3J4dGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDE5OTIsImV4cCI6MjA2NTMxNzk5Mn0.3HBoofYDZWaWkIX02QU_zjC-T7NTE1vHW_YhV0Tu_o4`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async scheduleAIVote(proposalId: string, userAddress: string, category: string): Promise<void> {
    console.log(`Scheduling AI vote for proposal ${proposalId} by user ${userAddress} in category ${category}`);
    await this.request('/ai-voting-schedule', {
      method: 'POST',
      body: JSON.stringify({ proposalId, userAddress, category }),
    });
  }

  async executeAIVote(proposalId: string, userAddress: string, category: string): Promise<void> {
    console.log(`Executing AI vote for proposal ${proposalId} by user ${userAddress} in category ${category}`);
    await this.request('/ai-voting-execute', {
      method: 'POST',
      body: JSON.stringify({ proposalId, userAddress, category }),
    });
  }

  async saveAIVotingConfig(config: AIVotingConfig): Promise<void> {
    console.log('Saving AI voting config to backend:', config);
    await this.request('/ai-voting-config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getAIVotingConfig(userAddress: string): Promise<AIVotingConfig | null> {
    try {
      const config = await this.request<AIVotingConfig>(`/ai-voting-config/${userAddress}`);
      return config;
    } catch (error) {
      console.error('Failed to get AI voting config:', error);
      return null;
    }
  }

  async analyzeProposal(proposalId: string, content: string): Promise<{
    confidenceScore: number;
    predictedOutcome: 'pass' | 'fail';
    reasoning: string;
  }> {
    return await this.request('/ai-proposal-analysis', {
      method: 'POST',
      body: JSON.stringify({ proposalId, content }),
    });
  }
}

export const apiClient = new RealAPIClient();
