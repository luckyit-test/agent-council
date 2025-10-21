import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

function sseHeaders() {
  return {
    ...corsHeaders,
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

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
    const requestBody = await req.json();
    console.log('Request body parsed successfully');
    console.log('Request body keys:', Object.keys(requestBody));

    const { messages, provider, model, agentPrompt, capabilities, stream, testMode } = requestBody;

    console.log('Model:', model);
    console.log('Provider:', provider);
    console.log('Messages count:', messages?.length);
    console.log('Test Mode:', testMode);
    console.log('Has agentPrompt:', !!agentPrompt);
    console.log('Capabilities:', capabilities);
    console.log('Stream:', stream);

    console.log('=== AUTH HEADER DEBUG ===');
    const authHeader = req.headers.get('authorization');
    console.log('Auth header exists:', !!authHeader);
    console.log('Token length:', authHeader?.length);
    console.log('Token first 50 chars:', authHeader?.substring(0, 50));

    console.log('=== CHAT REQUEST START ===');

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages are required and must be an array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user ID from JWT token
    let userId = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
          console.error('Error getting user from token:', error);
        } else if (user) {
          userId = user.id;
          console.log('User ID from JWT:', userId);
          console.log('User role:', user.role);
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }

    console.log('User ID:', userId);

    // Function to get API key from database
    const getApiKey = async (provider: string, userId: string) => {
      console.log(`=== Getting API key for ${provider} ===`);
      
      try {
        const { data, error } = await supabase
          .from('user_api_keys')
          .select('api_key')
          .eq('user_id', userId)
          .eq('provider', provider)
          .single();

        console.log('Result error:', error);
        console.log('Result data:', data);

        if (error || !data) {
          console.log(`${provider.toUpperCase()} API key not found for user ${userId}`);
          return null;
        }

        console.log(`SUCCESS: ${provider} API key found, length:`, data.api_key?.length);
        return data.api_key;
      } catch (error) {
        console.error(`Error fetching ${provider} API key:`, error);
        return null;
      }
    };

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
      console.log('Calling OpenAI Responses API with model:', model);
      
      // Формируем input для Responses API согласно рабочему примеру
      let apiInput = [];
      
      console.log('=== ФОРМИРОВАНИЕ INPUT ===');
      console.log('Messages:', JSON.stringify(messages, null, 2));
      console.log('Agent prompt:', agentPrompt);
      
      // Добавляем системный промпт если есть
      if (agentPrompt) {
        apiInput.push({
          role: "system",
          content: [{ type: "input_text", text: agentPrompt }]
        });
      }
      
      // Добавляем сообщения пользователя
      messages.forEach(msg => {
        if (msg.role === 'user') {
          const content = [{ type: "input_text", text: msg.content }];
          
          // Добавляем инструкции для web search если включен
          if (capabilities?.webSearch) {
            content.push({ 
              type: "input_text", 
              text: "Пожалуйста, используй web search и дай 3–5 релевантных ссылок с краткими пояснениями." 
            });
          }
          
          apiInput.push({
            role: msg.role,
            content: content
          });
        } else {
          apiInput.push({
            role: msg.role,
            content: [{ type: "input_text", text: msg.content }]
          });
        }
      });
      
      console.log('Using input array:', JSON.stringify(apiInput, null, 2));

      const requestBody: any = {
        model: model || 'gpt-4o-mini',
        input: apiInput,
        temperature: 0.2,
        stream
      };
      
      // Добавляем web search если включен
      if (capabilities?.webSearch) {
        requestBody.tools = [{ type: "web_search" }];
        requestBody.tool_choice = "auto";
      }
      
      console.log('=== REQUEST BODY ===');
      console.log('Full request body:', JSON.stringify(requestBody, null, 2));

      console.log('=== ОТПРАВКА ЗАПРОСА ===');
      
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('=== ОТВЕТ ОТ OPENAI ===');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI Responses API error:', response.status, errorData);
        throw new Error(`OpenAI Responses API error: ${response.status} - ${errorData}`);
      }

      // Для стриминга возвращаем поток напрямую
      if (stream) {
        console.log('Using streaming mode with Responses API');
        
        return new Response(response.body, {
          headers: sseHeaders(),
        });
      }
      
      // Не-стриминговый режим
      console.log('Using non-streaming mode with Responses API');
      const data = await response.json();
      console.log('OpenAI Responses API response data:', JSON.stringify(data, null, 2));
      
      // Обрабатываем ответ от Responses API согласно примеру
      let content = '';
      
      console.log('=== ИЗВЛЕЧЕНИЕ КОНТЕНТА ===');
      console.log('data.output exists:', !!data.output);
      console.log('data.output length:', data.output?.length);
      
      if (data.output && data.output[0]) {
        console.log('First output item:', JSON.stringify(data.output[0], null, 2));
        console.log('Content exists:', !!data.output[0].content);
        
        if (data.output[0].content && data.output[0].content[0]) {
          console.log('First content item:', JSON.stringify(data.output[0].content[0], null, 2));
          content = data.output[0].content[0].text || '';
        }
      }
      
      console.log('Extracted content:', content);
      console.log('Content length:', content?.length);
      
      if (!content) {
        console.log('No content found in response, using fallback');
        content = 'Ответ получен, но контент не удалось извлечь из ответа API.';
      }
      
      generatedText = content;
      console.log('Final generatedText value:', generatedText);
      console.log('Final generatedText length:', generatedText?.length);
      
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
      if (capabilities?.webSearch) {
        perplexityBody.search_domain_filter = [];  // Убираем ограничения на домены
        perplexityBody.search_recency_filter = 'week';  // Более свежие результаты
        perplexityBody.return_related_questions = true;  // Возвращаем связанные вопросы
      } else {
        perplexityBody.search_domain_filter = ['perplexity.ai'];
        perplexityBody.search_recency_filter = 'month';
      }

      // Настройки для Deep Research
      if (capabilities?.deepResearch) {
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
    
    // Возвращаем расширенный ответ с метаданными для OpenAI
    if (provider === 'openai') {
      const responseData = {
        generatedText,
        webSearchResults: provider === 'openai' && capabilities?.webSearch ? [] : undefined, // Будет заполнено выше для OpenAI
        metadata: {
          model: model || 'gpt-4o-mini',
          hasWebSearch: capabilities?.webSearch,
          timestamp: new Date().toISOString()
        }
      };
      
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Для других провайдеров возвращаем стандартный ответ
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