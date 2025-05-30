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
    const { input, user_id } = await req.json()

    if (!input) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
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

    console.log('Generating personas for input:', input)

    const systemPrompt = {
      role: 'system',
      content: `
You are an AI persona generator.
Your job is to analyze a user's input reflection or dilemma, then generate 3 to 4 unique thought personas.

Each persona must be:
- Intellectually distinct
- Emotionally or stylistically diverse
- Able to challenge, comfort, or provoke the user in different ways

Each persona should include:
- A short creative name (1–3 words)
- A style summary (tone, voice, perspective)
- A system prompt: how this persona should think/respond

Encourage contrast: include at least one critical, cynical, or provocative voice.

Only respond in raw JSON format with an array of personas.
Example:
[
  {
    "name": "The Realist",
    "style": "Practical, skeptical, grounded",
    "prompt": "Respond with tough love, challenging assumptions with realism and logic."
  }
]
`,
    }

    const userMessage = {
      role: 'user',
      content: input,
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [systemPrompt, userMessage],
        temperature: 0.9,
        max_tokens: 800,
      }),
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error("Groq API Error:", groqResponse.status, groqResponse.statusText, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch personas from Groq API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await groqResponse.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      console.error('No content received from Groq API')
      return new Response(
        JSON.stringify({ error: 'No content received from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Raw AI response:', content)

    // Parse the JSON response from the AI
    let personas
    try {
      personas = JSON.parse(content)
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content)
      return new Response(
        JSON.stringify({ error: 'Invalid response format from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert personas into Supabase DB
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env vars missing')
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Map personas to DB schema
    const personasData = personas.map((persona) => ({
      persona_id: persona.id || crypto.randomUUID(), // Generate a UUID if no ID is provided
      name: persona.name,
      style: persona.style,
      prompt: persona.prompt,
      user_id: user_id || null,
      is_custom_persona: true,
    }))

    const { data: insertedPersonas, error: supabaseError } = await supabase
      .from('personas')
      .insert(personasData)
      .select('*')

    if (supabaseError) {
      console.error('Supabase Error - Inserting Personas:', supabaseError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert personas.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully generated and inserted personas:', insertedPersonas.length)
    return new Response(
      JSON.stringify({ personas: insertedPersonas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-personas function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
