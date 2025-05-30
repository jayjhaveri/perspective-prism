
import { Persona, PerspectiveSession } from "@/types/perspective";

export const MOCK_PERSONAS: Persona[] = [
  {
    id: "analytical",
    name: "Data-Driven Analyst",
    style: "analytical",
    description: "Focuses on evidence and logical reasoning. Weighs pros and cons methodically and values quantifiable metrics.",
  },
  {
    id: "creative",
    name: "Creative Visionary",
    style: "creative",
    description: "Thinks outside the box. Seeks novel connections and innovative approaches to problems.",
  },
  {
    id: "critical",
    name: "Devil's Advocate",
    style: "critical",
    description: "Identifies potential flaws and challenges. Questions assumptions to reveal hidden issues.",
  },
  {
    id: "optimistic",
    name: "Optimistic Enthusiast",
    style: "optimistic",
    description: "Focuses on possibilities and positive outcomes. Believes in the potential for success.",
  },
  {
    id: "pessimistic",
    name: "Cautious Realist",
    style: "pessimistic",
    description: "Anticipates what could go wrong. Prepares for worst-case scenarios and mitigates risks.",
  },
  {
    id: "practical",
    name: "Pragmatic Implementer",
    style: "practical",
    description: "Focuses on what's feasible and actionable. Values efficiency and practical outcomes.",
  },
];

export const MOCK_HISTORY: PerspectiveSession[] = [
  {
    id: "1",
    topic: "Should I start my own business?",
    mode: "debate",
    personas: [
      MOCK_PERSONAS[0],
      MOCK_PERSONAS[2],
      MOCK_PERSONAS[3],
    ],
    createdAt: "2023-05-10T14:23:45Z",
  },
  {
    id: "2",
    topic: "Is remote work better than office work?",
    mode: "standard",
    personas: [
      MOCK_PERSONAS[1],
      MOCK_PERSONAS[4],
      MOCK_PERSONAS[5],
    ],
    createdAt: "2023-05-08T09:15:30Z",
  },
  {
    id: "3",
    topic: "Should I adopt a pet?",
    mode: "debate",
    personas: [
      MOCK_PERSONAS[0],
      MOCK_PERSONAS[3],
      MOCK_PERSONAS[4],
    ],
    createdAt: "2023-05-05T16:42:12Z",
  },
];

export const generateMockResponses = (personas: Persona[], topic: string): Record<string, string> => {
  const responses: Record<string, string> = {};
  
  personas.forEach((persona) => {
    let response = "";
    
    switch (persona.style) {
      case "analytical":
        response = `When analyzing "${topic}", we need to consider the data and evidence. Let's break this down into key factors:\n\n1. Historical precedent shows...\n2. Research indicates...\n3. The measurable outcomes suggest...\n\nWeighing the quantifiable benefits against potential costs, a systematic approach would be recommended.`;
        break;
      case "creative":
        response = `What if we approached "${topic}" from an entirely new angle? Imagine combining seemingly unrelated concepts:\n\n• What if we flipped our assumptions?\n• Could we borrow principles from nature or other domains?\n• Perhaps a hybrid approach would yield innovative results!\n\nThe possibilities are exciting and full of untapped potential.`;
        break;
      case "critical":
        response = `I see several potential issues with "${topic}" that require scrutiny:\n\n- Have we considered the unintended consequences?\n- There's an underlying assumption here that needs challenging.\n- Historical attempts at similar endeavors have encountered obstacles including...\n\nWe must address these concerns before proceeding.`;
        break;
      case "optimistic":
        response = `I'm excited about the possibilities of "${topic}"! This presents several wonderful opportunities:\n\n• We could achieve breakthrough results by...\n• The potential upside is tremendous if we...\n• Even challenges can become stepping stones toward...\n\nWith the right approach, success is definitely achievable.`;
        break;
      case "pessimistic":
        response = `We should be cautious about "${topic}" for several reasons:\n\n- What happens if X goes wrong?\n- There's significant risk of Y occurring.\n- Previous attempts have failed because of Z.\n\nWe should prepare contingency plans and set realistic expectations to avoid disappointment.`;
        break;
      case "practical":
        response = `Let's focus on what's actually doable with "${topic}":\n\n1. First, we need these specific resources...\n2. A step-by-step implementation would involve...\n3. We can measure success by these concrete metrics...\n\nKeeping it simple and action-oriented will yield the best results.`;
        break;
      default:
        response = `Regarding "${topic}", my perspective is shaped by my unique approach. There are multiple factors to consider, and I believe a balanced assessment leads to the best outcome.`;
    }
    
    responses[persona.id] = response;
  });
  
  return responses;
};

export const generatePersonasForTopic = (topic: string): Persona[] => {
  // In a real implementation, this would call an API to generate custom personas
  // For now, we'll return some of the mock personas with slight variations
  
  const selected = [...MOCK_PERSONAS]
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);
  
  return selected.map((persona, index) => ({
    ...persona,
    id: `generated-${index}-${Date.now()}`,
  }));
};
