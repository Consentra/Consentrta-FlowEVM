
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class MistralService {
  async chat(messages: MistralMessage[], model: string = 'mistral-large-latest'): Promise<string> {
    try {
      // Use Supabase Edge Function for AI chat
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages, 
          model,
          provider: 'mistral'
        }
      });

      if (error) {
        console.error('Mistral API error:', error);
        throw new Error(`Mistral API error: ${error.message}`);
      }

      return data?.response || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Mistral API error:', error);
      throw error;
    }
  }

  async analyzeVotingContext(
    userMessage: string,
    context: {
      proposals?: any[];
      daos?: any[];
      activeVotingTasks?: Set<string>;
      config?: any;
      conversationHistory?: any[];
    }
  ): Promise<string> {
    const systemPrompt = `You are Daisy, an advanced AI voting automation agent for decentralized autonomous organizations (DAOs). You specialize in:

- Automated voting based on user preferences and AI analysis
- Real-time proposal monitoring and risk assessment
- Smart scheduling of votes with confidence thresholds
- Educational guidance on DAO participation and governance

Your personality is helpful, intelligent, and focused on automation efficiency. You should:
- Provide specific, actionable insights about voting automation
- Explain complex governance mechanisms in simple terms
- Help users configure their voting preferences optimally
- Offer data-driven recommendations based on actual blockchain activity

Context available:
- Active proposals: ${context.proposals?.length || 0}
- DAOs monitored: ${context.daos?.length || 0}
- Active voting tasks: ${context.activeVotingTasks?.size || 0}
- Auto-voting enabled: ${context.config?.autoVotingEnabled ? 'Yes' : 'No'}
- Confidence threshold: ${context.config?.confidenceThreshold || 'Not set'}%

Be concise, helpful, and automation-focused in your responses. Always provide practical advice for DAO participation and voting automation.`;

    const messages: MistralMessage[] = [
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

export const mistralService = new MistralService();
