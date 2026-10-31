import {
  Product,
  CartItem,
  CartDiscount,
  CartValidation,
  OrderResponse,
  DemoQRPaymentResponse,
  PaymentSimulationResponse,
  Transaction,
  TransactionDetail,
  Customer,
  CustomerDetail,
  LapsedCustomer,
  LoyaltyEligibleCustomer,
  Coupon,
  Campaign,
  CampaignUplift,
  DashboardKPIs,
  DailyBrief,
  AssistantQueryResponse,
  AuditLog,
  MerchantSettings,
  ComprehensiveAnalytics,
  NotificationItem,
  NotificationListResponse,
} from '../types/api';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorDetail = 'API Request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: () => request<DashboardKPIs>('/dashboard'),

  // Products & Inventory
  getProducts: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<Product[]>(`/products${qs}`);
  },
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  adjustStock: (id: number, quantityChange: number, reason: string) =>
    request<Product>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity_change: quantityChange, reason }),
    }),

  // Orders & POS
  validateCart: (items: CartItem[], discount?: CartDiscount) =>
    request<CartValidation>('/orders/validate-cart', {
      method: 'POST',
      body: JSON.stringify({ items, discount }),
    }),
  createOrder: (data: { items: CartItem[]; discount?: CartDiscount; customer_id?: number | null }) =>
    request<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrder: (id: number) => request<OrderResponse>(`/orders/${id}`),

  // Payments & Demo UPI
  generateDemoQR: (orderId: number) =>
    request<DemoQRPaymentResponse>('/payments/generate-qr', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    }),
  simulatePayment: (orderId: number, transactionRef: string, action: 'SUCCESS' | 'FAILED' | 'CANCELLED') =>
    request<PaymentSimulationResponse>('/payments/simulate', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        transaction_reference: transactionRef,
        action,
      }),
    }),

  // Transactions
  getTransactions: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<Transaction[]>(`/transactions${qs}`);
  },
  getTransaction: (id: number) => request<TransactionDetail>(`/transactions/${id}`),

  // Customers & Loyalty
  getCustomers: (params?: { segment?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.segment) q.append('segment', params.segment);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<Customer[]>(`/customers${qs}`);
  },
  getCustomer: (id: number) => request<CustomerDetail>(`/customers/${id}`),
  createCustomer: (data: { display_name: string; phone?: string; marketing_consent: boolean }) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getLapsedCustomers: () => request<LapsedCustomer[]>('/customers/lapsed'),
  getLoyaltyEligibleCustomers: () => request<LoyaltyEligibleCustomer[]>('/customers/loyalty-eligible'),
  issueLoyaltyReward: (data: { customer_id: number; discount_type: string; discount_value: number; validity_days: number }) =>
    request<Coupon>('/customers/issue-reward', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Campaigns & Uplift
  getCampaigns: () => request<Campaign[]>('/campaigns'),
  draftCampaign: (data: any) =>
    request<Campaign>('/campaigns/draft', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveCampaign: (id: number, action: 'APPROVE' | 'REJECT') =>
    request<Campaign>(`/campaigns/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
  simulateCampaign: (id: number) =>
    request<Campaign>(`/campaigns/${id}/simulate`, {
      method: 'POST',
    }),
  fastForwardCampaign: (id: number, observationDays: number = 7) =>
    request<CampaignUplift>(`/campaigns/${id}/fast-forward`, {
      method: 'POST',
      body: JSON.stringify({ observation_days: observationDays }),
    }),
  getScorecard: (id: number) => request<CampaignUplift>(`/campaigns/${id}/scorecard`),

  // Business Analytics
  getAnalytics: () => request<ComprehensiveAnalytics>('/analytics'),

  // AI Daily Brief
  getBrief: (language: string = 'en') => request<DailyBrief>(`/brief?language=${language}`),

  // Ask Mitra AI Assistant
  askMitra: (message: string, language: string = 'en') =>
    request<AssistantQueryResponse>('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ message, language }),
    }),

  // Audit Logs
  getAuditLogs: (action?: string) => {
    const qs = action ? `?action=${action}` : '';
    return request<AuditLog[]>(`/audit-logs${qs}`);
  },

  // Settings
  getSettings: () => request<MerchantSettings>('/settings'),
  updateSettings: (data: Partial<MerchantSettings>) =>
    request<MerchantSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetDemoData: () =>
    request<{ message: string }>('/settings/reset-demo-data', {
      method: 'POST',
    }),
  // Notifications
  getNotifications: (params?: { limit?: number; unread_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.unread_only) q.append('unread_only', 'true');
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<NotificationListResponse>(`/notifications${qs}`);
  },
  markNotificationRead: (id: number) =>
    request<{ message: string; id: number }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request<{ message: string; marked_count: number }>('/notifications/read-all', {
      method: 'PUT',
    }),
};
