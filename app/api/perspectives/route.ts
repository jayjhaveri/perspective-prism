// File: app/api/perspectives/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { input, personas, mode = "standard" } = await req.json();

    const results: any[] = [];

    for (let i = 0; i < personas.length; i++) {
        const persona = personas[i];

        const systemPrompt = {
            role: 'system',
            content: `${persona.prompt}. Limit to 200 words.`,
        };

        const userMessage = {
            role: 'user',
            content:
                mode === 'debate' && i > 0
                    ? `Previous persona **${results[i - 1].name}** said:\n"${results[i - 1].response}"\n\nRespond with your contrasting perspective.`
                    : input,
        };

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
        console.log('Response from Groq:', data);
        const reply = data?.choices?.[0]?.message?.content ?? 'No response.';

        results.push({
            name: persona.name,
            style: persona.style,
            response: reply,
        });
    }

    return NextResponse.json({ responses: results });
}