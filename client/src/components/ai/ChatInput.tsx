import { useState, useCallback } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useMetrics } from '@/hooks/useMetrics';
import { useStreamingChat } from '@/hooks/useStreamingChat';

const QUICK_ACTIONS_WITH_SCENARIO = [
  'Analyze this scenario',
  'Infrastructure risks?',
  'Compare scenarios',
  'What would CARPC say?',
];

const QUICK_ACTIONS_NO_SCENARIO = [
  'Help me choose a scenario',
  'What factors matter most?',
];

export function ChatInput() {
  const [input, setInput] = useState('');
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const growthRate = useScenarioStore((s) => s.growthRate);
  const density = useScenarioStore((s) => s.density);
  const metrics = useMetrics();
  const { sendMessage } = useStreamingChat();

  const quickActions = activeScenario ? QUICK_ACTIONS_WITH_SCENARIO : QUICK_ACTIONS_NO_SCENARIO;

  const buildContext = useCallback(() => {
    if (!activeScenario || !metrics) return undefined;
    return {
      scenarioId: activeScenario.id,
      scenarioName: activeScenario.name,
      description: activeScenario.description,
      growthRate,
      density,
      acres: metrics.acres,
      units: metrics.units,
      infraM: metrics.infraM,
      agLand: metrics.agLand,
      agImpact: activeScenario.agImpact,
    };
  }, [activeScenario, growthRate, density, metrics]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming) return;
      sendMessage(text.trim(), buildContext());
      setInput('');
    },
    [isStreaming, sendMessage, buildContext]
  );

  return (
    <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => handleSend(action)}
            disabled={isStreaming}
            className="text-[10px] font-mono py-1.5 px-3 rounded-md border border-[rgba(255,255,255,0.06)] bg-[#151c25] text-[#8896a7] hover:border-[rgba(255,255,255,0.15)] hover:text-[#e8edf3] transition-all duration-200 disabled:opacity-40"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
          placeholder="Ask about this scenario..."
          disabled={isStreaming}
          className="flex-1 bg-[#151c25] border border-[rgba(255,255,255,0.06)] rounded-lg py-2 px-4 text-xs text-[#e8edf3] placeholder:text-[#5a6a7d] outline-none focus:border-[rgba(255,255,255,0.15)] transition-colors disabled:opacity-50"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 rounded-lg border border-fb-teal text-fb-teal text-[11px] font-mono hover:bg-[#4ecdc4]/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isStreaming ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
