import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Gift,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  X,
  Phone,
  CheckCircle,
  Tag,
} from 'lucide-react';
import { api } from '../api/client';
import {
  Customer,
  CustomerDetail,
  LapsedCustomer,
  LoyaltyEligibleCustomer,
  Coupon,
} from '../types/api';
import { DemoBadge } from '../components/common/DemoBadge';

export const CustomersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'LAPSED' | 'LOYALTY'>('ALL');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lapsedCustomers, setLapsedCustomers] = useState<LapsedCustomer[]>([]);
  const [loyaltyEligible, setLoyaltyEligible] = useState<LoyaltyEligibleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('ALL');

  // Drawer / Modal states
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Issue Reward modal state
  const [rewardCustomer, setRewardCustomer] = useState<LoyaltyEligibleCustomer | null>(null);
  const [rewardData, setRewardData] = useState({
    discount_type: 'FIXED',
    discount_value: 50,
    validity_days: 30,
  });
  const [issuedCoupon, setIssuedCoupon] = useState<Coupon | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCusts, lapsed, loyalty] = await Promise.all([
        api.getCustomers(),
        api.getLapsedCustomers(),
        api.getLoyaltyEligibleCustomers(),
      ]);
      setCustomers(allCusts);
      setLapsedCustomers(lapsed);
      setLoyaltyEligible(loyalty);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCustomerDetail = async (id: number) => {
    try {
      setSelectedCustomerId(id);
      setLoadingDetail(true);
      const detail = await api.getCustomer(id);
      setCustomerDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load customer profile');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleIssueReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardCustomer) return;
    try {
      const coupon = await api.issueLoyaltyReward({
        customer_id: rewardCustomer.customer_id,
        discount_type: rewardData.discount_type,
        discount_value: rewardData.discount_value,
        validity_days: rewardData.validity_days,
      });
      setIssuedCoupon(coupon);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to issue reward');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSegment = segmentFilter === 'ALL' || c.segment === segmentFilter;
    const matchSearch =
      !search ||
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));
    return matchSegment && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Intelligence & Loyalty
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer spend, discover lapsed regulars, and approve automated loyalty coupons.
          </p>
        </div>

        <DemoBadge />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'ALL'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Customers ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LAPSED')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'LAPSED'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Lapsed Regulars ({lapsedCustomers.length})</span>
          {lapsedCustomers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('LOYALTY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'LOYALTY'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4 text-emerald-600" />
          <span>Loyalty Rewards ({loyaltyEligible.filter((l) => l.eligible).length} Eligible)</span>
        </button>
      </div>

      {/* TAB 1: ALL CUSTOMERS */}
      {activeTab === 'ALL' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Segments</option>
                <option value="NEW">New Customers</option>
                <option value="REGULAR">Regular Customers</option>
                <option value="LAPSED">Lapsed (&gt;30d Inactive)</option>
                <option value="HIGH_VALUE">High Value (₹1,500+ Spend)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-3xs">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Segment</th>
                    <th className="py-3 px-4">Total Visits</th>
                    <th className="py-3 px-4">Total Spend</th>
                    <th className="py-3 px-4">Avg Bill</th>
                    <th className="py-3 px-4">Consent</th>
                    <th className="py-3 px-4 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.display_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            c.segment === 'HIGH_VALUE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : c.segment === 'LAPSED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : c.segment === 'REGULAR'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.segment}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c.total_orders} visits</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{c.total_spend}</td>
                      <td className="py-3 px-4 text-slate-600">₹{c.average_bill_value}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-3xs font-semibold ${
                            c.marketing_consent ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {c.marketing_consent ? 'Opted-In' : 'No Consent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openCustomerDetail(c.id)}
                          className="p-1 text-slate-400 hover:text-teal-600 hover:bg-slate-100 rounded"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPSED CUSTOMER FINDER */}
      {activeTab === 'LAPSED' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-950">Lapsed Frequent Regulars</h4>
              <p className="mt-0.5 leading-relaxed">
                These customers have made at least 3 historical purchases but have not visited in the last 30 days.
                Every recommendation below provides verifiable purchase history and favorite items.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lapsedCustomers.map((lc) => (
              <div
                key={lc.customer_id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{lc.display_name}</h3>
                    <span className="text-3xs text-slate-400">{lc.phone || 'No phone'}</span>
                  </div>
                  <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    {lc.days_inactive} Days Inactive
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-2xs bg-slate-50 p-2.5 rounded-lg text-slate-600">
                  <div>
                    <span className="text-3xs text-slate-400 block font-semibold uppercase">Visits</span>
                    <span className="font-bold text-slate-800">{lc.previous_purchase_count}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-slate-400 block font-semibold uppercase">Total Spent</span>
                    <span className="font-bold text-slate-800">₹{lc.total_spend}</span>
                  </div>
                  <div>
                    <span className="text-3xs text-slate-400 block font-semibold uppercase">Avg Bill</span>
                    <span className="font-bold text-slate-800">₹{lc.average_spend}</span>
                  </div>
                </div>

                {/* Evidence Note */}
                <div className="p-3 rounded-lg bg-teal-50/40 border border-teal-100 text-xs text-slate-700 leading-snug">
                  <span className="text-3xs uppercase font-bold text-teal-800 block mb-1">
                    Verified Recommendation Evidence
                  </span>
                  {lc.reason_for_recommendation}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-3xs text-slate-400">
                    Favorites:{' '}
                    <strong className="text-slate-700 font-semibold">
                      {lc.favorite_products.join(', ') || 'Groceries'}
                    </strong>
                  </div>
                  <button
                    onClick={() => openCustomerDetail(lc.customer_id)}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    View History →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOYALTY REWARDS */}
      {activeTab === 'LOYALTY' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
            <Gift className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">Loyalty Rewards Policy (₹500 Threshold)</h4>
              <p className="mt-0.5 leading-relaxed">
                Merchants can review high-spending loyal customers (cumulative successful purchases &gt;= ₹500)
                and approve a demo coupon with a unique redemption code and expiration date.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-3xs">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Total Purchases</th>
                    <th className="py-3 px-4">Cumulative Spend</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loyaltyEligible.map((item) => (
                    <tr key={item.customer_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.display_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.phone || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">{item.total_visits} orders</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600">
                        ₹{item.cumulative_spend}
                      </td>
                      <td className="py-3 px-4 text-slate-400">₹{item.threshold}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.already_rewarded
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.already_rewarded ? 'Coupon Active' : 'Eligible for Reward'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.eligible ? (
                          <button
                            onClick={() => {
                              setRewardCustomer(item);
                              setIssuedCoupon(null);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-2xs font-bold transition-colors shadow-xs"
                          >
                            Approve Reward
                          </button>
                        ) : (
                          <span className="text-slate-400 text-2xs italic">Rewarded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Detail Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Customer Profile</h3>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail || !customerDetail ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading profile...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <h4 className="text-base font-extrabold text-slate-900">
                    {customerDetail.display_name}
                  </h4>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    {customerDetail.phone || 'No phone recorded'}
                  </span>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-3xs px-2 py-0.5 rounded-full font-bold uppercase bg-teal-100 text-teal-800">
                      Segment: {customerDetail.segment}
                    </span>
                    <span className="text-3xs px-2 py-0.5 rounded-full font-semibold bg-slate-200 text-slate-700">
                      {customerDetail.marketing_consent ? 'Marketing Consented' : 'No Consent'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-3xs text-slate-400 uppercase font-bold block">
                      Total Spend
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      ₹{customerDetail.total_spend}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-3xs text-slate-400 uppercase font-bold block">
                      Total Orders
                    </span>
                    <span className="text-lg font-extrabold text-slate-900">
                      {customerDetail.total_orders}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-2xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
                    Favorite Products Purchased
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {customerDetail.favorite_products.map((fp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-2xs"
                      >
                        {fp}
                      </span>
                    ))}
                  </div>
                </div>

                {customerDetail.active_coupons.length > 0 && (
                  <div>
                    <span className="text-2xs font-bold uppercase text-slate-400 tracking-wider block mb-2">
                      Active Coupons
                    </span>
                    <div className="space-y-1.5">
                      {customerDetail.active_coupons.map((code, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs flex items-center justify-between"
                        >
                          <span>{code}</span>
                          <span className="text-2xs font-sans uppercase font-bold">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issue Loyalty Reward Modal */}
      {rewardCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Loyalty Reward</h3>
                <p className="text-2xs text-slate-500">
                  Recipient: {rewardCustomer.display_name} (₹{rewardCustomer.cumulative_spend} cumulative spend)
                </p>
              </div>
              <button
                onClick={() => setRewardCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {issuedCoupon ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Demo Loyalty Coupon Issued!</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 font-mono text-base font-extrabold text-teal-700">
                  {issuedCoupon.coupon_code}
                </div>
                <p className="text-2xs text-slate-500">
                  Discount: {issuedCoupon.discount_type} ₹{issuedCoupon.discount_value} • Valid until{' '}
                  {new Date(issuedCoupon.expiry_date).toLocaleDateString()}
                </p>
                <button
                  onClick={() => setRewardCustomer(null)}
                  className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleIssueReward} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Discount Type</label>
                    <select
                      value={rewardData.discount_type}
                      onChange={(e) => setRewardData({ ...rewardData, discount_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="FIXED">Fixed Rupee (₹)</option>
                      <option value="PERCENT">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={rewardData.discount_value}
                      onChange={(e) => setRewardData({ ...rewardData, discount_value: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="90"
                    value={rewardData.validity_days}
                    onChange={(e) => setRewardData({ ...rewardData, validity_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="p-3 rounded-lg bg-amber-50 text-amber-900 text-2xs leading-relaxed border border-amber-200">
                  <strong>Merchant Confirmation:</strong> Approving this loyalty reward generates a unique demo coupon code credited to this customer's account.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRewardCustomer(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Approve & Issue Coupon
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
