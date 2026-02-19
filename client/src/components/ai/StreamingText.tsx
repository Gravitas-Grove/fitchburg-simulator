import { highlightMetrics } from '@/lib/formatters';

interface StreamingTextProps {
  text: string;
}

export function StreamingText({ text }: StreamingTextProps) {
  const paragraphs = text.split('\n\n').filter((p) => p.trim());

  return (
    <div className="space-y-2.5">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-xs leading-relaxed text-[#8896a7] [&_strong]:text-[#e8edf3]"
          dangerouslySetInnerHTML={{
            __html:
              highlightMetrics(p) +
              (i === paragraphs.length - 1 ? '<span class="typing-cursor"></span>' : ''),
          }}
        />
      ))}
    </div>
  );
}
