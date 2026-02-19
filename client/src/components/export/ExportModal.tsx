import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useScorecard } from '@/hooks/useScorecard';
import { useChatStore } from '@/stores/chatStore';
import { ReportGenerator } from '@/lib/pdfExport';

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const [includeMap, setIncludeMap] = useState(true);
  const [includeScorecard, setIncludeScorecard] = useState(true);
  const [includeRadar, setIncludeRadar] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [generating, setGenerating] = useState(false);

  const activeScenario = useScenarioStore((s) => s.activeScenario);
  const growthRate = useScenarioStore((s) => s.growthRate);
  const density = useScenarioStore((s) => s.density);
  const scorecard = useScorecard();
  const messages = useChatStore((s) => s.messages);

  // Get latest AI analysis
  const latestAI = messages.filter((m) => m.role === 'assistant').pop()?.content;

  async function handleExport() {
    if (!activeScenario) return;
    setGenerating(true);

    try {
      const generator = new ReportGenerator();
      const pdf = await generator.generate(
        {
          scenarioName: activeScenario.name,
          growthRate,
          density,
          scorecard,
          aiAnalysis: latestAI,
        },
        { includeMap, includeScorecard, includeRadar, includeAI }
      );

      pdf.save(`Fitchburg_${activeScenario.id}_Report.pdf`);
      onClose();
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <div
        className="w-[380px] rounded-xl p-6 space-y-5"
        style={{
          background: 'hsl(213 27% 15%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Export Report</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1f2d3d] text-[#8896a7] hover:text-[#e8edf3] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {!activeScenario ? (
          <p className="text-[11px] text-[#5a6a7d] italic">Select a scenario before exporting.</p>
        ) : (
          <>
            <div className="text-[11px] text-[#8896a7]">
              Exporting <span className="text-[#e8edf3] font-medium">{activeScenario.name}</span>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5">
              <ExportCheckbox label="Map capture" checked={includeMap} onChange={setIncludeMap} />
              <ExportCheckbox label="Scorecard analysis" checked={includeScorecard} onChange={setIncludeScorecard} disabled={!scorecard} />
              <ExportCheckbox label="Radar comparison chart" checked={includeRadar} onChange={setIncludeRadar} />
              <ExportCheckbox label="AI analysis" checked={includeAI} onChange={setIncludeAI} disabled={!latestAI} />
            </div>

            <button
              onClick={handleExport}
              disabled={generating}
              className="w-full py-2.5 rounded-lg bg-fb-teal text-[#0c1117] text-[12px] font-mono font-medium hover:bg-[#3ab8b0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate PDF'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ExportCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer ${disabled ? 'opacity-40' : ''}`}>
      <div
        className="w-4 h-4 rounded border flex items-center justify-center transition-all"
        style={{
          backgroundColor: checked ? '#4ecdc4' : 'transparent',
          borderColor: checked ? '#4ecdc4' : 'rgba(255,255,255,0.15)',
        }}
        onClick={() => !disabled && onChange(!checked)}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#0c1117" strokeWidth="2">
            <path d="M2 5L4 7L8 3" />
          </svg>
        )}
      </div>
      <span className="text-[11px] text-[#e8edf3]">{label}</span>
    </label>
  );
}
