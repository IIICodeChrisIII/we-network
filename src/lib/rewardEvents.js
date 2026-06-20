import { supabase } from './supabase';

/**
 * Event-Driven Gamification Logic
 * Decouples the UI from the reward mechanics to ensure Graceful Degradation.
 * If this fails, the core app (e.g., messaging) will continue to work.
 */
class RewardEventDispatcher {
  constructor() {
    this.listeners = [];
  }

  subscribe(event, callback) {
    this.listeners.push({ event, callback });
  }

  async dispatch(event, payload) {
    // Fire and forget asynchronously to avoid blocking the main thread
    setTimeout(async () => {
      try {
        for (const listener of this.listeners) {
          if (listener.event === event || listener.event === '*') {
            await listener.callback(payload);
          }
        }
      } catch (err) {
        console.error('[RewardEvents] Error processing event:', err);
        // Graceful degradation: failing silently so it doesn't crash the core UI
      }
    }, 0);
  }
}

export const rewardEvents = new RewardEventDispatcher();

// Setup Background Listeners
rewardEvents.subscribe('message_sent', async ({ userId }) => {
  if (!userId) return;
  try {
    // Award 5 WE-Nodes for sending a message
    const { error } = await supabase.rpc('process_we_node_transaction', {
      p_user_id: userId,
      p_amount: 5,
      p_action_type: 'message_sent',
      p_metadata: { type: 'chat_participation' }
    });
    
    if (error) {
      console.warn('[RewardEvents] Failed to process transaction via RPC. Is the setup_rewards.sql executed?', error);
    } else {
      console.log('[RewardEvents] Awarded 5 WE-Nodes to user', userId);
      // We could dispatch a local event to update UI balances if needed
      window.dispatchEvent(new CustomEvent('we_nodes_updated'));
    }
  } catch (err) {
    console.error('[RewardEvents] Exception in transaction processing:', err);
  }
});

// Helper function for the UI to call
export const triggerRewardEvent = (event, payload) => {
  rewardEvents.dispatch(event, payload);
};
