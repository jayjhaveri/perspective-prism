
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Columns } from "lucide-react";

type ModeSelectionProps = {
  onSelectMode: (mode: "standard" | "debate") => void;
  disabled?: boolean;
};

const ModeSelection = ({ onSelectMode, disabled = false }: ModeSelectionProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <Card className={`border-2 hover:border-primary transition-all ${disabled ? 'opacity-50' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Standard Mode</CardTitle>
            <Columns className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>
            See all perspectives side by side
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Each persona provides their perspective in a parallel view. 
            Perfect for quick comparisons and comprehensive analysis.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => onSelectMode("standard")} 
            className="w-full"
            disabled={disabled}
          >
            Choose Standard Mode
          </Button>
        </CardFooter>
      </Card>
      
      <Card className={`border-2 hover:border-primary transition-all ${disabled ? 'opacity-50' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Debate Mode</CardTitle>
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <CardDescription>
            Watch personas debate with each other
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Personas engage in a back-and-forth conversation, responding to each
            other's points in real time. Great for deep exploration.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => onSelectMode("debate")} 
            className="w-full"
            disabled={disabled}
          >
            Choose Debate Mode
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ModeSelection;
