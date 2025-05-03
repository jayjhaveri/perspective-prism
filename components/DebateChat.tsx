// File: components/DebateChat.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader } from "lucide-react";

interface Persona {
    name: string;
    style: string;
    prompt: string;
    model: string;
}

interface Message {
    role: "user" | "persona";
    name: string;
    content: string;
}

interface DebateChatProps {
    personas: Persona[];
    initialInput: string;
}

export default function DebateChat({ personas, initialInput }: DebateChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "user", name: "You", content: initialInput },
    ]);
    const [typing, setTyping] = useState(false);
    const [streamBuffer, setStreamBuffer] = useState("");

    const continueDebate = async () => {
        setTyping(true);
        setStreamBuffer("");

        const res = await fetch("/api/debate", {
            method: "POST",
            body: JSON.stringify({ messages, personas }),
            headers: { "Content-Type": "application/json" },
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulated = "";

        if (!reader) return;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;
            setStreamBuffer(accumulated);
        }

        // After full message is received
        try {
            const parsed = JSON.parse(accumulated);
            if (parsed?.reply) {
                setMessages((prev) => [...prev, parsed.reply]);
            }
        } catch {
            // Fallback if response wasn't JSON
            setMessages((prev) => [
                ...prev,
                { role: "persona", name: "Unknown", content: accumulated },
            ]);
        }

        setTyping(false);
    };

    return (
        <div className="space-y-4 mt-6">
            <div className="border p-4 rounded-md bg-muted max-h-[400px] overflow-y-auto">
                {messages.map((msg, idx) => (
                    <div key={idx} className="mb-4">
                        <p className="text-sm font-semibold">{msg.name}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.content}</p>
                    </div>
                ))}
                {typing && (
                    <div className="mb-4">
                        <p className="text-sm font-semibold">...</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{streamBuffer}</p>
                    </div>
                )}
            </div>

            <Button onClick={continueDebate} disabled={typing}>
                {typing ? <Loader className="animate-spin" /> : "Continue Debate"}
            </Button>
        </div>
    );
}