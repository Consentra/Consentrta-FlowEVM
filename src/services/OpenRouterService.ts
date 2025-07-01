
interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    type: string;
  };
}

class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: OpenRouterMessage[], model: string = 'anthropic/claude-3.5-sonnet'): Promise<string> {
    try {
      console.log('OpenRouter API call:', {
        model,
        messageCount: messages.length,
        apiKeyExists: !!this.apiKey
      });

      if (!this.apiKey) {
        throw new Error('OpenRouter API key is missing');
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Consenstra DAO'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1500,
          stream: false
        })
      });

      console.log('OpenRouter response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (data.error) {
        console.error('OpenRouter API returned error:', data.error);
        throw new Error(`OpenRouter API error: ${data.error.message}`);
      }

      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('No content in OpenRouter response:', data);
        throw new Error('No response content from OpenRouter API');
      }

      console.log('OpenRouter response received:', content.substring(0, 100) + '...');
      return content;

    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  async analyzeGovernanceData(
    userMessage: string,
    context: {
      proposals?: any[];
      daos?: any[];
      ecosystemStats?: any;
      conversationHistory?: any[];
    }
  ): Promise<string> {
    try {
      console.log('Analyzing governance data:', {
        userMessage: userMessage.substring(0, 50) + '...',
        proposalsCount: context.proposals?.length || 0,
        daosCount: context.daos?.length || 0,
        hasEcosystemStats: !!context.ecosystemStats
      });

      // Create detailed context summary with actual data
      const proposalDetails = context.proposals?.slice(0, 10).map(p => ({
        title: p.title,
        status: p.status,
        votesFor: p.votes_for || 0,
        votesAgainst: p.votes_against || 0,
        totalVotes: p.total_votes || 0,
        category: p.category,
        deadline: p.deadline
      })) || [];

      const daoDetails = context.daos?.slice(0, 5).map(d => ({
        name: d.name,
        memberCount: d.member_count || 0,
        treasuryValue: d.treasury_value || '0',
        proposalCount: d.proposal_count || 0
      })) || [];

      const platformData = {
        proposals: proposalDetails,
        daos: daoDetails,
        ecosystemStats: context.ecosystemStats || null,
        totalProposals: context.proposals?.length || 0,
        totalDAOs: context.daos?.length || 0,
        timestamp: new Date().toISOString()
      };

      const systemPrompt = `You are Ethra, an expert AI governance analyst for the Consenstra DAO platform. You have access to REAL-TIME platform data and must provide accurate, data-driven responses about this specific platform.

CURRENT CONSENSTRA PLATFORM DATA:
${JSON.stringify(platformData, null, 2)}

INSTRUCTIONS:
- You are specifically analyzing the Consenstra DAO platform
- Use ONLY the actual data provided above in your responses
- When discussing proposals, reference the actual proposal titles, vote counts, and statuses from the data
- When discussing DAOs, reference the actual DAO names, member counts, and treasury values
- Be specific with numbers and cite the exact data you're referencing
- If asked about trends, calculate based on the real data provided
- If the data shows no activity, explain what you see explicitly
- Always mention you're analyzing "Consenstra platform data" to be clear
- Provide insights and analysis based on the actual numbers
- If asked general governance questions, relate them back to what you see in the Consenstra data

Your role is to:
- Analyze real Consenstra proposal data with specific vote counts and status
- Explain governance patterns based on actual Consenstra platform activity  
- Provide insights using the current Consenstra ecosystem statistics
- Help users understand the Consenstra platform's current state accurately
- Answer questions about DAO governance in the context of what you see on Consenstra

Always reference specific data points from the Consenstra platform context provided above.`;

      // Format conversation history properly
      const historyMessages: OpenRouterMessage[] = [];
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        context.conversationHistory.slice(-4).forEach(entry => {
          if (entry.role === 'user') {
            historyMessages.push({ role: 'user', content: entry.content });
          } else if (entry.role === 'assistant') {
            historyMessages.push({ role: 'assistant', content: entry.content });
          }
        });
      }

      const messages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
      ];

      console.log('Sending to OpenRouter:', {
        messageCount: messages.length,
        systemPromptLength: systemPrompt.length,
        userMessage: userMessage
      });

      const response = await this.chat(messages);
      
      console.log('Received response from OpenRouter:', response.substring(0, 100) + '...');
      return response;

    } catch (error) {
      console.error('Error in analyzeGovernanceData:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }
}

export const openRouterService = new OpenRouterService('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');
