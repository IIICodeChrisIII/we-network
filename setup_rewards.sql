-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.we_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.we_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- positive for earning, negative for spending
  action_type text NOT NULL, -- e.g., 'message_sent', 'reward_redeemed'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. RLS for we_wallets
ALTER TABLE public.we_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" ON public.we_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- 4. RLS for we_transactions
ALTER TABLE public.we_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.we_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Function to process transactions safely (ACID)
CREATE OR REPLACE FUNCTION process_we_node_transaction(
  p_user_id uuid,
  p_amount integer,
  p_action_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS integer AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Insert transaction
  INSERT INTO public.we_transactions (user_id, amount, action_type, metadata)
  VALUES (p_user_id, p_amount, p_action_type, p_metadata);

  -- Update or insert wallet balance securely
  INSERT INTO public.we_wallets (user_id, balance)
  VALUES (p_user_id, GREATEST(0, p_amount))
  ON CONFLICT (user_id) DO UPDATE
  SET balance = we_wallets.balance + p_amount,
      updated_at = now()
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
