import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import StandardPerspective from '@/components/StandardPerspective';
import { supabase } from '@/integrations/supabase/client';
import PerspectiveHeader from '@/components/PerspectiveHeader';
import { useAuth } from '@/contexts/AuthContext';

const StandardPage = () => {
    const { interaction_id } = useParams<{ interaction_id: string }>();
    const [loading, setLoading] = useState(true);
    const [interaction, setInteraction] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {

        if (!user) {
            navigate('/auth');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            // Fetch the standard interaction
            const { data: interactionData, error: interactionError } = await (supabase as any)
                .from('standard_interactions')
                .select('*')
                .eq('interaction_id', interaction_id)
                .single();
            if (interactionError || !interactionData) {
                setLoading(false);
                return;
            }
            setInteraction(interactionData);

            // Fetch related messages (if any)
            const { data: messageData } = await (supabase as any)
                .from('messages')
                .select('*')
                .eq('interaction_id', interaction_id)
                .order('created_at', { ascending: true });

            for (const msg of messageData || []) {
                //add style for persona messages
                if (msg.role === 'persona' && msg.persona_id) {
                    const { data: personaData } = await supabase
                        .from('personas')
                        .select('style')
                        .eq('persona_id', msg.persona_id)
                        .single();
                    if (personaData) {
                        msg.style = personaData.style || '';
                    }
                }
            };

            setMessages(messageData || []);
            setLoading(false);
        };
        if (interaction_id) fetchData();
    }, [interaction_id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <PerspectiveHeader />
                <main className="flex-1 py-8 container">
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading your standard session...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!interaction) {
        return (
            <div className="min-h-screen flex flex-col">
                <PerspectiveHeader />
                <main className="flex-1 py-8 container">
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="text-muted-foreground mb-4">
                                <h3 className="text-lg font-medium mb-2">Session not found</h3>
                                <p>We couldn't find this standard session.</p>
                            </div>
                            <button onClick={() => navigate('/history')} className="btn btn-primary mt-4">Back to History</button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // Build personas from all unique persona_id/name pairs in messages (user and persona)
    const personaMap: Record<string, any> = {};
    messages.forEach((msg) => {
        if (msg.role === 'user') {
            personaMap[msg.user_id] = {
                id: msg.user_id,
                name: 'You',
                style: 'user',
                description: '',
                isCustom: false,
            };
        } else if (msg.role === 'persona' && msg.persona_id) {
            personaMap[msg.persona_id] = {
                id: msg.persona_id,
                name: msg.name || 'Persona',
                style: msg.style || '',
                description: msg.description || '',
                isCustom: false,
            };
        }
    });
    const personas = Object.values(personaMap);

    // Map latest message for each persona/user
    const responses: Record<string, string> = {};
    messages.forEach((msg) => {
        if (msg.role === 'user') {
            responses[msg.user_id] = msg.content;
        } else if (msg.role === 'persona' && msg.persona_id) {
            responses[msg.persona_id] = msg.content;
        }
    });

    return (
        <div className="min-h-screen flex flex-col">
            <PerspectiveHeader />
            <main className="flex-1 py-8 container">
                <StandardPerspective
                    topic={interaction.input}
                    personas={personas}
                    responses={responses}
                    isLoading={false}
                    onBack={() => navigate('/history')}
                />
            </main>
        </div>
    );
};

export default StandardPage;
