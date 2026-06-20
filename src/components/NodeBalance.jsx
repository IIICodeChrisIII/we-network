import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function NodeBalance({ userId }) {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;

    const fetchBalance = async () => {
      try {
        const { data, error } = await supabase
          .from('we_wallets')
          .select('balance')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') {
            console.warn('[NodeBalance] Error fetching balance:', error);
          }
          if (mounted) setBalance(0);
          return;
        }

        if (mounted && data) {
          setBalance(data.balance);
        }
      } catch (err) {
        console.warn('[NodeBalance] Exception:', err);
        if (mounted) setBalance(0);
      }
    };

    fetchBalance();

    // Listen to local events if balance updates in the same session
    const handleUpdate = () => {
      fetchBalance();
    };
    window.addEventListener('we_nodes_updated', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('we_nodes_updated', handleUpdate);
    };
  }, [userId]);

  // Graceful degradation: if there's an error, just render nothing so it doesn't break the UI
  if (error || balance === null) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: 'rgba(226, 0, 26, 0.1)',
      border: '1px solid var(--accent-red)',
      borderRadius: '20px',
      color: 'var(--accent-red)',
      fontWeight: '600',
      fontSize: '0.95rem'
    }}>
      <Sparkles size={16} />
      <span>{balance} WE-Nodes</span>
    </div>
  );
}
