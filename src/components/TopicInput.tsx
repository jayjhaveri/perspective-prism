import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  isLoading?: boolean;
}

const TopicInput = ({ onSubmit, isLoading = false }: TopicInputProps) => {
  const [topic, setTopic] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (topic.trim()) {
        localStorage.setItem('pending_topic', topic.trim());
      }
      navigate("/auth");
      return;
    }
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-medium text-center mb-2">What would you like perspectives on?</h2>
        <div className="relative">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic, question, or dilemma..."
            className="pr-12 text-lg py-6 rounded-xl"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
            disabled={!topic.trim() || isLoading}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-muted-foreground text-center text-sm">
          Example: "Should I start my own business?", "Remote work vs office", "Is AI a threat to humanity?"
        </p>
      </div>
    </form>
  );
};

export default TopicInput;
