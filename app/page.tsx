// ✅ File: app/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CustomPersonaForm from '../components/CustomPersonaForm';
import { Switch } from '@/components/ui/switch';
import { Persona, usePersonaContext } from '@/app/context/PersonaContext';

export default function PerspectivePrism() {
  const router = useRouter();
  const {
    input,
    setInput,
    personas,
    setPersonas,
    selectedPersonas,
    setSelectedPersonas,
  } = usePersonaContext();

  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'column'>('grid');
  const [stage, setStage] = useState<'input' | 'review'>('input');
  const [mode, setMode] = useState<'standard' | 'debate'>('standard');
  const [responses, setResponses] = useState<{ name: string; style: string; response: string }[]>([]);

  const removePersona = (index: number) => {
    setPersonas((prev: Persona[]) => prev.filter((_, i: number) => i !== index));
  };

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch('/api/generate-personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    setSelectedPersonas(data.personas || []);
    setStage('review');
    setLoading(false);
  };

  const handleConfirm = async () => {
    const combined = [...selectedPersonas, ...personas];
    setPersonas(combined); // Ensure personas are in context before navigating

    if (mode === 'debate') {
      router.push('/debate');
      return;
    }

    setLoading(true);
    const result = await fetch('/api/perspectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, personas: combined }),
    });
    const data = await result.json();
    setResponses(data.responses);
    setStage('input');
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">🧠 Perspective Prism</h1>
      <p className="mb-4 text-muted-foreground">
        Enter your dilemma or reflection. We'll generate unique thinking personas tailored to your input, then show how each one interprets it.
        You can also add your own custom personas to explore additional perspectives.
      </p>

      <Textarea
        placeholder="What are you trying to think through, write, or reflect on?"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="mb-4"
      />

      {stage === 'input' && (
        <>
          <div className="flex gap-4 items-center mb-4">
            <label className="text-sm font-medium">Debate Mode</label>
            <Switch
              checked={mode === 'debate'}
              onCheckedChange={() => setMode(mode === 'standard' ? 'debate' : 'standard')}
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader className="animate-spin" /> : 'Generate Personas'}
          </Button>
        </>
      )}

      {stage === 'review' && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">🎭 Generated Personas</h2>
          <div className="grid gap-4 mb-4">
            {[...selectedPersonas, ...personas].map((persona, idx) => {
              const isCustom = idx >= selectedPersonas.length;
              return (
                <Card key={idx} className="relative">
                  <CardHeader>
                    <CardTitle>{persona.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{persona.style}</p>
                    {isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-red-500"
                        onClick={() => removePersona(idx - selectedPersonas.length)}
                      >
                        🗑
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{persona.prompt}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <CustomPersonaForm onAdd={(newPersona) => setPersonas((prev) => [newPersona, ...prev])} />

          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader className="animate-spin" /> : mode === 'debate' ? 'Start Debate' : 'Generate Perspectives'}
          </Button>
        </div>
      )}

      {mode === 'standard' && responses.length > 0 && (
        <>
          <div className="flex gap-4 mt-4 mb-4">
            <Button variant={layout === 'grid' ? 'default' : 'outline'} onClick={() => setLayout('grid')}>
              Side-by-Side
            </Button>
            <Button variant={layout === 'column' ? 'default' : 'outline'} onClick={() => setLayout('column')}>
              Stacked
            </Button>
          </div>

          <div className={`mt-6 ${layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex flex-col gap-4'}`}>
            {responses.map((r, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{r.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{r.style}</p>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <ReactMarkdown>{r.response}</ReactMarkdown>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}