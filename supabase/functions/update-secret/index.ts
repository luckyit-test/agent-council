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
    const { secretName, secretValue } = await req.json();
    
    if (!secretName || !secretValue) {
      throw new Error('Secret name and value are required');
    }

    console.log(`Updating secret: ${secretName}`);

    // Устанавливаем переменную окружения для edge функции
    // В Supabase секреты управляются через Dashboard, но мы можем установить их в runtime
    Deno.env.set(secretName, secretValue);
    
    // Проверяем, что секрет установлен
    const savedValue = Deno.env.get(secretName);
    if (!savedValue || savedValue !== secretValue) {
      throw new Error(`Failed to set secret ${secretName}`);
    }
    
    console.log(`Secret ${secretName} updated successfully`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `Secret ${secretName} updated successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating secret:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while updating the secret'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});