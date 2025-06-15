
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, content } = await req.json();

    if (!proposalId || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: proposalId and content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    if (!mistralApiKey) {
      return new Response(
        JSON.stringify({ error: 'Mistral API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analysisPrompt = `Analyze this DAO governance proposal and provide a structured assessment:

Proposal Content: ${content}

Please analyze and respond with a JSON object containing:
{
  "confidenceScore": number (0-100, how confident you are in the analysis),
  "predictedOutcome": "pass" or "fail",
  "reasoning": "detailed explanation of your analysis",
  "summary": "brief summary of the proposal",
  "tags": ["tag1", "tag2"] (relevant categories),
  "complexityScore": number (0-100, how complex the proposal is),
  "riskScore": number (0-100, risk level of implementing this proposal)
}

Consider factors like:
- Technical feasibility
- Economic impact
- Community benefit
- Implementation complexity
- Potential risks
- Alignment with DAO goals`;

    const messages: MistralMessage[] = [
      {
        role: 'system',
        content: 'You are an expert DAO governance analyst. Provide structured, objective analysis of governance proposals. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ];

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
    }

    const data: MistralResponse = await response.json();
    const analysisText = data.choices[0]?.message?.content || '';

    // Try to parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', analysisText);
      // Fallback analysis
      analysis = {
        confidenceScore: 60,
        predictedOutcome: 'fail',
        reasoning: 'Unable to perform detailed analysis due to parsing error',
        summary: 'Analysis unavailable',
        tags: ['general'],
        complexityScore: 50,
        riskScore: 50
      };
    }

    // Validate and normalize the analysis
    const normalizedAnalysis = {
      confidenceScore: Math.max(0, Math.min(100, analysis.confidenceScore || 50)),
      predictedOutcome: ['pass', 'fail'].includes(analysis.predictedOutcome) ? analysis.predictedOutcome : 'fail',
      reasoning: analysis.reasoning || 'No reasoning provided',
      summary: analysis.summary || 'No summary available',
      tags: Array.isArray(analysis.tags) ? analysis.tags : ['general'],
      complexityScore: Math.max(0, Math.min(100, analysis.complexityScore || 50)),
      riskScore: Math.max(0, Math.min(100, analysis.riskScore || 50))
    };

    console.log(`AI analysis completed for proposal ${proposalId}:`, normalizedAnalysis);

    return new Response(
      JSON.stringify(normalizedAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-proposal-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed', 
        details: error.message,
        // Provide fallback analysis
        confidenceScore: 30,
        predictedOutcome: 'fail',
        reasoning: 'Analysis service temporarily unavailable'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
