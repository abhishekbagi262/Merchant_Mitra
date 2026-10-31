import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Users,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Percent,
  Layers,
  CheckCircle2,
  GitBranch,
} from 'lucide-react';
import { api } from '../api/client';
import { Campaign, Product } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { DemoBadge } from '../components/common/DemoBadge';

export const CampaignsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Draft modal state
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftForm, setDraftForm] = useState({
    name: 'Come Back & Save',
    objective: 'WIN_BACK_LAPSED',
    target_audience: 'LAPSED_CUSTOMERS',
    product_id: undefined as number | undefined,
    discount_type: 'PERCENT',
    discount_value: 10,
    duration_days: 7,
    budget: 250,
    language: language,
  });

  // Approval modal state
  const [approvalCampaign, setApprovalCampaign] = useState<Campaign | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cList, pList] = await Promise.all([
        api.getCampaigns(),
        api.getProducts(),
      ]);
      setCampaigns(cList);
      setProducts(pList);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [language]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await api.draftCampaign({
        ...draftForm,
        language,
      });
      setIsDraftModalOpen(false);
      // Immediately open approval screen for the merchant
      setApprovalCampaign(created);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to draft campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveOrReject = async (action: 'APPROVE' | 'REJECT') => {
    if (!approvalCampaign) return;
    try {
      setSubmitting(true);
      await api.approveCampaign(approvalCampaign.id, action);
      setApprovalCampaign(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateExecution = async (id: number) => {
    try {
      setSubmitting(true);
      await api.simulateCampaign(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.campaigns.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              10% Holdout Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{t.campaigns.subtitle}</p>
        </div>

        <button
          onClick={() => {
            setDraftForm({
              name: 'Come Back & Save',
              objective: 'WIN_BACK_LAPSED',
              target_audience: 'LAPSED_CUSTOMERS',
              product_id: undefined,
              discount_type: 'PERCENT',
              discount_value: 10,
              duration_days: 7,
              budget: 250,
              language,
            });
            setIsDraftModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-extrabold tracking-wide uppercase rounded-xl shadow-xs transition-all shrink-0 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.campaigns.createCampaign}</span>
        </button>
      </div>

      {/* Scientific Holdout Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-teal-500/20 text-teal-300 shadow-2xs shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Deterministic Holdout Architecture
              </h3>
              <span className="text-3xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                A/B Methodology
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-normal">
              Every campaign isolates approximately <strong>10%</strong> of eligible customers into a strict, uncontacted control group.
              Subsequent uplift scorecards compare actual treatment revenue against this natural baseline to calculate real ROI.
            </p>
          </div>
        </div>

        <Link
          to="/campaign-insights"
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 border border-white/10 active:scale-98"
        >
          <span>View Uplift Scorecards</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading merchant campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-2 p-12 bg-white rounded-2xl border border-slate-200/90 text-center text-xs text-slate-400 space-y-2">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No campaigns created yet</p>
            <p className="text-xs text-slate-400">Click "Draft New Campaign" to launch your first holdout experiment</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate">{camp.name}</h3>
                    <span className="text-3xs px-2 py-0.5 rounded-md uppercase font-extrabold bg-slate-100 text-slate-600 shrink-0">
                      {camp.objective.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span
                    className={`text-3xs px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                      camp.status === 'COMPLETED'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : camp.status === 'SIMULATED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : camp.status === 'APPROVED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : camp.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                {/* Offer message preview */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 text-xs text-slate-700 italic font-medium leading-relaxed">
                  "{camp.message}"
                </div>

                {/* Experiment split breakdown */}
                <div className="grid grid-cols-3 gap-2 text-2xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-600">
                  <div>
                    <span className="text-3xs text-slate-400 block font-extrabold uppercase">Total Audience</span>
                    <span className="font-black text-slate-900 text-xs tabular-nums">{camp.eligible_count}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-slate-400 block font-extrabold uppercase">Treatment (90%)</span>
                    <span className="font-black text-emerald-600 text-xs tabular-nums">{camp.treatment_count}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-slate-400 block font-extrabold uppercase">Holdout (10%)</span>
                    <span className="font-black text-slate-600 text-xs tabular-nums">{camp.holdout_count}</span>
                  </div>
                </div>

                <div className="text-3xs text-slate-500 flex items-center justify-between font-medium">
                  <span>Offer: {camp.discount_type} {camp.discount_value}{camp.discount_type === 'PERCENT' ? '%' : '₹'}</span>
                  <span className="font-bold text-slate-700">Max Liability: ₹{camp.estimated_maximum_discount_cost}</span>
                </div>
              </div>

              {/* Actions depending on status */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <DemoBadge label="SIMULATED" className="text-3xs" />

                <div className="flex items-center gap-2">
                  {camp.status === 'DRAFT' && (
                    <button
                      onClick={() => setApprovalCampaign(camp)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Review & Approve
                    </button>
                  )}

                  {camp.status === 'APPROVED' && (
                    <button
                      disabled={submitting}
                      onClick={() => handleSimulateExecution(camp.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t.campaigns.executeSimulation}</span>
                    </button>
                  )}

                  {(camp.status === 'SIMULATED' || camp.status === 'COMPLETED') && (
                    <Link
                      to="/campaign-insights"
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors"
                    >
                      <span>Uplift Scorecard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Draft Campaign Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">AI Campaign Generator</h3>
                  <p className="text-3xs text-slate-400 font-medium">Automatic 10% uncontacted holdout isolation</p>
                </div>
              </div>
              <button
                onClick={() => setIsDraftModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-3.5 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={draftForm.name}
                  onChange={(e) => setDraftForm({ ...draftForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Campaign Objective</label>
                  <select
                    value={draftForm.objective}
                    onChange={(e) => setDraftForm({ ...draftForm, objective: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="WIN_BACK_LAPSED">Win Back Inactive Customers</option>
                    <option value="REPEAT_PURCHASES">Increase Repeat Purchases</option>
                    <option value="CLEAR_SLOW_STOCK">Promote Slow-Moving Stock</option>
                    <option value="BOOST_AOV">Boost Average Bill Value</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Target Audience</label>
                  <select
                    value={draftForm.target_audience}
                    onChange={(e) => setDraftForm({ ...draftForm, target_audience: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="LAPSED_CUSTOMERS">Lapsed Frequent Regulars</option>
                    <option value="ALL">All Consented Customers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Discount Format</label>
                  <select
                    value={draftForm.discount_type}
                    onChange={(e) => setDraftForm({ ...draftForm, discount_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed Rupee (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={draftForm.discount_value}
                    onChange={(e) => setDraftForm({ ...draftForm, discount_value: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Max Budget Liability (₹)</label>
                  <input
                    type="number"
                    required
                    value={draftForm.budget}
                    onChange={(e) => setDraftForm({ ...draftForm, budget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Observation Period</label>
                  <input
                    type="number"
                    disabled
                    value={7}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Standard 7-Day Window</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-2xs leading-relaxed font-medium">
                <strong>Experiment Protocol:</strong> The system automatically isolates 10% of eligible consenting customers into an uncontacted holdout group.
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                >
                  Generate Experiment Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Approval Screen Modal (Section 18) */}
      {approvalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{t.campaigns.approvalTitle}</h3>
                <span className="text-3xs text-slate-400 font-mono block">
                  Campaign #{approvalCampaign.id} • {approvalCampaign.name}
                </span>
              </div>
              <button
                onClick={() => setApprovalCampaign(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-back confirmation note as specified in Section 18 */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
              <span className="font-extrabold text-3xs uppercase tracking-wider text-amber-900 block">
                Explicit Merchant Read-Back Confirmation:
              </span>
              <p className="font-medium text-amber-950">
                "You are approving a simulated campaign for{' '}
                <strong className="font-extrabold text-amber-900">{approvalCampaign.treatment_count} customers</strong>, with a maximum estimated discount cost of{' '}
                <strong className="font-extrabold text-amber-900">₹{approvalCampaign.estimated_maximum_discount_cost}</strong>.{' '}
                <strong className="font-extrabold text-amber-900">{approvalCampaign.holdout_count} customers</strong> will remain in the holdout group."
              </p>
            </div>

            {/* Message preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-3xs text-slate-400 uppercase font-extrabold block mb-1">
                Drafted Offer Message
              </span>
              <p className="text-slate-800 italic font-medium leading-relaxed">
                "{approvalCampaign.message}"
              </p>
            </div>

            {/* Margin check warning */}
            {approvalCampaign.margin_warning && !approvalCampaign.margin_warning.is_safe && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-2xs flex items-start gap-2.5 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{approvalCampaign.margin_warning.warning_message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                disabled={submitting}
                onClick={() => handleApproveOrReject('REJECT')}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
              >
                {t.campaigns.rejectBtn}
              </button>
              <button
                disabled={submitting}
                onClick={() => handleApproveOrReject('APPROVE')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                {t.campaigns.approveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};