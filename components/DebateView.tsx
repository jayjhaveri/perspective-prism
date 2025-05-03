// File: components/DebateView.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface Props {
    input: string;
    personas: Persona[];
    onExit: () => void;
}

export default function DebateView({ input, personas, onExit }: Props) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "user", name: "You", content: input },
    ]);
    const [streaming, setStreaming] = useState(false);
    const [userInput, setUserInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!streaming) triggerNextTurn();
    }, [messages]);

    const triggerNextTurn = async () => {
        setStreaming(true);
        const res = await fetch("/api/debate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, personas }),
        });

        const reader = res.body?.getReader();
        if (!reader) return;

        let fullMessage = "";
        let personaName = "";
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullMessage += chunk;
            const parsed = fullMessage.match(/^(\*\*[^:]+\*\*):\s*/);
            if (parsed && !personaName) {
                personaName = parsed[1].replace(/\*\*/g, "");
            }

            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "persona" && last.name === personaName) {
                    last.content = fullMessage;
                } else {
                    updated.push({ role: "persona", name: personaName || "", content: fullMessage });
                }
                return [...updated];
            });
        }

        setStreaming(false);
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleUserSend = () => {
        if (!userInput.trim()) return;
        setMessages([...messages, { role: "user", name: "You", content: userInput }]);
        setUserInput("");
    };

    return (
        <div className="mt-6 space-y-4">
            <ScrollArea className="h-[500px] border rounded-md p-4">
                {messages.map((msg, i) => (
                    <div key={i} className="mb-3">
                        <strong className="block mb-1">{msg.name}</strong>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{msg.content}</p>
                    </div>
                ))}
                <div ref={scrollRef} />
            </ScrollArea>

            <div className="flex gap-2">
                <Textarea
                    placeholder="Add your thoughts..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                />
                <Button onClick={handleUserSend} disabled={streaming}>
                    Send
                </Button>
                <Button variant="outline" onClick={onExit}>
                    Exit
                </Button>
            </div>

            {streaming && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader className="animate-spin w-4 h-4" /> Typing...
                </div>
            )}
        </div>
    );
}
