import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
    try {
        const { input, debateId } = await req.json();

        if (!input) {
            console.error("Validation Error - Missing input:", { input });
            return NextResponse.json({ error: 'Input is required.' }, { status: 400 });
        }

        console.log("Input received:", input);
        console.log("Debate ID received:", debateId);

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            console.error("GROQ_API_KEY is not set.");
            return NextResponse.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
        }

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
  },
  ...
]
`,
        };

        const userMessage = {
            role: 'user',
            content: input,
        };

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
                messages: [systemPrompt, userMessage],
                temperature: 0.9,
                max_tokens: 800,
            }),
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error("Groq API Error:", groqResponse.status, groqResponse.statusText, errorText);
            return NextResponse.json({ error: 'Failed to fetch personas.' }, { status: 500 });
        }

        const data = await groqResponse.json();
        const content = data?.choices?.[0]?.message?.content ?? '[]';

        let parsedPersonas = [];
        try {
            parsedPersonas = JSON.parse(content);
        } catch (err) {
            console.warn('Parsing Error - Invalid JSON format from Groq API:', content);
            return NextResponse.json({ error: 'Failed to parse personas.' }, { status: 500 });
        }

        const personasData = parsedPersonas.map((persona: any) => ({
            persona_id: persona.id || crypto.randomUUID(),
            name: persona.name,
            style: persona.style,
            prompt: persona.prompt,
        }));

        const { data: insertedPersonas, error: supabaseError } = await supabase
            .from('personas')
            .insert(personasData)
            .select('*');

        if (supabaseError) {
            console.error('Supabase Error - Inserting Personas:', supabaseError);
            return NextResponse.json({ error: 'Failed to insert personas.' }, { status: 500 });
        }

        return NextResponse.json({ personas: insertedPersonas });
    } catch (error: any) {
        console.error('Unexpected Error in /generate-personas:', error.message, error.stack);
        return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
    }
}