import { User } from '@supabase/supabase-js';
import { Profile, InvestmentPlan, Investment, Transaction, Notification } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export interface AppState {
  currentView: 'dashboard' | 'plans' | 'investments' | 'transactions' | 'settings';
  investmentPlans: InvestmentPlan[];
  investments: Investment[];
  transactions: Transaction[];
  notifications: Notification[];
}
