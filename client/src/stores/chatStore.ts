import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '@/types/chat';

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingText: string;
  sessions: ChatSession[];

  addMessage: (message: ChatMessage) => void;
  setStreaming: (isStreaming: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (delta: string) => void;
  loadSession: (session: ChatSession) => void;
  startNewSession: () => void;
  setSessions: (sessions: ChatSession[]) => void;
  setSessionId: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,
  streamingText: '',
  sessions: [],

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setStreamingText: (text) => set({ streamingText: text }),

  appendStreamingText: (delta) =>
    set((state) => ({ streamingText: state.streamingText + delta })),

  loadSession: (session) =>
    set({
      sessionId: session.id,
      messages: session.messages || [],
      streamingText: '',
      isStreaming: false,
    }),

  startNewSession: () =>
    set({
      sessionId: null,
      messages: [],
      streamingText: '',
      isStreaming: false,
    }),

  setSessions: (sessions) => set({ sessions }),

  setSessionId: (id) => set({ sessionId: id }),
}));
