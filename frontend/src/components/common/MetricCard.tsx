import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changePct?: number | null;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  changePct,
  changeLabel = 'vs yesterday',
  icon,
  highlight = false,
}) => {
  const isPositive = changePct !== undefined && changePct !== null && changePct > 0;
  const isNegative = changePct !== undefined && changePct !== null && changePct < 0;

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
        highlight
          ? 'bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white border-slate-700/80 shadow-md'
          : 'bg-white text-slate-900 border-slate-200/80 shadow-2xs hover:shadow-sm hover:border-slate-300'
      }`}
    >
      {/* Top subtle highlight accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-opacity ${
          highlight
            ? 'bg-gradient-to-r from-teal-500 to-emerald-400 opacity-100'
            : 'bg-teal-500 opacity-0 group-hover:opacity-100'
        }`}
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-3xs font-extrabold uppercase tracking-wider ${
            highlight ? 'text-teal-300/90' : 'text-slate-400'
          }`}
        >
          {title}
        </span>
        {icon && (
          <div
            className={`p-2 rounded-xl transition-transform group-hover:scale-105 ${
              highlight
                ? 'bg-white/10 text-emerald-300 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border border-slate-100'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div
          className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${
            highlight ? 'text-white' : 'text-slate-900'
          }`}
        >
          {value}
        </div>
        {subtitle && (
          <p
            className={`text-2xs sm:text-xs mt-1 font-medium truncate ${
              highlight ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {changePct !== undefined && changePct !== null && (
        <div className="mt-3 pt-2.5 border-t border-slate-100/50 flex items-center gap-1.5 text-xs font-medium">
          {isPositive ? (
            <span className="inline-flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-2xs">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />+{changePct}%
            </span>
          ) : isNegative ? (
            <span className="inline-flex items-center text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 text-2xs">
              <TrendingDown className="w-3.5 h-3.5 mr-1" />{changePct}%
            </span>
          ) : (
            <span className="inline-flex items-center text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-2xs">
              <Minus className="w-3 h-3 mr-1" />0%
            </span>
          )}
          <span className={`text-2xs ${highlight ? 'text-slate-400' : 'text-slate-400'}`}>
            {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
};