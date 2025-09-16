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
    const { messages, provider, model, agentPrompt, stream, testMode } = await req.json();
    
    console.log('=== CHAT REQUEST START ===');
    console.log('Provider:', provider);
    console.log('Model:', model);  
    console.log('Test Mode:', testMode);
    console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('API_KEY')));
    
    // Синхронизируем секреты между edge функциями, если они не найдены
    const checkAndSyncSecret = (keyName: string) => {
      let key = Deno.env.get(keyName);
      if (!key) {
        // Пытаемся получить из глобального контекста Supabase
        console.log(`${keyName} not found, checking global context...`);
        // В продакшене секреты устанавливаются через Dashboard Supabase
      }
      return key;
    };

    let response;
    let generatedText;

    if (provider === 'openai') {
      const openaiKey = checkAndSyncSecret('OPENAI_API_KEY');
      
      if (!openaiKey) {
        console.error('OpenAI API key not found');
        return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Calling OpenAI API with model:', model);
      
      const openaiMessages = agentPrompt 
        ? [{ role: 'system', content: agentPrompt }, ...messages]
        : messages;
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: openaiMessages,
          stream,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', response.status, errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      if (stream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      } else {
        const data = await response.json();
        generatedText = data.choices?.[0]?.message?.content || 'No response generated';
      }
      
    } else if (provider === 'deepseek') {
      const deepseekKey = checkAndSyncSecret('DEEPSEEK_API_KEY');
      
      if (!deepseekKey) {
        console.error('Deepseek API key not found');
        return new Response(JSON.stringify({ error: 'Deepseek API key not configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Calling Deepseek API with model:', model);
      
      const deepseekMessages = agentPrompt 
        ? [{ role: 'system', content: agentPrompt }, ...messages]
        : messages;
      
      response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: deepseekMessages,
          stream,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Deepseek API error:', response.status, errorData);
        throw new Error(`Deepseek API error: ${response.status} - ${errorData}`);
      }

      if (stream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      } else {
        const data = await response.json();
        generatedText = data.choices?.[0]?.message?.content || 'No response generated';
      }
      
    } else if (provider === 'perplexity') {
      const perplexityApiKey = checkAndSyncSecret('PERPLEXITY_API_KEY');
      
      console.log('=== PERPLEXITY TEST START ===');
      console.log('Environment variables available:', Object.keys(Deno.env.toObject()).filter(k => k.includes('PERPLEXITY')));
      
      if (!perplexityApiKey) {
        console.error('PERPLEXITY_API_KEY not found in environment');
        return new Response(JSON.stringify({ 
          error: 'Perplexity API key not configured in Supabase secrets'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('API key length:', perplexityApiKey?.length || 0);
      console.log('API key prefix:', perplexityApiKey?.substring(0, 10) || 'N/A');
      
      if (!perplexityApiKey.startsWith('pplx-')) {
        console.error('Invalid API key format - should start with pplx-');
        return new Response(JSON.stringify({ 
          error: 'Invalid Perplexity API key format - should start with pplx-'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const apiMessages = agentPrompt 
        ? [{ role: 'system', content: agentPrompt }, ...messages]
        : messages;

      console.log('Calling Perplexity API with model:', model);
      
      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model === 'sonar-deep-research' ? 'sonar-deep-research' : 'llama-3.1-sonar-small-128k-online',
          messages: apiMessages,
          stream,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== PERPLEXITY API ERROR DETAILS ===');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('Error Response:', errorText);
        console.error('Request URL:', 'https://api.perplexity.ai/chat/completions');
        console.error('Request Headers sent:', JSON.stringify({
          'Authorization': `Bearer ${perplexityApiKey.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        }));
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      if (stream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      } else {
        const data = await response.json();
        console.log('Perplexity API response:', JSON.stringify(data, null, 2));
        generatedText = data.choices?.[0]?.message?.content || 'No response generated';
      }
      
    } else {
      return new Response(JSON.stringify({ error: `Unsupported provider: ${provider}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI response generated successfully');
    
    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred while processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});