// File: app/api/models/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
        });

        const data = await response.json();

        if (!data || !Array.isArray(data.data)) {
            return NextResponse.json({ error: 'Invalid response from Groq' }, { status: 500 });
        }

        const filtered = data.data
            .map((m: any) => m.id)
            .filter((id: string) => id.includes('llama') || id.includes('gemma'));

        return NextResponse.json({ models: filtered });
    } catch (error) {
        console.error('Server error fetching models:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }
}
