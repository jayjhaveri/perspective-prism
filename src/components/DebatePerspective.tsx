import { useState, useEffect, useRef } from "react";
import { Persona } from "@/types/perspective";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeft, SendIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

type Message = {
  id: string;
  persona?: Persona;
  content: string;
  isUser?: boolean;
  name?: string;
};

type DebatePerspectiveProps = {
  topic: string;
  personas: Persona[];
  initialMessages?: Message[];
  onAddMessage?: (content: string) => void;
  isLoading?: boolean;
  onBack: () => void;
};

const bgColors = {
  critical: "bg-perspective-orange",
  analytical: "bg-perspective-blue",
  creative: "bg-perspective-purple",
  optimistic: "bg-perspective-green",
  pessimistic: "bg-perspective-yellow",
  practical: "bg-perspective-pink",
};

const DebatePerspective = ({
  topic,
  personas,
  initialMessages = [],
  onAddMessage,
  isLoading = false,
  onBack,
}: DebatePerspectiveProps) => {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  // Use debateId from initialMessages if available, else null
  const [debateId, setDebateId] = useState<string | null>(() => {
    // Try to get debateId from initialMessages (if they have a debate_id field)
    if (initialMessages.length > 0 && (initialMessages as any)[0].debate_id) {
      return (initialMessages as any)[0].debate_id;
    }
    // Or from localStorage (for new sessions)
    return localStorage.getItem('debateId');
  });
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [lastUserMessageIndex, setLastUserMessageIndex] = useState<number>(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Initialize debate session
  useEffect(() => {
    // If we have initialMessages and debateId, do not create a new debate
    if (initialMessages.length > 0 && debateId) {
      setMessages(initialMessages);
      setDebateId(debateId);
      return;
    }
    // Otherwise, create a new debate (for new sessions only)
    const initializeDebate = async () => {
      if (!user) return;
      try {
        console.log("Initializing debate session...");
        // Create a new debate session
        const { data: debate, error: debateError } = await supabase
          .from('debates')
          .insert({
            user_id: user.id,
            topic,
            status: 'ongoing'
          })
          .select()
          .single();

        if (debateError) {
          console.error('Debate creation error:', debateError);
          throw debateError;
        }

        setDebateId(debate.debate_id);
        localStorage.setItem('debateId', debate.debate_id);
        console.log("Created debate session:", debate.debate_id);

        // Add initial topic message
        const topicMessage: Message = {
          id: "topic",
          content: topic,
          isUser: true,
          name: "You"
        };
        setMessages([topicMessage]);
        localStorage.setItem(`debateMessages_${debate.debate_id}`, JSON.stringify([topicMessage]));
      } catch (error) {
        console.error('Error initializing debate:', error);
        toast({
          title: "Error starting debate",
          description: "Failed to initialize debate session.",
          variant: "destructive"
        });
      }
    };
    if (!debateId) {
      initializeDebate();
    }
  }, [topic, personas, user, initialMessages, debateId]);

  // Persist messages and debateId to localStorage on change (debate-specific)
  useEffect(() => {
    if (debateId) localStorage.setItem('debateId', debateId);
    if (debateId) localStorage.setItem(`debateMessages_${debateId}`, JSON.stringify(messages));
  }, [debateId, messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const startDebateIfNeeded = async () => {
      if (
        debateId &&
        personas.length > 0 &&
        messages.length === 1 && // Only the topic message exists
        messages[0].id === 'topic' &&
        !isGenerating
      ) {
        // Start the debate with the first persona responding to the topic
        setIsGenerating(true);
        await generatePersonaResponse(topic, 0, true); // true = isFirstRound
        setIsGenerating(false);
      }
    };
    startDebateIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debateId, personas, messages]);

  const generatePersonaResponse = async (userInput: string, personaIndexOverride?: number, isFirstRound?: boolean) => {
    if (!debateId || personas.length === 0) return;
    setIsGenerating(true);
    try {
      const personaIndex = typeof personaIndexOverride === 'number' ? personaIndexOverride : currentPersonaIndex;
      const nextPersona = personas[personaIndex];
      let lastPersonaMsg = false;
      let previousSpeaker = undefined;
      let previousContent = undefined;
      let formattedMessages: { role: string; content: string; name: string }[] = [];
      // Always get the latest user message
      const lastUserMsg = messages.slice().reverse().find(m => m.isUser);
      // For sequential persona turns, always use the latest persona message from the database, not local state
      let prevPersonaMsg = null;
      if (personaIndex > 0) {
        // Fetch persona messages for this debate from Supabase, ordered by created_at
        const { data: dbMessages } = await supabase
          .from('messages')
          .select('role, name, content')
          .eq('debate_id', debateId)
          .order('created_at', { ascending: true });
        const personaMessages = (dbMessages || []).filter(m => m.role === 'persona');
        prevPersonaMsg = personaMessages[personaMessages.length - 1];
      }
      if (personaIndex === 0) {
        if (lastUserMsg) {
          formattedMessages = [
            { role: 'user', content: lastUserMsg.content, name: lastUserMsg.name || 'You' }
          ];
        }
      } else if (lastUserMsg && prevPersonaMsg) {
        lastPersonaMsg = true;
        previousSpeaker = prevPersonaMsg.name;
        previousContent = prevPersonaMsg.content;
        formattedMessages = [
          { role: 'user', content: lastUserMsg.content, name: lastUserMsg.name || 'You' },
          { role: 'user', content: prevPersonaMsg.content, name: prevPersonaMsg.name }
        ];
      }
      // Remove persona upsert logic from generatePersonaResponse
      let personaId = nextPersona.id;
      // No upsert or insert here; assume persona already exists in DB
      const { data, error } = await supabase.functions.invoke('generate-debate-response', {
        body: {
          personas: [
            {
              ...nextPersona,
              prompt: nextPersona.description || `You are ${nextPersona.name}, a ${nextPersona.style} persona.`
            }
          ],
          userInput,
          messages: formattedMessages,
          debateId,
          lastPersonaMsg,
          previousSpeaker,
          previousContent
        }
      });
      let personaResponded = false;
      if (data && typeof data === 'object' && data.response) {
        const newMessage: Message = {
          id: `persona-${Date.now()}`,
          persona: nextPersona,
          content: data.response,
          isUser: false,
          name: nextPersona.name
        };
        setMessages(prev => [...prev, newMessage]);
        // Insert persona message into Supabase for backend debate continuity
        personaResponded = true;
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.response) {
            const newMessage: Message = {
              id: `persona-${Date.now()}`,
              persona: nextPersona,
              content: parsed.response,
              isUser: false,
              name: nextPersona.name
            };
            setMessages(prev => [...prev, newMessage]);
            personaResponded = true;
          }
        } catch (e) {
          const newMessage: Message = {
            id: `persona-${Date.now()}`,
            persona: nextPersona,
            content: data,
            isUser: false,
            name: nextPersona.name
          };
          setMessages(prev => [...prev, newMessage]);
          personaResponded = true;
        }
      }
      // After each persona responds, trigger the next persona until all have responded
      if (personaResponded) {
        const nextIndex = personaIndex + 1;
        if (nextIndex < personas.length) {
          // Wait for the previous persona's message to be inserted before triggering the next
          await generatePersonaResponse(userInput, nextIndex, isFirstRound);
          setCurrentPersonaIndex(nextIndex);
        } else {
          setCurrentPersonaIndex(0);
          setLastUserMessageIndex(messages.length + 1);
        }
      }
    } catch (error) {
      console.error('Error generating persona response:', error);
      toast({
        title: "Error generating response",
        description: "Failed to generate persona response.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (userMessage.trim() && !isGenerating) {
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        content: userMessage,
        isUser: true,
        name: "You"
      };
      setMessages(prev => [...prev, newUserMessage]);
      const currentInput = userMessage;
      setUserMessage("");
      await supabase.from('messages').insert({
        debate_id: debateId,
        role: 'user',
        name: 'You',
        content: currentInput,
      });
      // Start a new round: trigger first persona
      await generatePersonaResponse(currentInput, 0, false);
      if (onAddMessage) {
        onAddMessage(currentInput);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get avatar initials from persona name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Get background color for persona avatar
  const getAvatarBgClass = (persona?: Persona) => {
    if (!persona) return "bg-gray-400";

    return persona.style && bgColors[persona.style as keyof typeof bgColors]
      ? bgColors[persona.style as keyof typeof bgColors]
      : "bg-perspective-purple";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 flex flex-col h-[80vh]">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="font-semibold text-lg">Debate: {topic}</h2>
        <div className="w-20"></div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="p-4 flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 debate-message",
                    message.isUser ? "justify-end" : "",
                    `message-appear`
                  )}
                  style={{ '--index': index } as React.CSSProperties}
                >
                  {!message.isUser && message.persona && (
                    <Avatar className={cn("h-10 w-10", getAvatarBgClass(message.persona))}>
                      <AvatarFallback>{getInitials(message.persona.name)}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn(
                    "max-w-[75%] rounded-lg p-3",
                    message.isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    {message.name && !message.isUser && (
                      <p className="font-semibold text-sm mb-1">{message.name}</p>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.isUser && (
                    <Avatar className="h-10 w-10 bg-primary">
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-start gap-3 debate-message">
                  <Avatar className="h-10 w-10 bg-muted">
                    <AvatarFallback>...</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-4 max-w-[75%]">
                    <div className="typing-indicator">
                      Typing...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add your thoughts to the conversation..."
              className="flex-1 resize-none"
              rows={2}
              disabled={isGenerating}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || isGenerating}
              className="h-10"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DebatePerspective;
