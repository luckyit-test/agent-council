import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Создаем Supabase клиент для получения API ключей из БД
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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

    // Функция для получения API ключа из базы данных
    const getApiKey = async (providerName: string, userId?: string) => {
      try {        
        console.log(`=== Getting API key for ${providerName} ===`);
        console.log('User ID:', userId);
        
        if (!userId) {
          console.error('No user ID available for getApiKey');
          return null;
        }
        
        // Проверяем все ключи пользователя для отладки
        const { data: allKeys, error: allKeysError } = await supabase
          .from('user_api_keys')
          .select('*')
          .eq('user_id', userId);
        
        console.log('All user keys:', allKeys);
        console.log('All keys error:', allKeysError);
        
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('api_key')
          .eq('provider', providerName)
          .eq('user_id', userId)
          .single();

        console.log(`Query result for ${providerName}:`, { data, error });

        if (error || !data) {
          console.error(`API key not found for ${providerName}:`, error);
          return null;
        }

        console.log(`${providerName} API key found in database, length:`, data.api_key?.length);
        return data.api_key;
      } catch (err) {
        console.error(`Error fetching API key for ${providerName}:`, err);
        return null;
      }
    };

    // Получаем user ID из JWT токена один раз
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    console.log('=== AUTH HEADER DEBUG ===');
    console.log('Auth header exists:', !!authHeader);
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        console.log('Token length:', token.length);
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        console.log('User ID from JWT:', userId);
        console.log('User role:', payload.role);
      } catch (e) {
        console.error('Error parsing JWT:', e);
        console.error('Auth header that failed:', authHeader?.substring(0, 50));
      }
    } else {
      console.error('No authorization header found');
    }

    let response;
    let generatedText;

    if (provider === 'openai') {
      const openaiKey = await getApiKey('openai', userId);
      
      if (!openaiKey) {
        console.error('OpenAI API key not found in database');
        return new Response(JSON.stringify({ error: 'OpenAI API key not configured. Please add it through the API Keys page.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('OpenAI key found, length:', openaiKey.length);
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
      const deepseekKey = await getApiKey('deepseek', userId);
      
      if (!deepseekKey) {
        console.error('Deepseek API key not found in database');
        return new Response(JSON.stringify({ error: 'Deepseek API key not configured. Please add it through the API Keys page.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Deepseek key found, length:', deepseekKey.length);
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
      const perplexityApiKey = await getApiKey('perplexity', userId);
      
      if (!perplexityApiKey) {
        console.error('Perplexity API key not found in database');
        return new Response(JSON.stringify({ error: 'Perplexity API key not configured. Please add it through the API Keys page.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Perplexity key found, length:', perplexityApiKey.length);
      
      // В тестовом режиме не проверяем формат ключа
      if (!testMode && !perplexityApiKey.startsWith('pplx-')) {
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
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      if (stream) {
        return new Response(response.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      } else {
        const data = await response.json();
        console.log('Perplexity API response received');
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