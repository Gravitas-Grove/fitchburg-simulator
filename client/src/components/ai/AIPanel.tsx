import { useRef, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useScenarioStore } from '@/stores/scenarioStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { StreamingText } from './StreamingText';

export function AIPanel() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingText = useChatStore((s) => s.streamingText);
  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#8896a7] tracking-[1.5px] uppercase">
          <div className="w-2 h-2 rounded-full bg-fb-teal animate-pulse" />
          AI Planning Assistant
        </div>
      </div>

      {/* Messages */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-[#5a6a7d] italic text-[11px] leading-relaxed text-center px-3 py-5">
            {activeScenario
              ? `${activeScenario.name} selected. Ask a question or use a quick action below.`
              : 'Select a growth model, then ask questions about infrastructure costs, agricultural impact, and community tradeoffs.'}
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isStreaming && streamingText && (
          <div className="text-xs leading-relaxed text-[#8896a7]">
            <StreamingText text={streamingText} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
