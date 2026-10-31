import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  Package,
  Users,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../api/client';
import { ComprehensiveAnalytics } from '../types/api';
import { MetricCard } from '../components/common/MetricCard';
import { DemoBadge } from '../components/common/DemoBadge';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading business analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Business Analytics & Profit Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Long-term revenue trends, category breakdown, customer retention, and slow-moving stock analysis.
          </p>
        </div>

        <DemoBadge />
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="All-Time Revenue"
          value={`₹${data.total_revenue_all_time}`}
          subtitle="Cumulative verified sales"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />

        <MetricCard
          title="All-Time Gross Profit"
          value={`₹${data.total_gross_profit_all_time}`}
          subtitle={`Margin: ${data.profit_margin_pct}%`}
          icon={<TrendingUp className="w-5 h-5 text-teal-600" />}
        />

        <MetricCard
          title="Repeat Customer Rate"
          value={`${data.customer_metrics.repeat_customer_rate}%`}
          subtitle={`${data.customer_metrics.repeat_customers} returning customers`}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />

        <MetricCard
          title="Average Customer Spend"
          value={`₹${data.customer_metrics.average_customer_spend}`}
          subtitle="Per registered customer"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Costing Methodology Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-900">Costing Method & Accounting Standard:</strong>{' '}
          {data.costing_method}. Gross Profit is calculated as Sum of (Selling Price − Unit Cost Snapshot) × Quantity − Relevant Discounts.
          Operating overheads (store rent, electricity, labor) are not currently deducted, so figures are accurately reported as <em>Estimated Gross Profit</em>.
        </div>
      </div>

      {/* 30-Day Sales & Profit Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              30-Day Revenue & Gross Profit Trajectory
            </h3>
            <p className="text-2xs text-slate-500">Historical daily revenue plotted against gross profit</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            30-Day Window
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.sales_trend_30_days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="anSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day_name" tick={{ fontSize: 9, fill: '#64748B' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `₹${val}`,
                  name === 'sales' ? 'Revenue' : 'Est. Profit',
                ]}
                contentStyle={{ backgroundColor: '#0B132B', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#anSales)" />
              <Area type="monotone" dataKey="profit" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#anProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Category Revenue & Slow Moving Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Category Revenue Contribution</h3>
              <p className="text-2xs text-slate-500">Sales share across Indian retail categories</p>
            </div>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {data.category_distribution.map((cat) => (
              <div key={cat.category} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-800">{cat.category}</span>
                  <span className="text-slate-900 font-bold">
                    ₹{cat.revenue} ({cat.percentage}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-teal-600 rounded-full"
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slow Moving Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Slow-Moving Products Alert</h3>
              <p className="text-2xs text-slate-500">Items with &le; 2 units sold in the last 30 days</p>
            </div>
            <Package className="w-4 h-4 text-amber-500" />
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {data.slow_moving_products.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                No slow-moving products detected. Inventory rotation is healthy.
              </div>
            ) : (
              data.slow_moving_products.map((sm) => (
                <div key={sm.product_id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">{sm.name}</span>
                    <span className="text-3xs text-slate-400">
                      Current stock: {sm.current_stock} units
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-2xs border border-amber-200">
                      {sm.units_sold_30_days} units in 30d
                    </span>
                    <span className="text-3xs text-slate-400 block mt-0.5">
                      Promote via Campaign
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
