import React, { useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  PackageCheck,
  Calendar,
} from 'lucide-react';
import { api } from '../api/client';
import { Transaction, TransactionDetail } from '../types/api';
import { DemoBadge } from '../components/common/DemoBadge';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<TransactionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions(statusFilter === 'ALL' ? undefined : statusFilter);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const viewDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const detail = await api.getTransaction(id);
      setSelectedTxn(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load transaction detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (t.order_number && t.order_number.toLowerCase().includes(s)) ||
      t.transaction_reference.toLowerCase().includes(s) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Transaction History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all customer UPI QR payments, timestamps, and inventory allocations.
          </p>
        </div>

        <DemoBadge />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order #, Ref, or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-3xs">
              <tr>
                <th className="py-3 px-4">Txn Ref / Date</th>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700 block truncate max-w-[140px]">
                        {t.transaction_reference}
                      </span>
                      <span className="text-3xs text-slate-400">
                        {new Date(t.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{t.order_number}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {t.customer_name || <span className="text-slate-400 italic">Walk-in</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.item_count || 1} items</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">₹{t.amount}</td>
                    <td className="py-3 px-4">
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {t.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-3xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          t.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                        {t.status === 'FAILED' && <XCircle className="w-3 h-3" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-3xs font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Simulated
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => viewDetail(t.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Transaction Detail — {selectedTxn.order_number}
                </h3>
                <span className="text-3xs text-slate-400 font-mono block">
                  Ref: {selectedTxn.transaction_reference}
                </span>
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status and Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-3xs text-slate-400 block font-bold uppercase">Customer</span>
                <span className="font-semibold text-slate-800">
                  {selectedTxn.customer_name || 'Walk-in'}
                </span>
              </div>
              <div>
                <span className="text-3xs text-slate-400 block font-bold uppercase">Status</span>
                <span
                  className={`font-bold ${
                    selectedTxn.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {selectedTxn.status}
                </span>
              </div>
              <div>
                <span className="text-3xs text-slate-400 block font-bold uppercase">Paid Amount</span>
                <span className="text-sm font-extrabold text-slate-900">
                  ₹{selectedTxn.amount}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <span className="text-2xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
                Order Items & Snapshot Margin
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-3xs font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Price</th>
                      <th className="py-2 px-3">Snapshot COGS</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedTxn.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {it.product_name}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{it.quantity}</td>
                        <td className="py-2 px-3 text-slate-600">₹{it.unit_price}</td>
                        <td className="py-2 px-3 text-slate-400">₹{it.unit_cost_snapshot}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ₹{it.line_total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory Movements Recorded */}
            {selectedTxn.inventory_movements.length > 0 && (
              <div>
                <span className="text-2xs font-bold uppercase text-slate-400 tracking-wider block mb-2 flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                  Inventory Audit Movements
                </span>
                <div className="space-y-1.5">
                  {selectedTxn.inventory_movements.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-2xs"
                    >
                      <span className="font-semibold text-emerald-900">
                        {m.product_name}
                      </span>
                      <span className="font-mono text-emerald-800">
                        Stock: {m.previous_stock} → {m.new_stock} ({m.quantity_change})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
