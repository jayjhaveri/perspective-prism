
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Persona } from "@/types/perspective";
import { cn } from "@/lib/utils";

type PersonaCardProps = {
  persona: Persona;
  isSelected?: boolean;
  onSelect?: (persona: Persona) => void;
  onDelete?: (persona: Persona) => void;
  className?: string;
  showActions?: boolean;
  showDescription?: boolean;
};

const bgColors = {
  critical: "bg-perspective-orange",
  analytical: "bg-perspective-blue",
  creative: "bg-perspective-purple",
  optimistic: "bg-perspective-green",
  pessimistic: "bg-perspective-yellow",
  practical: "bg-perspective-pink",
};

const PersonaCard = ({
  persona,
  isSelected = false,
  onSelect,
  onDelete,
  className,
  showDescription = true,
  showActions = true,
}: PersonaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get first letter of each word in name for avatar
  const initials = persona.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const defaultBgClass = persona.style && bgColors[persona.style as keyof typeof bgColors]
    ? bgColors[persona.style as keyof typeof bgColors]
    : "bg-perspective-purple";

  return (
    <Card
      className={cn(
        "persona-card border-2 h-full",
        isSelected ? "border-primary" : "border-transparent",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="pt-6 px-4 pb-2">
        <div className="flex items-start gap-3">
          <Avatar className={cn("h-12 w-12", defaultBgClass)}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold">{persona.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{persona.style}</p>
          </div>
        </div>
        {showDescription && persona.description && (
          <div className="mt-4">
            <p className="text-sm line-clamp-3">{persona.description}</p>
          </div>
        )}

      </CardContent>
      {showActions && (
        <CardFooter className="px-4 pb-4 pt-0 flex justify-between">
          {onSelect && (
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => onSelect(persona)}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          )}
          {isHovered && onDelete && persona.isCustom && (
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => onDelete(persona)}
            >
              Remove
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default PersonaCard;
