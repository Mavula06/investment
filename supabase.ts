import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  balance: number;
  total_invested: number;
  total_profit: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type InvestmentPlan = {
  id: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number | null;
  interest_rate: number;
  duration_days: number;
  icon_name: string;
  color_scheme: string;
  is_active: boolean;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  expected_profit: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  plan?: InvestmentPlan;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'referral';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  reference_code?: string;
  description?: string;
  investment_id?: string;
  provider?: string;
  provider_reference?: string;
  payment_details?: Record<string, any>;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  type: 'card' | 'bank_account' | 'mobile_money';
  provider?: string;
  provider_reference?: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  bank_code?: string;
  currency: string;
  is_default: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Withdrawal = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method_id?: string;
  bank_name?: string;
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  reference_code: string;
  provider_reference?: string;
  provider_response?: Record<string, any>;
  processed_by?: string;
  processed_at?: string;
  failure_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type NigerianBank = {
  id: string;
  name: string;
  code: string;
  slug?: string;
  is_active: boolean;
};
