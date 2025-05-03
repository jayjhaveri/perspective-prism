// File: components/CustomPersonaForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export type Persona = {
    name: string;
    style: string;
    prompt: string;
    model: string;
};

interface CustomPersonaFormProps {
    onAdd: (persona: Persona) => void;
}

export default function CustomPersonaForm({ onAdd }: CustomPersonaFormProps) {
    const [form, setForm] = useState<Persona>({
        name: "",
        style: "",
        prompt: "",
        model: "",
    });

    const [modelOptions, setModelOptions] = useState<string[]>([]);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await fetch("/api/models");
                console.log("response", response);
                const data = await response.json();
                console.log("🔍 Models from /api/models:", data);

                if (!data.models) throw new Error("Invalid response");

                setModelOptions(data.models);
                setForm((f) => ({ ...f, model: data.models[0] }));
            } catch (error) {
                console.error("❌ Failed to fetch models from API route:", error);
            }
        };

        fetchModels();
    }, []);

    const handleChange = (field: keyof Persona, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = () => {
        if (!form.name.trim() || !form.prompt.trim()) return;
        onAdd(form);
        setForm({ name: "", style: "", prompt: "", model: modelOptions[0] });
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Create Your Own Persona</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Input
                    placeholder="Name (e.g., The Realist)"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                />
                <Input
                    placeholder="Style (e.g., practical, skeptical, rational)"
                    value={form.style}
                    onChange={(e) => handleChange("style", e.target.value)}
                />
                <Textarea
                    placeholder="System prompt defining this persona's behavior"
                    rows={4}
                    value={form.prompt}
                    onChange={(e) => handleChange("prompt", e.target.value)}
                />
                <select
                    className="border p-2 rounded-md"
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                >
                    {modelOptions.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                </select>
                <Button onClick={handleSubmit}>Add Persona</Button>
            </CardContent>
        </Card>
    );
}
