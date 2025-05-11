"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import CustomPersonaForm from "../components/CustomPersonaForm";
import { Switch } from "@/components/ui/switch";
import { Persona, usePersonaContext } from "@/app/context/PersonaContext";
import { useAuth } from "@/app/context/AuthContext";
import ReactMarkdown from "react-markdown";

interface Props {
    user: {
        id: string;
        email: string;
    } | null; // Updated to handle null
}

export default function PerspectivePrism({ user }: Props) {
    const router = useRouter();
    const { logout } = useAuth();
    const {
        input,
        setInput,
        personas,
        setPersonas,
        selectedPersonas,
        setSelectedPersonas,
    } = usePersonaContext();

    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState<"grid" | "column">("grid");
    const [stage, setStage] = useState<"input" | "review">("input");
    const [mode, setMode] = useState<"standard" | "debate">("standard");
    const [responses, setResponses] = useState<{ name: string; style: string; response: string }[]>([]);
    const [debateId, setDebateId] = useState<string | null>(null);

    const removePersona = (index: number) => {
        setPersonas((prev: Persona[]) => prev.filter((_, i: number) => i !== index));
    };

    const handleGenerate = async () => {
        if (!user) {
            console.error("User is not authenticated.");
            return;
        }

        setLoading(true);

        if (mode === "debate") {
            const { data, error } = await supabase
                .from("debates")
                .insert({ user_id: user.id, topic: input, status: "active" })
                .select()
                .single();

            if (error) {
                console.error("Error creating debate:", error.message);
                setLoading(false);
                return;
            }

            setDebateId(data.id);
        }

        const res = await fetch("/api/generate-personas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input, debateId }),
        });

        const data = await res.json();

        // Reset selected personas with the newly generated ones
        setSelectedPersonas(data.personas || []);
        setLoading(false);
        setStage("review");
    };
    const handleConfirm = async () => {
        if (!user) {
            console.error("User is not authenticated.");
            return;
        }

        setLoading(true);

        const combinedPersonas = [...personas, ...selectedPersonas];

        const userPersonasPayload = personas.map((persona) => ({
            persona_id: persona.persona_id,
            user_id: user.id,   // Associate with user
            name: persona.name,
            style: persona.style,
            is_custom_persona: true,
            prompt: persona.prompt,
        }));

        if (userPersonasPayload.length > 0) {
            const { error: userInsertError } = await supabase
                .from('personas')
                .upsert(userPersonasPayload, { onConflict: 'persona_id' });

            if (userInsertError) {
                console.error("Error inserting user personas:", userInsertError.message);
            }
        }

        const payload = {
            input,
            userId: user.id,
            personas: combinedPersonas.map((persona) => ({
                persona_id: persona.persona_id,
                name: persona.name,
                style: persona.style,
                prompt: persona.prompt,
            })),
        };

        const result = await fetch("/api/perspectives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await result.json();
        console.log("Generated responses:", data.responses);

        setResponses(data.responses);
        setSelectedPersonas([]); // Clear AI-generated personas after confirmation
        setStage("input");
        setPersonas([]); // Clear user-created personas after confirmation
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">🧠 Perspective Prism</h1>
                <Button onClick={logout}>Logout</Button>
            </div>

            {user ? (
                <>
                    <p className="mb-4 text-muted-foreground">Logged in as: {user.email}</p>

                    <Textarea
                        placeholder="What are you trying to think through, write, or reflect on?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="mb-4"
                    />

                    {stage === "input" && (
                        <>
                            <div className="flex gap-4 items-center mb-4">
                                <label className="text-sm font-medium">Debate Mode</label>
                                <Switch
                                    checked={mode === "debate"}
                                    onCheckedChange={() => setMode(mode === "standard" ? "debate" : "standard")}
                                />
                            </div>

                            <Button onClick={handleGenerate} disabled={loading}>
                                {loading ? <Loader className="animate-spin" /> : "Generate Personas"}
                            </Button>
                        </>
                    )}

                    {stage === "review" && (
                        <div className="mt-4">
                            <h2 className="text-xl font-semibold mb-2">🎭 Generated Personas</h2>
                            <div className="grid gap-4 mb-4">
                                {selectedPersonas.map((persona, idx) => (
                                    <Card key={persona.persona_id} className="relative">
                                        <CardHeader>
                                            <CardTitle>{persona.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{persona.style}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{persona.prompt}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <h2 className="text-xl font-semibold mb-2">🛠️ User-Created Personas</h2>
                            <div className="grid gap-4 mb-4">
                                {personas.map((persona, idx) => (
                                    <Card key={persona.persona_id} className="relative">
                                        <CardHeader>
                                            <CardTitle>{persona.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{persona.style}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{persona.prompt}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <CustomPersonaForm
                                onAdd={(newPersona) =>
                                    setPersonas((prev) => [{ ...newPersona, persona_id: crypto.randomUUID() }, ...prev])
                                }
                            />

                            <Button onClick={handleConfirm} disabled={loading}>
                                {loading ? <Loader className="animate-spin" /> : mode === "debate" ? "Start Debate" : "Generate Perspectives"}
                            </Button>
                        </div>
                    )}

                    {/* Render Perspectives - ONLY in Standard Mode */}
                    {mode === "standard" && Array.isArray(responses) && responses.length > 0 && (
                        <>
                            <div className="flex gap-4 mt-4 mb-4">
                                <Button variant={layout === "grid" ? "default" : "outline"} onClick={() => setLayout("grid")}>
                                    Side-by-Side
                                </Button>
                                <Button variant={layout === "column" ? "default" : "outline"} onClick={() => setLayout("column")}>
                                    Stacked
                                </Button>
                            </div>

                            <div className={`mt-6 ${layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-4"}`}>
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
                </>
            ) : (
                <p>Please log in to access Perspective Prism.</p>
            )}
        </div>
    );
}