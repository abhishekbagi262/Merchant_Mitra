import React from 'react';
import { Info } from 'lucide-react';

interface DemoBadgeProps {
  label?: string;
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  label = "DEMO SIMULATION — NO REAL MONEY",
  className = "",
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${className}`}
      title="This is a simulated demo environment. Real payment integrations, bank transfers, or external marketing messages are not executed."
    >
      <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
      <span>{label}</span>
    </span>
  );
};
