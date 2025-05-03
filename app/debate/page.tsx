"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { Persona, usePersonaContext } from "@/app/context/PersonaContext";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "persona";
    name: string;
    content: string;
}

export default function DebatePage() {
    const router = useRouter();
    const { input, personas } = usePersonaContext();

    const [userInput, setUserInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [debateStarted, setDebateStarted] = useState(false);
    const [typing, setTyping] = useState(false);
    const [turnIndex, setTurnIndex] = useState(0);

    const [autoMode, setAutoMode] = useState(true);
    const autoRounds = 6;
    const [currentAutoTurn, setCurrentAutoTurn] = useState(0);
    const abortRef = useRef<AbortController | null>(null);

    const currentPersona = personas[turnIndex % personas.length];

    // Redirect if data is missing
    useEffect(() => {
        if (!input?.trim() || !Array.isArray(personas) || personas.length === 0) {
            router.replace("/");
        } else {
            setMessages([{ role: "user", name: "You", content: input }]);
            setDebateStarted(true);
        }
    }, [input, personas, router]);

    // Auto play loop
    useEffect(() => {
        if (autoMode && currentAutoTurn < autoRounds && debateStarted && !typing) {
            const timeout = setTimeout(() => handleNextTurn(), 1000);
            return () => clearTimeout(timeout);
        }
    }, [messages, typing, currentAutoTurn, autoMode, debateStarted]);

    const handleStreamTurn = async () => {
        setTyping(true);
        const controller = new AbortController();
        abortRef.current = controller;

        const nextPersona = personas[turnIndex % personas.length];

        const res = await fetch("/api/debate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, personas }),
            signal: controller.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) {
            console.error("No response body from /api/debate");
            setTyping(false);
            return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        // Start with empty message placeholder
        let accumulatedText = "";
        setMessages((prev) => [
            ...prev.slice(0, -1),
            { ...prev[prev.length - 1], name: nextPersona.name, content: "" },
        ]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;

            setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                updated[updated.length - 1] = {
                    ...lastMsg,
                    name: nextPersona.name,
                    content: accumulatedText,
                };
                return updated;
            });
        }

        if (!accumulatedText.trim()) {
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { ...prev[prev.length - 1], name: nextPersona.name, content: "(No response)" },
            ]);
        }

        setTyping(false);
        setCurrentAutoTurn((prev) => prev + 1);
    };

    const handleNextTurn = () => {
        if (typing || messages[messages.length - 1]?.name === "Loading...") return;
        const nextMsg: Message = { role: "persona", name: "Loading...", content: "" };
        setMessages((prev) => [...prev, nextMsg]);
        setTurnIndex((prev) => prev + 1);
        handleStreamTurn();
    };

    const handleUserInterject = () => {
        if (!userInput.trim()) return;
        setMessages((prev) => [...prev, { role: "user", name: "You", content: userInput }]);
        setUserInput("");
        setAutoMode(false); // Pause auto on user interjection
    };

    useEffect(() => {
        const el = document.getElementById("debate-end");
        el?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typing]);

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">🗣️ Debate Mode</h1>
                <Button variant="outline" onClick={() => router.replace("/")}>
                    🔁 Restart
                </Button>
            </div>

            {debateStarted && (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <label className="text-sm font-medium">Auto Debate</label>
                        <input
                            type="checkbox"
                            checked={autoMode}
                            onChange={() => setAutoMode(!autoMode)}
                        />
                        <span className="text-sm text-muted-foreground">
                            ({currentAutoTurn}/{autoRounds})
                        </span>
                    </div>

                    <div className="space-y-4">
                        {messages.map((m, idx) => (
                            <Card
                                key={idx}
                                className={`bg-muted ${m.name === currentPersona.name ? "border-2 border-blue-500" : ""
                                    }`}
                            >
                                <CardHeader>
                                    <CardTitle className="text-base">{m.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="prose max-w-none">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </CardContent>
                            </Card>
                        ))}
                        {typing && (
                            <Card className="bg-muted/50 animate-pulse">
                                <CardHeader>
                                    <CardTitle>Typing...</CardTitle>
                                </CardHeader>
                                <CardContent>...</CardContent>
                            </Card>
                        )}
                        <div id="debate-end" />
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        <Textarea
                            placeholder="Add your thought..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <Button onClick={handleUserInterject}>Send</Button>
                            <Button onClick={handleNextTurn} disabled={typing || autoMode}>
                                {typing ? <Loader className="animate-spin" /> : "Next Turn"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}