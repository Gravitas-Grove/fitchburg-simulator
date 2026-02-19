import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { ExportModal } from './ExportModal';

export function ExportButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#1f2d3d] text-[#8896a7] hover:text-[#e8edf3] transition-all duration-200"
        title="Export PDF report"
      >
        <FileDown size={14} />
      </button>
      {showModal && <ExportModal onClose={() => setShowModal(false)} />}
    </>
  );
}
