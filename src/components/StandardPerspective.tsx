
import { Persona } from "@/types/perspective";
import PersonaCard from "./PersonaCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type StandardPerspectiveProps = {
  topic: string;
  personas: Persona[];
  responses: Record<string, string>;
  isLoading?: boolean;
  onBack: () => void;
};

const StandardPerspective = ({
  topic,
  personas,
  responses,
  isLoading = false,
  onBack,
}: StandardPerspectiveProps) => {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="font-semibold text-lg">{topic}</h2>
        <div className="w-20"></div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="stacked">Stacked View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <Card key={persona.id} className="h-full flex flex-col">
                <CardContent className="pt-6 pb-6 flex flex-col h-full">
                  <PersonaCard
                    persona={persona}
                    className="border-none shadow-none mb-4"
                    showDescription={false}
                    showActions={false}
                  />
                  <div className="flex-grow">
                    {isLoading ? (
                      <div className="animate-pulse-soft mt-4">
                        <div className="h-4 bg-muted rounded-full mb-2"></div>
                        <div className="h-4 bg-muted rounded-full mb-2 w-11/12"></div>
                        <div className="h-4 bg-muted rounded-full mb-2 w-10/12"></div>
                        <div className="h-4 bg-muted rounded-full mb-2 w-9/12"></div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="whitespace-pre-wrap">{responses[persona.id] || ""}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stacked">
          {personas.map((persona) => (
            <Card key={persona.id} className="mb-4">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-[240px]">
                    <PersonaCard
                      persona={persona}
                      className="border-none shadow-none"
                      showDescription={false}
                      showActions={false}
                    />
                  </div>
                  <div className="flex-1">
                    {isLoading ? (
                      <div className="animate-pulse-soft">
                        <div className="h-4 bg-muted rounded-full mb-2"></div>
                        <div className="h-4 bg-muted rounded-full mb-2 w-11/12"></div>
                        <div className="h-4 bg-muted rounded-full mb-2 w-10/12"></div>
                        <div className="h-4 bg-muted rounded-full mb-2 w-9/12"></div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{responses[persona.id] || ""}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StandardPerspective;
