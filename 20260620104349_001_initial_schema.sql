-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  balance DECIMAL(12,2) DEFAULT 0,
  total_invested DECIMAL(12,2) DEFAULT 0,
  total_profit DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment plans
CREATE TABLE investment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount DECIMAL(12,2) NOT NULL,
  max_amount DECIMAL(12,2),
  interest_rate DECIMAL(5,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  icon_name TEXT DEFAULT 'trending-up',
  color_scheme TEXT DEFAULT 'gold',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User investments
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES investment_plans(id),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  expected_profit DECIMAL(12,2),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'profit', 'referral')),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method TEXT,
  reference_code TEXT,
  description TEXT,
  investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for investment_plans (public read)
CREATE POLICY "read_plans" ON investment_plans FOR SELECT TO authenticated USING (is_active = true);

-- RLS Policies for investments
CREATE POLICY "select_own_investments" ON investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_investments" ON investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_investments" ON investments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_investments" ON investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Insert default investment plans
INSERT INTO investment_plans (name, description, min_amount, max_amount, interest_rate, duration_days, icon_name, color_scheme) VALUES
('Starter Plan', 'Perfect for beginners looking to start their investment journey', 100, 999, 5.00, 7, 'seedling', 'emerald'),
('Growth Plan', 'Ideal for steady growth with moderate returns', 1000, 4999, 8.50, 14, 'trending-up', 'blue'),
('Premium Plan', 'Maximize your returns with our premium offering', 5000, 19999, 12.00, 21, 'crown', 'gold'),
('Elite Plan', 'Exclusive high-yield investment opportunity', 20000, 99999, 18.00, 30, 'gem', 'purple'),
('Diamond Plan', 'Our highest tier for serious investors', 100000, NULL, 25.00, 45, 'sparkles', 'cyan');
