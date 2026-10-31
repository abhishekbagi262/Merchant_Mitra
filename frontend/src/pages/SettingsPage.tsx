import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Shield,
  RotateCcw,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  Mic,
  Bell,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { AuditLog } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useMerchant } from '../context/MerchantContext';
import { DemoBadge } from '../components/common/DemoBadge';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const { merchant, updateSettings, refreshSettings } = useMerchant();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Full Form State
  const [form, setForm] = useState({
    name: merchant?.name || 'Ramesh',
    business_name: merchant?.business_name || 'Ramesh General Stores',
    location: merchant?.location || 'Bengaluru, KA',
    currency: merchant?.currency || 'INR',
    timezone: merchant?.timezone || 'Asia/Kolkata',
    // Voice Assistant Settings
    voice_enabled: merchant?.voice_enabled ?? true,
    auto_login_greeting: merchant?.auto_login_greeting ?? true,
    voice_responses: merchant?.voice_responses ?? true,
    preferred_speech_lang: merchant?.preferred_speech_lang || 'en-IN',
    // Notification Preferences
    notify_purchases: merchant?.notify_purchases ?? true,
    notify_low_stock: merchant?.notify_low_stock ?? true,
    notify_profit_decline: merchant?.notify_profit_decline ?? true,
    profit_decline_threshold_pct: merchant?.profit_decline_threshold_pct ?? 20.0,
  });

  // Sync state if context changes
  useEffect(() => {
    if (merchant) {
      setForm({
        name: merchant.name,
        business_name: merchant.business_name,
        location: merchant.location,
        currency: merchant.currency,
        timezone: merchant.timezone,
        voice_enabled: merchant.voice_enabled ?? true,
        auto_login_greeting: merchant.auto_login_greeting ?? true,
        voice_responses: merchant.voice_responses ?? true,
        preferred_speech_lang: merchant.preferred_speech_lang || 'en-IN',
        notify_purchases: merchant.notify_purchases ?? true,
        notify_low_stock: merchant.notify_low_stock ?? true,
        notify_profit_decline: merchant.notify_profit_decline ?? true,
        profit_decline_threshold_pct: merchant.profit_decline_threshold_pct ?? 20.0,
      });
    }
  }, [merchant]);

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      setResetting(true);
      await api.resetDemoData();
      setIsResetDialogOpen(false);
      await refreshSettings();
      await loadAuditLogs();
      alert('Demo data successfully reseeded with 27 products, 42 customers, and 146 orders.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Store Settings & Audit System</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure merchant profile details, customize Mitra voice assistant, manage notification preferences, and inspect append-only audit trail.
          </p>
        </div>

        <DemoBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* 1. Merchant Identity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Merchant Store Identity</h3>
                </div>
                {saveSuccess && (
                  <span className="text-2xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Settings Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Merchant Owner Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Ramesh"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Syncs across Header, Assistant, and Soundbox</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Business / Store Name</label>
                  <input
                    type="text"
                    required
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Ramesh General Stores"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Printed on QR and Daily Brief</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Store Location</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. Jayanagar 4th Block, Bengaluru, KA"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Currency</label>
                  <input
                    type="text"
                    disabled
                    value={form.currency}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Timezone</label>
                  <input
                    type="text"
                    disabled
                    value={form.timezone}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Mitra Voice Assistant Settings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Mitra Voice Assistant</h3>
                    <p className="text-3xs text-slate-400">Hands-free POS and conversational store controls</p>
                  </div>
                </div>
                <span className="text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Web Speech API
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Voice enabled toggle */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.voice_enabled}
                    onChange={(e) => setForm({ ...form, voice_enabled: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Enable Mitra Voice Assistant</div>
                    <p className="text-2xs text-slate-500">
                      Activates the floating microphone widget for voice actions (search product, add to POS cart, check stock).
                    </p>
                  </div>
                </label>

                {/* Hands-free login briefing */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.auto_login_greeting}
                    onChange={(e) => setForm({ ...form, auto_login_greeting: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Hands-Free Morning Business Greeting</div>
                    <p className="text-2xs text-slate-500">
                      Mitra will automatically speak a friendly verbal briefing when opening the store overview.
                    </p>
                  </div>
                </label>

                {/* Voice speech synthesis language */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <label className="font-bold text-slate-900 block">Preferred Speech Recognition & Voice Language</label>
                  <select
                    value={form.preferred_speech_lang}
                    onChange={(e) => setForm({ ...form, preferred_speech_lang: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="en-IN">English (India) — en-IN</option>
                    <option value="hi-IN">हिन्दी (Hindi) — hi-IN</option>
                    <option value="kn-IN">ಕನ್ನಡ (Kannada) — kn-IN</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Notification Center Preferences */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Notification Center Preferences</h3>
                    <p className="text-3xs text-slate-400">Control event triggers and threshold sensitivity</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Purchase Notifications */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.notify_purchases}
                    onChange={(e) => setForm({ ...form, notify_purchases: e.target.checked })}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Customer Purchase Notifications</div>
                    <p className="text-2xs text-slate-500">
                      Emit instant notifications upon every confirmed customer payment with line items and amount.
                    </p>
                  </div>
                </label>

                {/* Stock Alerts */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.notify_low_stock}
                    onChange={(e) => setForm({ ...form, notify_low_stock: e.target.checked })}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Low & Critical Stock Alerts</div>
                    <p className="text-2xs text-slate-500">
                      Alert immediately when product units breach reorder thresholds or reach zero inventory.
                    </p>
                  </div>
                </label>

                {/* Profit Decline */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.notify_profit_decline}
                      onChange={(e) => setForm({ ...form, notify_profit_decline: e.target.checked })}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Gross Profit Decline Warning</div>
                      <p className="text-2xs text-slate-500">
                        Detect sharp margin or profit contractions comparing today's velocity to yesterday.
                      </p>
                    </div>
                  </label>

                  {form.notify_profit_decline && (
                    <div className="pt-2 pl-7 flex items-center gap-3">
                      <label className="text-2xs font-semibold text-slate-600">Sensitivity Threshold (%):</label>
                      <input
                        type="number"
                        min="5"
                        max="80"
                        step="1"
                        value={form.profit_decline_threshold_pct}
                        onChange={(e) => setForm({ ...form, profit_decline_threshold_pct: parseFloat(e.target.value) || 20 })}
                        className="w-20 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                      <span className="text-3xs text-slate-400">Default: 20% decline</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save All Preferences'}</span>
              </button>
            </div>
          </form>

          {/* Danger Zone: Reset Demo Data */}
          <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Demo Data Reset Zone</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-2xs">
              Reset the database back to clean synthetic seed state ({merchant?.business_name || 'Ramesh General Stores'}, 27 products, 42 customers, and 146 historical orders).
            </p>
            <button
              onClick={() => setIsResetDialogOpen(true)}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetting ? 'Resetting Data...' : 'Reset Demo Database'}</span>
            </button>
          </div>
        </div>

        {/* Right: Append-Only Audit Log Viewer (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Append-Only Audit Log</h3>
                <p className="text-3xs text-slate-400">
                  Immutable record of payments, campaigns, stock adjustments, and profile updates
                </p>
              </div>
            </div>
            <span className="text-3xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {auditLogs.length} events
            </span>
          </div>

          <div className="max-h-[680px] overflow-y-auto divide-y divide-slate-100 text-xs pr-1">
            {loadingLogs ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No audit events recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="font-bold text-slate-900 font-mono">
                      {log.action}
                    </span>
                    <span className="text-slate-400 text-3xs">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700 text-2xs leading-snug">{log.description}</p>
                  <div className="flex items-center gap-2 text-3xs text-slate-400">
                    <span>Actor: {log.actor}</span>
                    <span>•</span>
                    <span>Entity: {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isResetDialogOpen}
        title="Reset Demo Database"
        message="Are you sure you want to restore pristine demo data? All newly created transactions and orders will be reset to the original 146 historical demo records."
        confirmLabel="Reset Everything"
        isDestructive={true}
        onConfirm={handleResetDemoData}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
};
