
import { supabase } from '@/integrations/supabase/client';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class OpenRouterService {
  async chat(messages: OpenRouterMessage[], model: string = 'anthropic/claude-3.5-sonnet'): Promise<string> {
    try {
      // Use Supabase Edge Function for AI chat
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages, 
          model,
          provider: 'openrouter'
        }
      });

      if (error) {
        console.error('OpenRouter API error:', error);
        throw new Error(`OpenRouter API error: ${error.message}`);
      }

      return data?.response || 'Sorry, I could not generate a response.';
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

Be thorough, analytical, and educational in your responses. Use the provided data to give specific insights about DAO governance, voting patterns, and proposal analysis. Always provide actionable advice for improving DAO participation.`;

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

export const openRouterService = new OpenRouterService();
