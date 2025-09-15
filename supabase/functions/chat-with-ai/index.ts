import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, provider, model, agentPrompt } = await req.json();
    
    console.log('Chat request received:', { provider, model, messagesCount: messages.length });

    let response;
    let generatedText;

    if (provider === 'perplexity') {
      const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
      if (!perplexityApiKey) {
        throw new Error('Perplexity API key not configured');
      }

      // Build messages array with agent prompt as system message
      const apiMessages = [];
      if (agentPrompt) {
        apiMessages.push({ role: 'system', content: agentPrompt });
      }
      apiMessages.push(...messages);

      console.log('Calling Perplexity API with model:', model);
      
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'sonar',
          messages: apiMessages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 4000,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, errorText);
        throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      generatedText = data.choices[0].message.content;
      
    } else if (provider === 'openai') {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Build messages array with agent prompt as system message
      const apiMessages = [];
      if (agentPrompt) {
        apiMessages.push({ role: 'system', content: agentPrompt });
      }
      apiMessages.push(...messages);

      console.log('Calling OpenAI API with model:', model);

      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: apiMessages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      generatedText = data.choices[0].message.content;
      
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    console.log('AI response generated successfully');
    
    return new Response(JSON.stringify({ 
      content: generatedText,
      provider,
      model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});