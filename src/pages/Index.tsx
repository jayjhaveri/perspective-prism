import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TopicInput from "@/components/TopicInput";
import PersonaSelection from "@/components/PersonaSelection";
import ModeSelection from "@/components/ModeSelection";
import StandardPerspective from "@/components/StandardPerspective";
import DebatePerspective from "@/components/DebatePerspective";
import PerspectiveHeader from "@/components/PerspectiveHeader";
import { Persona, PerspectiveMode } from "@/types/perspective";
import { generateMockResponses, generatePersonasForTopic, MOCK_PERSONAS } from "@/lib/mock-data";
import { generatePersonas, saveDebateSession, generateResponses, createStandardInteraction } from "@/lib/supabase-helpers";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const STEPS = ["TOPIC", "PERSONAS", "MODE", "VIEW"] as const;
type Step = typeof STEPS[number];

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>("TOPIC");
  const [topic, setTopic] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<Persona[]>([]);
  const [mode, setMode] = useState<PerspectiveMode>("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const { user } = useAuth();

  // Generate personas when a topic is submitted
  const handleTopicSubmit = async (newTopic: string) => {
    setTopic(newTopic);
    setIsLoading(true);

    //clear selected personas
    setSelectedPersonas([]);

    try {
      const generatedPersonas = await generatePersonas(newTopic);
      setPersonas(generatedPersonas);
      setCurrentStep("PERSONAS");
    } catch (error) {
      console.error('Error generating personas:', error);
      toast({
        title: "Error generating personas",
        description: "Using fallback personas instead.",
        variant: "destructive"
      });
      // Use fallback personas
      const fallbackPersonas = generatePersonasForTopic(newTopic);
      setPersonas(fallbackPersonas);
      setCurrentStep("PERSONAS");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle persona selection
  const handlePersonaToggle = (persona: Persona) => {
    setSelectedPersonas(prev => {
      const isSelected = prev.some(p => p.id === persona.id);

      if (isSelected) {
        return prev.filter(p => p.id !== persona.id);
      } else {
        if (prev.length >= 4) {
          toast({
            title: "Maximum selection reached",
            description: "You can select up to 4 personas for a session.",
            variant: "destructive"
          });
          return prev;
        }
        return [...prev, persona];
      }
    });
  };

  // Add custom persona
  const handleAddCustomPersona = (persona: Persona) => {
    setPersonas(prev => [...prev, persona]);
    setSelectedPersonas(prev => {
      if (prev.length >= 4) {
        toast({
          title: "Maximum selection reached",
          description: "You can select up to 4 personas for a session.",
          variant: "destructive"
        });
        return prev;
      }
      return [...prev, persona];
    });
  };

  // Delete custom persona
  const handleDeletePersona = (persona: Persona) => {
    setPersonas(prev => prev.filter(p => p.id !== persona.id));
    console.log("Deleting persona:", persona);
    setSelectedPersonas(prev => prev.filter(p => p.id !== persona.id));
  };

  // Select mode and proceed
  const handleSelectMode = async (selectedMode: PerspectiveMode) => {
    setMode(selectedMode);
    setIsLoading(true);

    try {
      console.log("selected personas:", selectedPersonas);
      // Save session if user is logged in
      if (user && selectedMode === "debate") {
        // Always clear previous debate state when mounting or topic/personas change
        localStorage.removeItem('debateId');
        localStorage.removeItem('debateMessages');
        // await saveDebateSession(topic, selectedMode, selectedPersonas);
        toast({
          title: "Session saved",
          description: "Your perspective session has been saved to your history.",
        });
      }

      // Only generate AI responses for standard mode
      if (selectedMode === "standard") {
        const standardInteraction = await createStandardInteraction(user.id, topic);
        const aiResponses = await generateResponses(selectedPersonas, topic, standardInteraction.interaction_id);
        setResponses(aiResponses);
      } else {
        // For debate mode, responses will be generated dynamically
        setResponses({});
      }

      setCurrentStep("VIEW");
    } catch (error) {
      console.error('Error saving session or generating responses:', error);
      toast({
        title: "Error",
        description: selectedMode === "standard"
          ? "Session will continue with mock responses."
          : "Session saved but may have issues.",
        variant: "destructive"
      });

      // Continue with mock responses for standard mode only
      if (selectedMode === "standard") {
        const mockResponses = generateMockResponses(selectedPersonas, topic);
        setResponses(mockResponses);
      }
      setCurrentStep("VIEW");
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStep === "PERSONAS") {
      setCurrentStep("TOPIC");
    } else if (currentStep === "MODE") {
      setCurrentStep("PERSONAS");
    } else if (currentStep === "VIEW") {
      setCurrentStep("MODE");
    }
  };

  // Initial mock custom personas
  useEffect(() => {
    const customPersonas: Persona[] = [
      {
        id: "custom-1",
        name: "Product Manager",
        style: "practical",
        description: "Balances user needs with business goals. Focuses on feasibility and market fit.",
        isCustom: true,
      },
      {
        id: "custom-2",
        name: "Environmental Advocate",
        style: "critical",
        description: "Evaluates impacts on sustainability and ecological systems. Prioritizes long-term planetary health.",
        isCustom: true,
      },
    ];

    setPersonas([...MOCK_PERSONAS, ...customPersonas]);
  }, []);

  // Auto-proceed with pending topic after login
  useEffect(() => {
    if (user && currentStep === "TOPIC") {
      const pendingTopic = localStorage.getItem("pending_topic");
      if (pendingTopic) {
        localStorage.removeItem("pending_topic");
        handleTopicSubmit(pendingTopic);
      }
    }
  }, [user, currentStep]);

  return (
    <div className="min-h-screen flex flex-col">
      <PerspectiveHeader />

      <main className="flex-1 py-8 container">
        {currentStep === "TOPIC" && (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold mb-2 text-center">Perspective Prism</h1>
            <p className="text-muted-foreground mb-8 text-center max-w-lg">
              Explore multiple viewpoints on any topic with AI-powered personas
            </p>
            <TopicInput onSubmit={handleTopicSubmit} isLoading={isLoading} />
          </div>
        )}

        {currentStep === "PERSONAS" && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex justify-between items-center">
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <h2 className="text-xl font-medium">{topic}</h2>
              <Button
                onClick={() => setCurrentStep("MODE")}
                disabled={selectedPersonas.length < 2}
              >
                Next
              </Button>
            </div>
            <PersonaSelection
              personas={personas}
              selectedPersonas={selectedPersonas}
              onPersonaToggle={handlePersonaToggle}
              onAddCustomPersona={handleAddCustomPersona}
              onDeletePersona={handleDeletePersona}
              className="mt-4"
            />
            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Select 2-4 personas for your perspective session
              </p>
              <Button
                onClick={() => setCurrentStep("MODE")}
                disabled={selectedPersonas.length < 2}
                size="lg"
              >
                Continue with {selectedPersonas.length} selected
              </Button>
            </div>
          </div>
        )}

        {currentStep === "MODE" && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <h2 className="text-xl font-medium">{topic}</h2>
              <div className="w-20"></div>
            </div>
            <h2 className="text-2xl font-medium mb-6 text-center">
              Choose Your Perspective Mode
            </h2>
            <ModeSelection
              onSelectMode={handleSelectMode}
              disabled={isLoading}
            />
          </div>
        )}

        {currentStep === "VIEW" && mode === "standard" && (
          <StandardPerspective
            topic={topic}
            personas={selectedPersonas}
            responses={responses}
            isLoading={isLoading}
            onBack={() => setCurrentStep("MODE")}
          />
        )}

        {currentStep === "VIEW" && mode === "debate" && (
          <DebatePerspective
            topic={topic}
            personas={selectedPersonas}
            isLoading={isLoading}
            onBack={() => setCurrentStep("MODE")}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
