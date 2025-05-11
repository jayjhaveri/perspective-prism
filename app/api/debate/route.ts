import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'edge';

interface Message {
    role: 'user' | 'persona';
    name: string;
    content: string;
}

interface DebateRequest {
    debateId: string;
    personas: {
        name: string;
        style: string;
        prompt: string;
        model: string;
    }[];
}

export async function POST(req: NextRequest) {
    const { debateId, personas }: DebateRequest = await req.json();

    if (!debateId || !personas || personas.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing or invalid debateId or personas.' }), {
            status: 400,
        });
    }

    // Fetch messages from Supabase
    const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('id, role, name, content')
        .eq('debate_id', debateId)
        .order('created_at', { ascending: true });

    if (fetchError) {
        console.error('Error fetching messages:', fetchError);
        return new Response(JSON.stringify({ error: 'Error fetching messages.' }), {
            status: 500,
        });
    }

    // Identify the last user input and the last persona message
    const userInput = messages.find((m) => m.role === 'user')?.content ?? '';
    const lastPersonaMsg = [...messages].reverse().find((m) => m.role === 'persona');

    const previousSpeaker = lastPersonaMsg?.name ?? 'User';
    const previousContent = lastPersonaMsg?.content ?? userInput;

    // Determine the next persona sequentially
    const spokenPersonas = messages
        .filter((m) => m.role === 'persona')
        .map((m) => m.name);
    const remainingPersonas = personas.filter((p) => !spokenPersonas.includes(p.name));

    const nextPersona =
        remainingPersonas.length > 0
            ? remainingPersonas[0]
            : personas[(spokenPersonas.length) % personas.length];

    // Construct the system prompt with context
    const systemPrompt = {
        role: 'system',
        content: `${nextPersona.prompt}

You are ${nextPersona.name}, a unique persona in a thoughtful roundtable debate.

🔹 The user started the conversation with:
"${userInput}"

🔹 You are responding to ${previousSpeaker}, who said:
"${previousContent}"

Stay in character. Refer to ${previousSpeaker} by name. Challenge or build on their point respectfully. Add new insights. Keep it short — 1–2 concise paragraphs.`,
    };

    // Format messages for LLM
    const formattedMessages = messages.map((m) => ({
        role: 'user',
        content: `${m.name}: ${m.content}`,
    }));

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: nextPersona.model || 'meta-llama/llama-4-maverick-17b-128e-instruct',
            temperature: 0.9,
            max_completion_tokens: 300,
            top_p: 1,
            stream: true,
            messages: [systemPrompt, ...formattedMessages],
        }),
    });

    const decoder = new TextDecoder();
    const reader = groqRes.body?.getReader();

    let accumulatedText = '';
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk;

                const lines = chunk.split('\n').filter((line) => line.trim());

                for (const line of lines) {
                    const jsonStr = line.replace(/^data:\s*/, '').trim();
                    if (jsonStr === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(jsonStr);
                        const token = parsed.choices?.[0]?.delta?.content;
                        if (token) {
                            controller.enqueue(encoder.encode(token));
                        }
                    } catch (err) {
                        console.warn('Skipped malformed stream chunk:', jsonStr);
                    }
                }
            }

            // Store the generated response in Supabase
            if (accumulatedText.trim()) {
                const { error: insertError } = await supabase
                    .from('messages')
                    .insert([
                        {
                            debate_id: debateId,
                            role: 'persona',
                            name: nextPersona.name,
                            content: accumulatedText,
                        },
                    ]);

                if (insertError) {
                    console.error('Error inserting message:', insertError);
                }
            }

            controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}