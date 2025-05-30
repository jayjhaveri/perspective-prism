
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import PersonaCard from "./PersonaCard";
import { Persona } from "@/types/perspective";
import CreatePersonaForm from "./CreatePersonaForm";
import { ScrollArea } from "@/components/ui/scroll-area";

type PersonaSelectionProps = {
  personas: Persona[];
  selectedPersonas: Persona[];
  onPersonaToggle: (persona: Persona) => void;
  onAddCustomPersona: (persona: Persona) => void;
  onDeletePersona: (persona: Persona) => void;
  className?: string;
};

const PersonaSelection = ({
  personas,
  selectedPersonas,
  onPersonaToggle,
  onAddCustomPersona,
  onDeletePersona,
  className,
}: PersonaSelectionProps) => {
  const [activeTab, setActiveTab] = useState<string>("generated");
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const generatedPersonas = personas.filter(p => !p.isCustom);
  const customPersonas = personas.filter(p => p.isCustom);
  
  const isSelected = (persona: Persona) => 
    selectedPersonas.some(p => p.id === persona.id);
  
  return (
    <div className={className}>
      <h2 className="text-2xl font-medium mb-4 text-center">
        Choose your perspectives
      </h2>
      <Tabs defaultValue="generated" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="generated">Generated Personas</TabsTrigger>
          <TabsTrigger value="custom">Custom Personas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generated" className="mt-2">
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={isSelected(persona)}
                  onSelect={() => onPersonaToggle(persona)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="custom" className="mt-2">
          <ScrollArea className="h-[400px] pr-4">
            {showCreateForm ? (
              <CreatePersonaForm
                onSubmit={(persona) => {
                  onAddCustomPersona(persona);
                  setShowCreateForm(false);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-44 border-dashed"
                  onClick={() => setShowCreateForm(true)}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Custom Persona
                </Button>
                {customPersonas.map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    isSelected={isSelected(persona)}
                    onSelect={() => onPersonaToggle(persona)}
                    onDelete={onDeletePersona}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonaSelection;
