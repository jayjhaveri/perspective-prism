
export interface Persona {
  id: string;
  name: string;
  style: string;
  description: string;
  isCustom?: boolean;
}

export interface PerspectiveSession {
  id: string;
  topic: string;
  mode: "standard" | "debate";
  personas: Persona[];
  createdAt: string;
  content?: Record<string, string>;
  messages?: Array<{
    id: string;
    personaId?: string;
    content: string;
    isUser?: boolean;
  }>;
}

export type PerspectiveMode = "standard" | "debate";
