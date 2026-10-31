import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Volume2,
  Package,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../api/client';
import { DashboardKPIs, DailyBrief } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useMerchant } from '../context/MerchantContext';
import { MetricCard } from '../components/common/MetricCard';

export const OverviewPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { storeName, merchantName } = useMerchant();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingBrief, setRefreshingBrief] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpisData, briefData] = await Promise.all([
        api.getDashboard(),
        api.getBrief(language),
      ]);
      setKpis(kpisData);
      setBrief(briefData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBrief = async () => {
    try {
      setRefreshingBrief(true);
      const updatedBrief = await api.getBrief(language);
      setBrief(updatedBrief);
    } catch (err) {
      console.error('Failed to refresh brief:', err);
    } finally {
      setRefreshingBrief(false);
    }
  };

  const handleSpeakBrief = () => {
    if (!brief || !('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(brief.brief_narrative);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    loadData();
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-600">Loading business metrics from database...</p>
          <span className="text-3xs text-slate-400">Zero-hallucination real-time calculation</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.overview.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live DB Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {t.overview.subtitle.replace(/Ramesh General Stores|रमेश जनरल स्टोर्स|ರಮೇಶ್ ಜನರಲ್ ಸ್ಟೋರ್ಸ್/gi, storeName)}
          </p>
        </div>

        <Link
          to="/pos"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs sm:text-sm font-extrabold tracking-wide uppercase rounded-xl shadow-xs transition-all shrink-0 active:scale-98"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t.overview.quickPOS}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t.overview.todaySales}
          value={`₹${kpis.today_sales}`}
          changePct={kpis.sales_growth_pct}
          subtitle={`Yesterday: ₹${kpis.yesterday_sales}`}
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />

        <MetricCard
          title={t.overview.grossProfit}
          value={`₹${kpis.estimated_gross_profit}`}
          subtitle="Revenue − Snapshot COGS − Disc."
          icon={<TrendingUp className="w-5 h-5 text-teal-600" />}
        />

        <MetricCard
          title={t.overview.ordersToday}
          value={kpis.today_transactions_count}
          subtitle={`Avg Bill: ₹${kpis.average_bill_value}`}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
        />

        <MetricCard
          title={t.overview.totalCustomers}
          value={kpis.total_customers}
          subtitle="Registered merchant accounts"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Secondary Quick Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-3xs uppercase font-extrabold text-slate-400 tracking-wider block">
              {t.overview.bestSeller}
            </span>
            <div className="text-sm font-bold text-slate-900 truncate">
              {kpis.best_selling_product || 'No sales recorded'}
            </div>
            <span className="text-3xs text-emerald-700 font-semibold block mt-0.5">
              Highest units sold
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-3xs uppercase font-extrabold text-slate-400 tracking-wider block">
              {t.overview.peakHour}
            </span>
            <div className="text-sm font-bold text-slate-900 truncate">
              {kpis.peak_business_hour || 'No transactions yet'}
            </div>
            <span className="text-3xs text-blue-600 font-semibold block mt-0.5">
              Peak customer checkout volume
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-all">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-3xs uppercase font-extrabold text-slate-400 tracking-wider block">
              {t.overview.lowStockCount}
            </span>
            <div className="text-sm font-bold text-rose-600 truncate">
              {kpis.low_stock_count} products need reordering
            </div>
            <Link
              to="/products"
              className="text-3xs text-teal-600 hover:text-teal-700 font-bold block mt-0.5"
            >
              Review inventory stock →
            </Link>
          </div>
        </div>
      </div>

      {/* AI Daily Business Brief Box */}
      {brief && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 shadow-2xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>{t.overview.dailyBrief}</span>
                  <span className="text-3xs uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold border border-teal-500/30">
                    Live Database Facts
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Verified daily digest calculated strictly from confirmed ledger transactions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Voice Read-Aloud Button */}
              <button
                onClick={handleSpeakBrief}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isPlayingAudio
                    ? 'bg-teal-500 text-slate-950 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200'
                }`}
                title="Listen to your daily briefing hands-free"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isPlayingAudio ? 'Speaking...' : 'Listen'}</span>
              </button>

              {/* Refresh Brief */}
              <button
                onClick={handleRefreshBrief}
                disabled={refreshingBrief}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingBrief ? 'animate-spin' : ''}`} />
                <span>{t.overview.refreshBrief}</span>
              </button>
            </div>
          </div>

          {/* Brief Narrative */}
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 font-normal">
            {brief.brief_narrative}
          </div>

          {/* Actionable Recommendations */}
          {brief.actionable_recommendations.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-3xs uppercase font-extrabold text-teal-300 tracking-wider block mb-2.5">
                Actionable Recommendations
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {brief.actionable_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="truncate">{rec.title}</span>
                      <span
                        className={`text-3xs px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 ${
                          rec.priority === 'HIGH'
                            ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-slate-300 text-2xs leading-normal">{rec.action}</p>
                    <span className="text-3xs text-slate-400 block truncate font-mono">
                      {rec.supporting_data}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Sales Today */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {t.overview.hourlySalesChart}
              </h3>
              <p className="text-2xs text-slate-500 font-medium">Hourly billing throughput and volume</p>
            </div>
            <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Today (0-23 hrs)
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.hourly_sales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="hour_label" tick={{ fontSize: 10, fill: '#64748B' }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Sales']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#F8FAFC',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: '1px solid #334155',
                  }}
                />
                <Bar dataKey="sales" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Sales & Profit Performance */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {t.overview.weeklyTrendChart}
              </h3>
              <p className="text-2xs text-slate-500 font-medium">Daily gross revenue vs estimated gross profit</p>
            </div>
            <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Last 7 Days
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.weekly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day_name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `₹${val}`,
                    name === 'sales' ? 'Revenue' : 'Est. Profit',
                  ]}
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
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales Revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Gross Profit"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row: Top Products & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{t.overview.topProductsTitle}</h3>
              <p className="text-3xs text-slate-400">Ranked by aggregate volume</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-teal-600 hover:text-teal-700">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {kpis.top_products.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No orders recorded yet. Complete sales in POS to see best sellers.
              </div>
            ) : (
              kpis.top_products.map((item, idx) => (
                <div
                  key={item.product_id}
                  className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-2xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-slate-400 text-2xs font-medium">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block tabular-nums">
                      ₹{item.total_revenue}
                    </span>
                    <span className="text-slate-500 text-2xs font-medium">
                      {item.units_sold} units sold
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{t.overview.lowStockTitle}</h3>
              <p className="text-3xs text-slate-400">Inventory items near reorder limits</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-teal-600 hover:text-teal-700">
              Manage Stock →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {kpis.low_stock_alerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500" />
                <p className="font-bold text-slate-700">All products have healthy inventory</p>
                <p className="text-3xs text-slate-400">Stock levels are safely above reorder thresholds</p>
              </div>
            ) : (
              kpis.low_stock_alerts.map((item) => (
                <div
                  key={item.product_id}
                  className="p-3.5 sm:p-4 flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span
                        className={`text-3xs px-2 py-0.5 rounded-full font-black uppercase ${
                          item.status === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <span className="text-slate-400 text-3xs font-mono">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-600 block tabular-nums">
                      {item.current_stock} in stock
                    </span>
                    <span className="text-slate-400 text-3xs font-medium">
                      {item.days_left ? `~${item.days_left} days cover` : 'Below threshold'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};