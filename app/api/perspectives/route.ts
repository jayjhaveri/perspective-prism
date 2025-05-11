import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    const { input, personas, mode = "standard", userId } = await req.json();

    if (!input || !Array.isArray(personas) || personas.length === 0) {
        return NextResponse.json({ error: 'Input and personas are required.' }, { status: 400 });
    }

    const results: any[] = [];
    let previousResponse = null;

    for (let i = 0; i < personas.length; i++) {
        const persona = personas[i];

        const systemPrompt = {
            role: 'system',
            content: `${persona.prompt}. Limit to 200 words.`,
        };

        const userMessage: { role: string; content: string } = {
            role: 'user',
            content:
                mode === 'debate' && previousResponse
                    ? `Previous persona **${previousResponse.name}** said:\n"${previousResponse.content}"\n\nRespond with your contrasting perspective.`
                    : input,
        };

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: persona.model || 'meta-llama/llama-4-scout-17b-16e-instruct',
                    messages: [systemPrompt, userMessage],
                    temperature: 0.9,
                    max_tokens: 500,
                }),
            });

            const data = await response.json();
            const reply = data?.choices?.[0]?.message?.content ?? 'No response.';

            // Insert the response into the `messages` table
            const { error: insertError } = await supabase
                .from('messages')
                .insert({
                    persona_id: persona.persona_id,   // Associate with the persona
                    user_id: userId,          // Associate with the user
                    content: reply,
                    role: 'persona',
                });

            if (insertError) {
                console.error('Error inserting message:', insertError.message);
                return NextResponse.json({ error: 'Failed to insert message.' }, { status: 500 });
            }

            // Add to results array
            previousResponse = {
                name: persona.name,
                content: reply,
            };

            results.push({
                name: persona.name,
                style: persona.style,
                response: reply,
            });

        } catch (err) {
            console.error('Error generating response:', err);
            return NextResponse.json({ error: 'Failed to generate response.' }, { status: 500 });
        }
    }

    return NextResponse.json({ responses: results });
}