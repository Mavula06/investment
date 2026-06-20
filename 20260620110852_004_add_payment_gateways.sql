-- Add payment gateway support for African payments (Paystack)
-- Payment methods table for storing user payment accounts
CREATE TABLE yoco_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', 'mobile_money'
  provider VARCHAR(50), -- 'paystack', 'flutterwave', etc.
  provider_reference VARCHAR(255), -- Reference from payment provider
  account_name VARCHAR(255),
  account_number VARCHAR(50), -- Last 4 digits for cards, or masked account
  bank_name VARCHAR(100),
  bank_code VARCHAR(20),
  currency VARCHAR(10) DEFAULT 'NGN',
  is_default BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}', -- Additional provider data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Payment methods policies
CREATE POLICY "select_own_payment_methods" ON payment_methods FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_payment_methods" ON payment_methods FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_payment_methods" ON payment_methods FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_payment_methods" ON payment_methods FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Withdrawal requests table
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NGN',
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  bank_name VARCHAR(100),
  bank_code VARCHAR(20),
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  reference_code VARCHAR(255) UNIQUE,
  provider_reference VARCHAR(255), -- Paystack transfer reference
  provider_response JSONB DEFAULT '{}',
  processed_by UUID REFERENCES profiles(id), -- Admin who processed
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Withdrawals policies - users can see their own
CREATE POLICY "select_own_withdrawals" ON withdrawals FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

CREATE POLICY "insert_own_withdrawals" ON withdrawals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin policies for withdrawals
CREATE POLICY "admin_update_withdrawals" ON withdrawals FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Update transactions table to include payment provider info
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}';

-- Create indexes for better query performance
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_reference ON withdrawals(reference_code);
CREATE INDEX idx_transactions_provider_ref ON transactions(provider_reference);

-- Add Nigerian banks reference data
CREATE TABLE nigerian_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  slug VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for banks (publicly readable)
ALTER TABLE nigerian_banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_nigerian_banks" ON nigerian_banks FOR SELECT
  TO authenticated USING (true);

-- Seed Nigerian banks
INSERT INTO nigerian_banks (name, code, slug) VALUES
('Access Bank', '044', 'access-bank'),
('Citibank', '023', 'citibank'),
('Ecobank', '050', 'ecobank'),
('Fidelity Bank', '070', 'fidelity-bank'),
('First Bank of Nigeria', '011', 'first-bank'),
('First City Monument Bank', '214', 'fcmb'),
('Guaranty Trust Bank', '058', 'gtbank'),
('Heritage Bank', '030', 'heritage-bank'),
('Keystone Bank', '082', 'keystone-bank'),
('Polaris Bank', '076', 'polaris-bank'),
('Providus Bank', '101', 'providus-bank'),
('Stanbic IBTC Bank', '221', 'stanbic-ibtc-bank'),
('Standard Chartered Bank', '068', 'standard-chartered-bank'),
('Sterling Bank', '232', 'sterling-bank'),
('Union Bank of Nigeria', '032', 'union-bank'),
('United Bank for Africa', '033', 'uba'),
('Unity Bank', '215', 'unity-bank'),
('Wema Bank', '035', 'wema-bank'),
('Zenith Bank', '057', 'zenith-bank'),
('OPay', '999156', 'opay'),
('PalmPay', '999153', 'palmpay'),
('Kuda', '999162', 'kuda'),
('Carbon', '999151', 'carbon'),
('VFD Microfinance Bank', '999166', 'vfd');
