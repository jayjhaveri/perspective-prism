import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Persona } from "@/types/perspective";

type CreatePersonaFormProps = {
  onSubmit: (persona: Persona) => void;
  onCancel: () => void;
};

const CreatePersonaForm = ({ onSubmit, onCancel }: CreatePersonaFormProps) => {
  const [name, setName] = useState("");
  const [style, setStyle] = useState("analytical");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name && style && description) {
      const newPersona: Persona = {
        id: `custom-${Date.now()}`,
        name,
        style,
        description,
        isCustom: true,
      };
      
      onSubmit(newPersona);
    }
  };

  return (
    <Card className="mb-4">
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tech Optimist"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Input
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. analytical, creative, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how this persona thinks and approaches problems..."
              rows={3}
              required
              className="resize-none"
            />
          </div>
        </CardContent>
        
        <CardFooter className="justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name || !style || !description}>
            Create Persona
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreatePersonaForm;
