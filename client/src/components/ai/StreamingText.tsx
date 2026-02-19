import { renderAIMarkdown } from '@/lib/formatters';

interface StreamingTextProps {
  text: string;
}

export function StreamingText({ text }: StreamingTextProps) {
  return (
    <div
      className="ai-response text-xs leading-relaxed text-[#8896a7] [&_strong]:text-[#e8edf3] space-y-2"
      dangerouslySetInnerHTML={{
        __html: renderAIMarkdown(text) + '<span class="typing-cursor"></span>',
      }}
    />
  );
}
