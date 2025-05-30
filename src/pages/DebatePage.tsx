import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DebatePerspective from "@/components/DebatePerspective";
import { supabase } from "@/integrations/supabase/client";
import { Persona } from "@/types/perspective";
import { useAuth } from "@/contexts/AuthContext";

const DebatePage = () => {
    const { debate_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [topic, setTopic] = useState("");
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        if (!user) {
            navigate("/auth");
            return;
        }
        if (!debate_id) return;
        const fetchDebate = async () => {
            setLoading(true);
            // Fetch debate topic
            const { data: debate, error: debateError } = await supabase
                .from("debates")
                .select("topic")
                .eq("debate_id", debate_id)
                .single();
            if (debateError || !debate) {
                navigate("/history");
                return;
            }
            setTopic(debate.topic);
            // Fetch personas from messages table (distinct persona_id, name, style, description)
            const { data: personaRows } = await supabase
                .from("messages")
                .select("persona_id, name")
                .eq("debate_id", debate_id);
            // Remove duplicates and nulls
            const personaMap: Record<string, Persona> = {};
            (personaRows || []).forEach((row) => {
                if (row.persona_id && row.name) {
                    personaMap[row.persona_id] = { id: row.persona_id, name: row.name, style: "", description: "" };
                }
            });
            setPersonas(Object.values(personaMap));
            // Fetch messages
            const { data: messageRows } = await supabase
                .from("messages")
                .select("message_id, persona_id, content, role, name")
                .eq("debate_id", debate_id)
                .order("created_at", { ascending: true });
            setMessages(
                (messageRows || []).map((m) => ({
                    id: m.message_id,
                    persona: m.persona_id ? personaMap[m.persona_id] : undefined,
                    content: m.content,
                    isUser: m.role === "user",
                    name: m.name,
                }))
            );
            setLoading(false);
        };
        fetchDebate();
    }, [debate_id, user, navigate]);

    if (loading) return <div className="p-8 text-center">Loading debate...</div>;
    if (!topic) return <div className="p-8 text-center">Debate not found.</div>;

    return (
        <DebatePerspective
            topic={topic}
            personas={personas}
            initialMessages={messages}
            isLoading={loading}
            onBack={() => navigate("/history")}
        />
    );
};

export default DebatePage;
