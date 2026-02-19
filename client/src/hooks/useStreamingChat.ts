import { useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { apiStreamUrl } from '@/lib/api';
import type { ChatMessage } from '@/types/chat';

interface ScenarioContext {
  scenarioId?: string;
  scenarioName: string;
  description: string;
  growthRate: number;
  density: string;
  acres: number;
  units: number;
  infraM: number;
  agLand: number;
  agImpact: string;
  scorecard?: Record<string, unknown>;
  allScenarios?: { id: string; name: string }[];
  [key: string]: unknown;
}

export function useStreamingChat() {
  const addMessage = useChatStore((s) => s.addMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const setStreamingText = useChatStore((s) => s.setStreamingText);
  const appendStreamingText = useChatStore((s) => s.appendStreamingText);
  const sessionId = useChatStore((s) => s.sessionId);
  const setSessionId = useChatStore((s) => s.setSessionId);

  const sendMessage = useCallback(
    async (message: string, context?: ScenarioContext) => {
      // Add user message to store
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        metadata: context
          ? {
              scenarioId: context.scenarioId,
              growthRate: context.growthRate,
              density: context.density,
            }
          : undefined,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMsg);

      // Start streaming
      setStreaming(true);
      setStreamingText('');

      try {
        const res = await fetch(apiStreamUrl('/ai/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message,
            scenarioContext: context || null,
          }),
        });

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let newSessionId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.sessionId) {
                newSessionId = parsed.sessionId;
              }
              if (parsed.delta) {
                fullText += parsed.delta;
                appendStreamingText(parsed.delta);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }

        // Finalize
        if (newSessionId && !sessionId) {
          setSessionId(newSessionId);
        }

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        addMessage(assistantMsg);
      } catch (err) {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Unable to connect to the AI service. Ensure the server is running and your API key is configured.',
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
      } finally {
        setStreaming(false);
        setStreamingText('');
      }
    },
    [sessionId, addMessage, setStreaming, setStreamingText, appendStreamingText, setSessionId]
  );

  return { sendMessage };
}
