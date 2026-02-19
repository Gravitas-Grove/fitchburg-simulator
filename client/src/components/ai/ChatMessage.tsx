import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { renderAIMarkdown } from '@/lib/formatters';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-[#4ecdc4]/10 border border-[#4ecdc4]/20 rounded-lg px-3.5 py-2.5 max-w-[85%]">
          <p className="text-xs text-[#e8edf3] leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="text-center">
        <span className="text-[10px] font-mono text-[#5a6a7d] bg-[#151c25] px-2 py-0.5 rounded">
          {message.content}
        </span>
      </div>
    );
  }

  // Assistant — render with full markdown support
  return (
    <div
      className="ai-response text-xs leading-relaxed text-[#8896a7] [&_strong]:text-[#e8edf3] space-y-2"
      dangerouslySetInnerHTML={{ __html: renderAIMarkdown(message.content) }}
    />
  );
}
