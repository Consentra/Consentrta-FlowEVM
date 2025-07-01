
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
    // Create detailed context summary
    const proposalSummary = context.proposals?.length > 0 ? 
      `Current proposals (${context.proposals.length} total):
${context.proposals.slice(0, 5).map(p => 
  `- "${p.title}" (${p.status}) - ${p.votes_for || 0} for, ${p.votes_against || 0} against, ${p.total_votes || 0} total votes`
).join('\n')}` : 'No proposals currently available';

    const daoSummary = context.daos?.length > 0 ?
      `Active DAOs (${context.daos.length} total):
${context.daos.slice(0, 3).map(d => 
  `- ${d.name}: ${d.member_count || 0} members, $${d.treasury_value || 0} treasury`
).join('\n')}` : 'No DAOs currently available';

    const systemPrompt = `You are Ethra, an expert AI governance analyst for Consenstra DAO platform. You have access to REAL-TIME platform data and must provide accurate, data-driven responses.

CURRENT PLATFORM DATA:
${proposalSummary}

${daoSummary}

INSTRUCTIONS:
- Use the actual data provided above in your responses
- Be specific with numbers and details from the real data
- If asked about proposals, reference the actual proposal titles and vote counts
- If asked about DAOs, reference the actual DAO names and member counts
- Don't make up data - use only what's provided
- Be analytical and provide insights based on the real numbers
- If the data shows no activity, say so explicitly

Your role is to:
- Analyze real proposal data with specific vote counts and status
- Explain governance patterns based on actual platform activity
- Provide insights using the current ecosystem statistics
- Help users understand the platform's current state accurately

Always reference specific data points from the context provided above.`;

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...context.conversationHistory?.slice(-2).map(entry => [
        { role: 'user' as const, content: entry.user },
        { role: 'assistant' as const, content: entry.ai }
      ]).flat() || [],
      { role: 'user', content: userMessage }
    ];

    return this.chat(messages);
  }
}

export const openRouterService = new OpenRouterService('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');
