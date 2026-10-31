import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  FastForward,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Users,
  IndianRupee,
  Layers,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  HelpCircle,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { Campaign, CampaignUplift } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { MetricCard } from '../components/common/MetricCard';

export const CampaignInsightsPage: React.FC = () => {
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [scorecard, setScorecard] = useState<CampaignUplift | null>(null);
  const [loading, setLoading] = useState(true);
  const [fastForwarding, setFastForwarding] = useState(false);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const list = await api.getCampaigns();
      setCampaigns(list);

      // Select first simulated or completed campaign
      const active = list.find((c) => c.status === 'COMPLETED' || c.status === 'SIMULATED') || list[0];
      if (active) {
        setSelectedCampaignId(active.id);
        const card = await api.getScorecard(active.id);
        setScorecard(card);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleSelectCampaign = async (id: number) => {
    setSelectedCampaignId(id);
    try {
      setLoading(true);
      const card = await api.getScorecard(id);
      setScorecard(card);
    } catch (err) {
      console.error('Failed to load scorecard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFastForward = async () => {
    if (!selectedCampaignId) return;
    try {
      setFastForwarding(true);
      const card = await api.fastForwardCampaign(selectedCampaignId, 7);
      setScorecard(card);
    } catch (err: any) {
      alert(err.message || 'Fast-forward failed');
    } finally {
      setFastForwarding(false);
    }
  };

  const comparisonData = scorecard
    ? [
        {
          name: 'Spend / Customer',
          Treatment: Number(scorecard.treatment_revenue_per_customer),
          Holdout: Number(scorecard.holdout_revenue_per_customer),
        },
      ]
    : [];

  // Percentage uplift over baseline
  const upliftPct =
    scorecard && Number(scorecard.holdout_revenue_per_customer) > 0
      ? (
          (Number(scorecard.incremental_revenue_per_customer) /
            Number(scorecard.holdout_revenue_per_customer)) *
          100
        ).toFixed(1)
      : '0.0';

  // Net cash profit after deducting campaign cost from incremental gross profit
  const netIncrementalProfit =
    scorecard && scorecard.incremental_gross_profit
      ? (
          Number(scorecard.incremental_gross_profit) - Number(scorecard.campaign_cost)
        ).toFixed(2)
      : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Presentation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.scorecard.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              10% Holdout Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Scientific A/B counterfactual measurement of true incremental customer spend
          </p>
        </div>

        {/* Campaign Selector & Fast Forward Action */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {campaigns.length > 0 && (
            <div className="relative">
              <select
                value={selectedCampaignId || ''}
                onChange={(e) => handleSelectCampaign(Number(e.target.value))}
                className="px-3.5 py-2 pr-8 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none cursor-pointer"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          )}

          <button
            onClick={handleFastForward}
            disabled={fastForwarding || !selectedCampaignId}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold tracking-wide uppercase rounded-xl shadow-xs transition-all disabled:opacity-50 hover:shadow-sm active:scale-98"
            title="Advance observation period by 7 days to calculate synthetic uplift results"
          >
            <FastForward className={`w-4 h-4 ${fastForwarding ? 'animate-spin' : ''}`} />
            <span>{t.scorecard.fastForwardBtn}</span>
          </button>
        </div>
      </div>

      {/* Prominent Mandatory Academic/Simulated Disclaimer Banner */}
      <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 text-amber-950 text-xs flex items-start gap-3.5 shadow-2xs">
        <div className="p-1 rounded-lg bg-amber-100 text-amber-700 mt-0.5 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-0.5">
          <strong className="font-extrabold tracking-wider uppercase text-3xs text-amber-900 block">
            {scorecard?.disclaimer || 'SIMULATED EXPERIMENT RESULTS — ILLUSTRATIVE, NOT ACTUAL MEASURED RESULTS'}
          </strong>
          <p className="text-2xs text-amber-900/90 leading-relaxed font-medium">
            This scorecard measures true incremental impact by comparing against a strictly isolated 10% uncontacted control group.
            It isolates genuine marketing causation from baseline merchant footfall.
          </p>
        </div>
      </div>

      {scorecard && (
        <>
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title={t.scorecard.revenueMultiple}
              value={`${scorecard.revenue_to_cost_ratio}x`}
              subtitle={`₹${scorecard.incremental_revenue} incremental / ₹${scorecard.campaign_cost} cost`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              highlight={true}
            />

            <MetricCard
              title={t.scorecard.incrementalRevenue}
              value={`₹${scorecard.incremental_revenue}`}
              subtitle={`+₹${scorecard.incremental_revenue_per_customer} extra / customer`}
              icon={<IndianRupee className="w-5 h-5 text-teal-600" />}
            />

            <MetricCard
              title={t.scorecard.profitROI}
              value={scorecard.is_profit_roi_available ? `+${scorecard.profit_roi_percentage}%` : 'N/A'}
              subtitle="Gross Profit Return on Discount Liability"
              icon={<Percent className="w-5 h-5 text-indigo-600" />}
            />

            <MetricCard
              title="Campaign Cost"
              value={`₹${scorecard.campaign_cost}`}
              subtitle={`Redeemed discount liability (${netIncrementalProfit ? `Net +₹${netIncrementalProfit}` : 'Budget capped'})`}
              icon={<Layers className="w-5 h-5 text-slate-600" />}
            />
          </div>

          {/* Side-by-Side Holdout A/B Experiment Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  A/B Experiment Cohort Comparison
                </h3>
                <p className="text-2xs text-slate-500 font-medium">
                  Direct empirical comparison over {scorecard.observation_period_days} days of observation
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Total Audience: {scorecard.treatment_customers + scorecard.holdout_customers} Customers
                </span>
              </div>
            </div>

            {/* Treatment vs Holdout Visual Split Cards */}
            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
              {/* Treatment Group Card (5 cols) */}
              <div className="md:col-span-5 bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 rounded-2xl border-2 border-emerald-200/80 p-5 space-y-4 relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs">
                    Treatment Group (90%)
                  </span>
                  <span className="text-2xs text-emerald-800 font-bold">
                    {scorecard.treatment_customers} Customers
                  </span>
                </div>

                <div>
                  <span className="text-3xs uppercase font-extrabold tracking-wider text-emerald-800 block">
                    Average Spend per Customer
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1 tabular-nums">
                    ₹{scorecard.treatment_revenue_per_customer}
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-2xs">
                  <div>
                    <span className="text-slate-500 block text-3xs font-semibold">Total Revenue</span>
                    <span className="font-extrabold text-emerald-900 tabular-nums">
                      ₹{scorecard.treatment_revenue}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-3xs font-semibold">Intervention</span>
                    <span className="font-extrabold text-emerald-700">Delivered Discount</span>
                  </div>
                </div>
              </div>

              {/* Center Delta Uplift Callout (1 col) */}
              <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md font-black text-xs">
                  VS
                </div>
                <div className="text-center mt-2 hidden md:block">
                  <span className="text-3xs font-extrabold text-emerald-600 block">+{upliftPct}%</span>
                  <span className="text-3xs text-slate-400">uplift</span>
                </div>
              </div>

              {/* Holdout Control Card (5 cols) */}
              <div className="md:col-span-5 bg-gradient-to-b from-slate-100/70 to-slate-50/30 rounded-2xl border-2 border-slate-200 p-5 space-y-4 relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-slate-700 text-white shadow-2xs">
                    Holdout Control (10%)
                  </span>
                  <span className="text-2xs text-slate-600 font-bold">
                    {scorecard.holdout_customers} Customers
                  </span>
                </div>

                <div>
                  <span className="text-3xs uppercase font-extrabold tracking-wider text-slate-500 block">
                    Natural Baseline Spend
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 tabular-nums">
                    ₹{scorecard.holdout_revenue_per_customer}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-2xs">
                  <div>
                    <span className="text-slate-500 block text-3xs font-semibold">Total Revenue</span>
                    <span className="font-extrabold text-slate-700 tabular-nums">
                      ₹{scorecard.holdout_revenue}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-3xs font-semibold">Intervention</span>
                    <span className="font-extrabold text-slate-600">Strictly Excluded</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Delta Highlight Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                  Δ
                </div>
                <div>
                  <span className="font-extrabold text-emerald-950 block">
                    Verified Incremental Uplift: +₹{scorecard.incremental_revenue_per_customer} per treated customer
                  </span>
                  <span className="text-2xs text-emerald-800 font-medium">
                    Treated customers spent ₹{scorecard.treatment_revenue_per_customer} vs ₹{scorecard.holdout_revenue_per_customer} natural baseline (+{upliftPct}% genuine uplift).
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-3xs font-bold uppercase tracking-wider text-emerald-700 block">
                  Net Incremental Revenue
                </span>
                <span className="font-black text-base text-emerald-950 tabular-nums">
                  +₹{scorecard.incremental_revenue}
                </span>
              </div>
            </div>
          </div>

          {/* Chart & Methodology Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chart: Treatment vs Holdout Spend (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Average Spend per Customer (₹)
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Comparing Treatment vs Uncontacted Holdout baseline
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  +{scorecard.incremental_revenue_per_customer}₹ / cust
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, '']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        border: '1px solid #334155',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="Treatment"
                      fill="#059669"
                      name={`Treatment Group (₹${scorecard.treatment_revenue_per_customer})`}
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="Holdout"
                      fill="#94A3B8"
                      name={`Holdout Control (₹${scorecard.holdout_revenue_per_customer})`}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 3-Step Scientific Holdout Workflow Visualizer */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-3xs uppercase font-extrabold tracking-wider text-slate-400 block">
                  3-Step Experimentation Pipeline
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-2xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <GitBranch className="w-3.5 h-3.5 text-teal-600" />
                      <span>1. Hash Partition</span>
                    </div>
                    <p className="text-3xs text-slate-500 leading-normal">
                      MD5 hash of customer ID splits audience: 10% holdout, 90% treatment.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Isolated Control</span>
                    </div>
                    <p className="text-3xs text-slate-500 leading-normal">
                      Holdout customers receive 0 messages to record organic baseline shopping.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>3. Uplift Delta</span>
                    </div>
                    <p className="text-3xs text-slate-500 leading-normal">
                      True uplift = Treatment revenue minus Holdout baseline spend.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation & Methodology Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* AI Uplift Interpretation */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    <h3 className="text-sm font-bold text-white">{t.scorecard.aiNotes}</h3>
                  </div>
                  <span className="text-3xs font-mono px-2 py-0.5 rounded bg-white/10 text-teal-300 font-semibold border border-white/10">
                    Observation: {scorecard.observation_period_days} Days
                  </span>
                </div>

                <div className="text-xs text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 font-normal">
                  {scorecard.ai_explanation}
                </div>

                <div className="flex items-center gap-2 text-3xs text-slate-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Calculated from verified SQLite transactions</span>
                </div>
              </div>

              {/* Scientific Formula Note */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Calculation Logic</span>
                </div>
                <p className="leading-relaxed text-2xs text-slate-500">
                  {scorecard.methodology_notes}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-3xs font-mono text-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Incremental Rev:</span>
                    <span className="font-bold text-slate-900">(Avg_T − Avg_H) × N_T</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Revenue Ratio:</span>
                    <span className="font-bold text-slate-900">Incremental Rev / Cost</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Profit ROI:</span>
                    <span className="font-bold text-slate-900">((Gross Profit − Cost) / Cost) × 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};