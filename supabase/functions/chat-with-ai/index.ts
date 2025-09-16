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
  console.log('=== EDGE FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== PARSING REQUEST BODY ===');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
      console.log('Request body keys:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { 
      messages, 
      provider = 'openai', 
      model = 'gpt-4o-mini', 
      stream = false, 
      agentPrompt,
      capabilities = {},
      testMode
    } = requestBody;
    
    console.log('=== CHAT REQUEST START ===');
    console.log('Provider:', provider);
    console.log('Model:', model);
    console.log('Stream:', stream);
    console.log('Test Mode:', testMode);
    console.log('Has agentPrompt:', !!agentPrompt);
    console.log('Capabilities:', capabilities);
    console.log('Messages count:', messages?.length || 0);

    // Функция для получения API ключа из базы данных
    const getApiKey = async (providerName: string, userId?: string) => {
      try {        
        console.log(`=== Getting API key for ${providerName} ===`);
        console.log('User ID:', userId);
        
        if (!userId) {
          console.error('No user ID available for getApiKey');
          return null;
        }
        
        // ОТЛАДКА: Показываем все ключи в базе для этого провайдера
        const { data: allProviderKeys, error: allError } = await supabase
          .from('user_api_keys')
          .select('user_id, provider, created_at')
          .eq('provider', providerName);
        
        console.log(`All ${providerName} keys in database:`, allProviderKeys);
        console.log(`All keys error:`, allError);
        
        // Ищем конкретный ключ пользователя
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('api_key')
          .eq('provider', providerName)
          .eq('user_id', userId)
          .single();

        console.log(`Specific query for user ${userId} and provider ${providerName}:`);
        console.log('Result data:', data);
        console.log('Result error:', error);

        if (error) {
          console.error(`API key query failed:`, error);
          return null;
        }

        if (!data || !data.api_key) {
          console.error(`No API key data returned`);
          return null;
        }

        console.log(`SUCCESS: ${providerName} API key found, length:`, data.api_key.length);
        return data.api_key;
      } catch (err) {
        console.error(`Exception in getApiKey for ${providerName}:`, err);
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
        console.log('Token first 50 chars:', token.substring(0, 50));
        
        if (!token || token === 'null' || token === 'undefined') {
          console.error('Invalid token received:', token);
          return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        console.log('User ID from JWT:', userId);
        console.log('User role:', payload.role);
      } catch (e) {
        console.error('Error parsing JWT:', e);
        console.error('Auth header that failed:', authHeader?.substring(0, 50));
        return new Response(JSON.stringify({ error: 'Failed to parse authentication token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.error('No authorization header found');
    }

    let response;
    let generatedText = '';

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

      // Определяем параметры для OpenAI в зависимости от модели
      const isNewModel = model && (
        model.startsWith('gpt-5') || 
        model.startsWith('o3') || 
        model.startsWith('o4') ||
        model.includes('gpt-4.1')
      );

      // GPT-5 модели требуют верификации организации для стриминга
      const shouldStream = stream && !model?.startsWith('gpt-5');

      const requestBody: any = {
        model: model || 'gpt-4o-mini',
        messages: openaiMessages,
        stream: shouldStream
      };

      // Для новых моделей используем max_completion_tokens и не передаем temperature
      if (isNewModel) {
        requestBody.max_completion_tokens = 1000;
        // Новые модели не поддерживают temperature
      } else {
        requestBody.max_tokens = 1000;
        requestBody.temperature = 0.7;
      }

      // Добавляем параметры для Web Search и Deep Research если включены
      if (capabilities.webSearch && model?.includes('gpt')) {
        // Для OpenAI можно использовать функции или инструкции в системном промпте
        if (openaiMessages[0]?.role === 'system') {
          openaiMessages[0].content += '\n\nВы можете использовать веб-поиск для получения актуальной информации.';
        }
      }

      if (capabilities.deepResearch && model?.includes('gpt')) {
        // Для глубокого исследования добавляем инструкции
        if (openaiMessages[0]?.role === 'system') {
          openaiMessages[0].content += '\n\nПроводите глубокий анализ с использованием множественных источников и различных точек зрения.';
        }
      }
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', response.status, errorData);
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      if (shouldStream) {
        console.log('Using streaming mode');
        return new Response(response.body, {
          headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
        });
      } else {
        console.log('Using non-streaming mode');
        const data = await response.json();
        console.log('OpenAI response data:', JSON.stringify(data, null, 2));
        generatedText = data.choices?.[0]?.message?.content || 'No response generated';
        console.log('Generated text:', generatedText);
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
        console.log('Deepseek API response received');
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
      
      const perplexityBody: any = {
        model: model === 'sonar-deep-research' ? 'sonar-deep-research' : 'llama-3.1-sonar-small-128k-online',
        messages: apiMessages,
        stream,
        max_tokens: 4000,
        temperature: 0.2,
        top_p: 0.9,
        return_images: false,
        return_related_questions: false,
        frequency_penalty: 1,
        presence_penalty: 0
      };

      // Настройки для Web Search
      if (capabilities.webSearch) {
        perplexityBody.search_domain_filter = [];  // Убираем ограничения на домены
        perplexityBody.search_recency_filter = 'week';  // Более свежие результаты
        perplexityBody.return_related_questions = true;  // Возвращаем связанные вопросы
      } else {
        perplexityBody.search_domain_filter = ['perplexity.ai'];
        perplexityBody.search_recency_filter = 'month';
      }

      // Настройки для Deep Research
      if (capabilities.deepResearch) {
        perplexityBody.model = 'llama-3.1-sonar-huge-128k-online';  // Более мощная модель
        perplexityBody.max_tokens = 6000;  // Больше токенов для подробного ответа
        perplexityBody.search_recency_filter = 'week';
        perplexityBody.return_related_questions = true;
        perplexityBody.temperature = 0.1;  // Более детерминированные ответы
        
        // Дополняем системный промпт для глубокого исследования
        if (apiMessages[0]?.role === 'system') {
          apiMessages[0].content += '\n\nПроведите глубокое исследование с анализом множества источников, рассмотрите различные точки зрения и предоставьте всестороннее освещение темы.';
        }
      }

      response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(perplexityBody),
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
    console.log('Final generatedText value:', generatedText);
    console.log('Final generatedText length:', generatedText?.length);
    
    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== CRITICAL ERROR IN CHAT-WITH-AI ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('========================================');
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred while processing your request',
      errorType: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});