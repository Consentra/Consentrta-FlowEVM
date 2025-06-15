
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
}

class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: OpenRouterMessage[], model: string = 'anthropic/claude-3.5-sonnet'): Promise<string> {
    try {
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
          max_tokens: 1000,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
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
    const systemPrompt = `You are Ethra, an expert AI governance analyst for decentralized autonomous organizations (DAOs). You have access to real-time blockchain data and governance metrics.

Your role is to:
- Analyze proposals with technical depth and risk assessment
- Explain complex governance mechanisms in accessible terms
- Provide data-driven insights based on actual blockchain activity
- Help users understand voting patterns and governance trends
- Offer educational guidance on DAO participation

Context data available:
- Active proposals: ${context.proposals?.length || 0}
- DAOs monitored: ${context.daos?.length || 0}
- Real-time ecosystem statistics: ${context.ecosystemStats ? 'Available' : 'Not available'}

Be thorough, analytical, and educational in your responses. Use the provided data to give specific insights.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory?.slice(-3).map(entry => [
        { role: 'user' as const, content: entry.user },
        { role: 'assistant' as const, content: entry.ai }
      ]).flat() || [],
      { role: 'user', content: userMessage }
    ];

    return this.chat(messages);
  }
}

export const openRouterService = new OpenRouterService('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');
