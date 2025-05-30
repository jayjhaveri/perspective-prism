import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { debateId, personas, userInput: userMessage } = await req.json();
    if (!debateId || !personas || personas.length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing or invalid debateId or personas.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({
        error: 'GROQ_API_KEY not configured'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Fetch messages from Supabase
    const { data: messages, error: fetchError } = await supabase.from('messages').select('message_id, role, name, content').eq('debate_id', debateId).order('created_at', {
      ascending: true
    });
    if (fetchError) {
      return new Response(JSON.stringify({
        error: 'Error fetching messages.'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    // Insert user input as the first message in the debate if not present in the table
    const userInput = userMessage || messages.reverse().find((m) => m.role === 'user')?.content;
    if (messages.length === 0 && userInput) {
      const { error: userInsertError } = await supabase.from('messages').insert([
        {
          debate_id: debateId,
          role: 'user',
          name: 'You',
          content: userMessage
        }
      ]);
      if (userInsertError) {
        console.error('Error inserting user input message:', userInsertError);
      }
      // Refetch messages to include the just-inserted user message
      const refetch = await supabase.from('messages').select('message_id, role, name, content').eq('debate_id', debateId).order('created_at', {
        ascending: true
      });
      if (!refetch.error) {
        messages.splice(0, messages.length, ...refetch.data);
      }
    }
    // Identify the last user input and the last persona message
    const lastPersonaMsg = [
      ...messages
    ].reverse().find((m) => m.role === 'persona');
    const previousSpeaker = lastPersonaMsg?.name ?? 'User';
    const previousContent = lastPersonaMsg?.content ?? userInput;
    // Determine the next persona sequentially
    const spokenPersonas = messages.filter((m) => m.role === 'persona').map((m) => m.name);
    const remainingPersonas = personas.filter((p) => !spokenPersonas.includes(p.name));
    const nextPersona = remainingPersonas.length > 0 ? remainingPersonas[0] : personas[spokenPersonas.length % personas.length];
    console.log('Next persona:', nextPersona);
    // Construct the system prompt with context
    let systemPromptContent;
    if (!lastPersonaMsg) {
      // First persona turn: respond directly to user input
      systemPromptContent = `${nextPersona.prompt}
\nYou are ${nextPersona.name}, a unique persona in a thoughtful roundtable debate.\n\nThe user started the conversation with:\n"${userInput}"\n\nRespond directly to the user's statement above as your opening perspective. Stay in character, introduce your viewpoint, and set the stage for a thoughtful debate. Keep it short — 1–2 concise paragraphs.`;
    } else {
      // Subsequent turns: respond to previous persona
      systemPromptContent = `${nextPersona.prompt}
\nYou are ${nextPersona.name}, a unique persona in a thoughtful roundtable debate.\n\n🔹 The user started the conversation with:\n"${userInput}"\n\n🔹 You are responding to ${previousSpeaker}, who said:\n"${previousContent}"\n\nStay in character. Refer to ${previousSpeaker} by name. Challenge or build on their point respectfully. Add new insights. Keep it short — 1–2 concise paragraphs.`;
    }
    const systemPrompt = {
      role: 'system',
      content: systemPromptContent
    };
    // Format messages for LLM
    const formattedMessages = messages.map((m) => ({
      role: 'user',
      content: `${m.name}: ${m.content}`
    }));
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: nextPersona.model || 'meta-llama/llama-4-maverick-17b-128e-instruct',
        temperature: 0.9,
        max_completion_tokens: 300,
        top_p: 1,
        stream: true,
        messages: [
          systemPrompt,
          ...formattedMessages
        ]
      })
    });
    const decoder = new TextDecoder();
    const reader = groqRes.body?.getReader();
    let accumulatedText = '';
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, {
            stream: true
          });
          const lines = chunk.split('\n').filter((line) => line.trim());
          for (const line of lines) {
            const jsonStr = line.replace(/^data:\s*/, '').trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                accumulatedText += token;
                controller.enqueue(encoder.encode(token));
              }
            } catch (err) {
              // skip malformed
            }
          }
        }
        // Store the generated response in Supabase
        if (accumulatedText.trim()) {
          const { error: insertError } = await supabase.from('messages').insert([
            {
              debate_id: debateId,
              role: 'persona',
              name: nextPersona.name,
              persona_id: nextPersona.id,
              content: accumulatedText
            }
          ]);
          if (insertError) {
            console.error('Error inserting message:', insertError);
          }
        }
        controller.close();
      }
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
