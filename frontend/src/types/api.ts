export interface Product {
  id: number;
  merchant_id: number;
  sku: string;
  name: string;
  category: string;
  description?: string;
  cost_price: number | string;
  selling_price: number | string;
  current_stock: number;
  reorder_threshold: number;
  supplier?: string;
  created_at: string;
  updated_at: string;
  days_of_stock?: number | null;
  stock_status: 'CRITICAL' | 'LOW' | 'HEALTHY';
}

export interface StockCover {
  product_id: number;
  product_name: string;
  current_stock: number;
  avg_daily_sales: number;
  days_left: number | null;
  status: 'CRITICAL' | 'LOW' | 'HEALTHY';
  recommendation: string;
}

export interface CartItem {
  product_id: number;
  quantity: number;
}

export interface CartDiscount {
  discount_type: 'NONE' | 'FIXED' | 'PERCENT';
  discount_value: number;
}

export interface CalculatedItem {
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number | string;
  unit_cost: number | string;
  line_subtotal: number | string;
  allocated_discount: number | string;
  line_total: number | string;
  estimated_gross_profit: number | string;
}

export interface CartValidation {
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  final_amount: number | string;
  estimated_gross_profit: number | string;
  items: CalculatedItem[];
  is_valid: boolean;
  error_message?: string | null;
}

export interface OrderItemResponse {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number | string;
  unit_cost_snapshot: number | string;
  discount_amount: number | string;
  line_total: number | string;
}

export interface OrderResponse {
  id: number;
  merchant_id: number;
  customer_id?: number | null;
  customer_name?: string | null;
  order_number: string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  final_amount: number | string;
  status: string;
  created_at: string;
  paid_at?: string | null;
  items: OrderItemResponse[];
}

export interface DemoQRPaymentResponse {
  order_id: number;
  order_number: string;
  amount: number | string;
  merchant_name: string;
  vpa: string;
  transaction_reference: string;
  upi_uri: string;
  qr_code_base64: string;
  is_demo: boolean;
  disclaimer: string;
}

export interface SoundboxAnnouncement {
  announcement_text: string;
  amount: number | string;
  customer_name?: string | null;
  order_number: string;
  transaction_reference: string;
  timestamp: string;
}

export interface PaymentSimulationResponse {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
  message: string;
  order_id: number;
  order_number: string;
  transaction_reference: string;
  amount: number | string;
  is_duplicate: boolean;
  soundbox?: SoundboxAnnouncement | null;
}

export interface Transaction {
  id: number;
  order_id: number;
  order_number?: string | null;
  transaction_reference: string;
  payment_method: string;
  amount: number | string;
  status: string;
  simulated: boolean;
  created_at: string;
  confirmed_at?: string | null;
  customer_name?: string | null;
  item_count?: number;
}

export interface TransactionDetail extends Transaction {
  customer_id?: number | null;
  subtotal?: number | string;
  discount_amount?: number | string;
  tax_amount?: number | string;
  items: OrderItemResponse[];
  inventory_movements: Array<{
    product_name: string;
    quantity_change: number;
    previous_stock: number;
    new_stock: number;
    reason: string;
    created_at: string;
  }>;
}

export interface Customer {
  id: number;
  merchant_id: number;
  display_name: string;
  phone?: string | null;
  marketing_consent: boolean;
  first_purchase_at?: string | null;
  last_purchase_at?: string | null;
  created_at: string;
  total_orders: number;
  total_spend: number | string;
  average_bill_value: number | string;
  segment: 'NEW' | 'REGULAR' | 'LAPSED' | 'HIGH_VALUE';
}

export interface CustomerDetail extends Customer {
  favorite_products: string[];
  days_since_last_visit?: number | null;
  is_loyalty_eligible: boolean;
  active_coupons: string[];
}

export interface LapsedCustomer {
  customer_id: number;
  display_name: string;
  phone?: string | null;
  last_visit?: string | null;
  days_inactive: number;
  previous_purchase_count: number;
  total_spend: number | string;
  average_spend: number | string;
  favorite_products: string[];
  reason_for_recommendation: string;
}

export interface LoyaltyEligibleCustomer {
  customer_id: number;
  display_name: string;
  phone?: string | null;
  cumulative_spend: number | string;
  threshold: number | string;
  total_visits: number;
  eligible: boolean;
  already_rewarded: boolean;
}

export interface Coupon {
  id: number;
  customer_id: number;
  customer_name: string;
  coupon_code: string;
  discount_type: string;
  discount_value: number | string;
  expiry_date: string;
  status: string;
  approved_at: string;
}

export interface Campaign {
  id: number;
  merchant_id: number;
  name: string;
  objective: string;
  message: string;
  discount_type: string;
  discount_value: number | string;
  budget: number | string;
  status: string;
  language: string;
  created_at: string;
  approved_at?: string | null;
  eligible_count: number;
  treatment_count: number;
  holdout_count: number;
  estimated_maximum_discount_cost: number | string;
  margin_warning?: {
    is_safe: boolean;
    product_name?: string;
    selling_price?: number;
    cost_price?: number;
    discounted_price?: number;
    potential_loss_per_unit?: number;
    warning_message?: string;
  } | null;
}

export interface CampaignUplift {
  campaign_id: number;
  campaign_name: string;
  observation_period_days: number;
  treatment_customers: number;
  holdout_customers: number;
  treatment_revenue: number | string;
  holdout_revenue: number | string;
  treatment_revenue_per_customer: number | string;
  holdout_revenue_per_customer: number | string;
  incremental_revenue_per_customer: number | string;
  incremental_revenue: number | string;
  campaign_cost: number | string;
  revenue_to_cost_ratio: number | string;
  incremental_gross_profit?: number | string | null;
  profit_roi_percentage?: number | string | null;
  is_profit_roi_available: boolean;
  ai_explanation: string;
  methodology_notes: string;
  disclaimer: string;
  generated_at: string;
}

export interface HourlySalesItem {
  hour: number;
  hour_label: string;
  sales: number | string;
  order_count: number;
}

export interface DailySalesTrendItem {
  date: string;
  day_name: string;
  sales: number | string;
  profit: number | string;
  order_count: number;
}

export interface TopProductItem {
  product_id: number;
  name: string;
  category: string;
  units_sold: number;
  total_revenue: number | string;
  gross_profit: number | string;
}

export interface LowStockAlertItem {
  product_id: number;
  name: string;
  sku: string;
  current_stock: number;
  reorder_threshold: number;
  days_left?: number | null;
  status: string;
}

export interface DashboardKPIs {
  today_sales: number | string;
  yesterday_sales: number | string;
  sales_growth_pct?: number | null;
  today_transactions_count: number;
  average_bill_value: number | string;
  estimated_gross_profit: number | string;
  total_customers: number;
  low_stock_count: number;
  best_selling_product?: string | null;
  peak_business_hour?: string | null;
  hourly_sales: HourlySalesItem[];
  weekly_trend: DailySalesTrendItem[];
  top_products: TopProductItem[];
  low_stock_alerts: LowStockAlertItem[];
}

export interface RecommendationItem {
  title: string;
  action: string;
  reason: string;
  supporting_data: string;
  estimated_benefit?: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DailyBrief {
  generated_at: string;
  language: string;
  merchant_name: string;
  store_name: string;
  today_sales: number | string;
  yesterday_sales: number | string;
  growth_pct?: number | null;
  transactions_count: number;
  average_bill_value: number | string;
  estimated_gross_profit: number | string;
  peak_sales_hour?: string | null;
  top_selling_product?: string | null;
  low_stock_summary: string[];
  brief_narrative: string;
  actionable_recommendations: RecommendationItem[];
}

export interface SuggestedQuestion {
  id: string;
  label: string;
  query: string;
}

export interface AssistantQueryResponse {
  reply: string;
  intent: string;
  language: string;
  structured_data?: Record<string, any> | null;
  suggested_questions: SuggestedQuestion[];
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  previous_state?: string | null;
  new_state?: string | null;
  description: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  merchant_id: number;
  notification_type: 'PURCHASE' | 'LOW_STOCK' | 'CRITICAL_STOCK' | 'PROFIT_DECLINE' | 'CAMPAIGN' | 'LOYALTY' | 'LARGE_SALE' | 'OUT_OF_STOCK';
  title: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  link?: string | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
  deduplication_key?: string | null;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unread_count: number;
  total_count: number;
}

export interface MerchantSettings {
  id: number;
  name: string;
  business_name: string;
  location: string;
  currency: string;
  timezone: string;
  preferred_language?: string;
  voice_enabled?: boolean;
  auto_login_greeting?: boolean;
  voice_responses?: boolean;
  preferred_speech_lang?: string;
  notify_purchases?: boolean;
  notify_low_stock?: boolean;
  notify_profit_decline?: boolean;
  profit_decline_threshold_pct?: number;
}

export interface ComprehensiveAnalytics {
  costing_method: string;
  total_revenue_all_time: number | string;
  total_gross_profit_all_time: number | string;
  profit_margin_pct: number;
  sales_trend_30_days: DailySalesTrendItem[];
  category_distribution: Array<{
    category: string;
    revenue: number | string;
    percentage: number;
  }>;
  top_products: TopProductItem[];
  slow_moving_products: Array<{
    product_id: number;
    name: string;
    current_stock: number;
    units_sold_30_days: number;
    days_since_last_sale?: number | null;
  }>;
  customer_metrics: {
    total_customers: number;
    repeat_customers: number;
    repeat_customer_rate: number;
    new_customers_last_30_days: number;
    average_customer_spend: number | string;
  };
}
