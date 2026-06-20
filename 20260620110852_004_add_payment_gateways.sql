-- Yoco Payment Integration (South Africa)

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider VARCHAR(50) DEFAULT 'yoco',
  account_name VARCHAR(255),
  account_reference VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'ZAR',
  is_default BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_payment_methods"
ON payment_methods
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_payment_methods"
ON payment_methods
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_payment_methods"
ON payment_methods
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "delete_own_payment_methods"
ON payment_methods
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE yoco_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  yoco_payment_id TEXT UNIQUE,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  provider VARCHAR(50) DEFAULT 'yoco',
  provider_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yoco_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_yoco_transactions"
ON yoco_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
  )
);

CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ZAR',
  status VARCHAR(50) DEFAULT 'pending',
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_withdrawals"
ON withdrawals
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
      AND is_admin = TRUE
  )
);
