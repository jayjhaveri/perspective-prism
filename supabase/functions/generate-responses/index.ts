import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { personas, topic, userId, interactionId } = await req.json()

    if (!personas || !topic || !userId) {
      return new Response(
        JSON.stringify({ error: 'Personas, topic, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Generating responses for', personas.length, 'personas on topic:', topic)

    const results: { id: any; name: any; style: any; response: any }[] = []

    for (const persona of personas) {
      console.log('Generating response for persona:', persona.name)

      const systemPrompt = {
        role: 'system',
        content: `${persona.description || persona.prompt || `You are ${persona.name}, a ${persona.style} persona.`} Respond to the topic with your unique perspective. Limit to 200 words.`
      }

      const userMessage = {
        role: 'user',
        content: `Topic: ${topic}. Please provide your perspective on this.`
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
          messages: [systemPrompt, userMessage],
          temperature: 0.9,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error generating response for ${persona.name}:`, response.status, response.statusText, errorText)
        continue
      }

      const data = await response.json()
      const reply = data?.choices?.[0]?.message?.content ?? 'No response.'

      console.log(`Generated response for ${persona.name}:`, reply.substring(0, 100) + '...')

      // Save the response to database if persona has an ID
      if (persona.id) {
        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            persona_id: persona.id,
            user_id: userId,
            content: reply,
            role: 'persona',
            name: persona.name,
            interaction_id: interactionId || null,
          })

        if (insertError) {
          console.error('Error inserting message:', insertError.message)
        } else {
          console.log(`Saved message for persona ${persona.name}`)
        }
      }

      results.push({
        id: persona.id,
        name: persona.name,
        style: persona.style,
        response: reply,
      })
    }

    console.log('Successfully generated', results.length, 'responses')
    return new Response(
      JSON.stringify({ responses: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-responses function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
