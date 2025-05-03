// File: app/api/generate-personas/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { input } = await req.json();

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

    try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
                messages: [systemPrompt, userMessage],
                temperature: 0.9,
                max_tokens: 800,
            }),
        });

        const data = await groqResponse.json();
        const content = data?.choices?.[0]?.message?.content ?? '[]';
        const parsed = JSON.parse(content);

        return NextResponse.json({ personas: parsed });
    } catch (error) {
        console.error('❌ Error generating personas:', error);
        return NextResponse.json({ error: 'Failed to generate personas.' }, { status: 500 });
    }
}
