export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    scenarioId?: string;
    growthRate?: number;
    density?: string;
  };
  createdAt: string;
}

export interface ChatSession {
  id: string;
  scenarioId: string | null;
  growthRate: number;
  density: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}
