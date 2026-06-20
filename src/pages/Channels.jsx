import React, { useState, useEffect, useRef } from 'react';
import { Hash, Send, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Channels() {
  const [activeChannel, setActiveChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      
      const subscription = supabase
        .channel(`messages:channel_id=eq.${activeChannel.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` }, async (payload) => {
          // Fetch the message with profile data
          const { data: newMsg } = await supabase
            .from('messages')
            .select('*, profiles(first_name, last_name, role)')
            .eq('id', payload.new.id)
            .single();
            
          if (newMsg) {
            setMessages(prev => {
              // Replace optimistic message with the real one
              const tempIndex = prev.findIndex(m => String(m.id).startsWith('temp-') && m.content === newMsg.content && m.user_id === newMsg.user_id);
              if (tempIndex !== -1) {
                const newArr = [...prev];
                newArr[tempIndex] = newMsg;
                return newArr;
              }
              // Normal deduplication just in case
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [activeChannel]);

  const fetchChannels = async () => {
    const { data, error } = await supabase.from('channels').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setChannels(data);
      if (data.length > 0) setActiveChannel(data[0]);
    }
    setLoading(false);
  };

  const fetchMessages = async (channelId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          role
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });
      
    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;
    
    const content = newMessage;
    setNewMessage(''); // Instant UI feedback
    
    // 1. TRULY INSTANT OPTIMISTIC UPDATE (No await before this!)
    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: tempId,
      channel_id: activeChannel.id,
      user_id: 'pending', // Will be overwritten
      content: content,
      created_at: new Date().toISOString(),
      profiles: { first_name: 'Du', last_name: '', role: 'user' }
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    
    // 2. Fetch User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Revert if not logged in
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return alert("Please log in first");
    }

    // 3. Send to server
    await supabase.from('messages').insert([
      { channel_id: activeChannel.id, user_id: user.id, content: content }
    ]);
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Channels List */}
      <div className="card" style={{ width: '280px', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '20px', padding: '0 12px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Live Channels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {channels.map(ch => (
            <button 
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                background: activeChannel?.id === ch.id ? 'rgba(204, 0, 0, 0.12)' : 'transparent',
                color: activeChannel?.id === ch.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeChannel?.id === ch.id ? '600' : '500',
                transition: 'all var(--transition-fast)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Hash size={18} className={activeChannel?.id === ch.id ? 'text-accent' : ''} /> {ch.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        {/* Chat Header */}
        <div style={{ padding: '20px 28px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: '600' }}>
            <Hash size={22} className="text-secondary" /> {activeChannel?.name || 'Loading...'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            <Users size={18} /> Team
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map(msg => {
            const isSpecialist = msg.profiles?.role === 'specialist';
            const name = msg.profiles ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}` : 'Unknown User';
            const avatar = name.charAt(0).toUpperCase();
            
            return (
            <div key={msg.id} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isSpecialist ? 'var(--gradient-primary)' : 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: isSpecialist ? 'white' : 'var(--text-primary)' }}>
                {avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.05rem', color: isSpecialist ? 'var(--accent-red)' : 'var(--text-primary)' }}>{name}</span>
                  {isSpecialist && <span className="badge badge-red">Specialist</span>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: '1.5', fontSize: '0.95rem', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '0 12px 12px 12px', display: 'inline-block' }}>
                  {msg.content}
                </div>
              </div>
            </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={sendMessage} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-pill)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color var(--transition-fast)' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <input 
              type="text" 
              placeholder={`Message #${activeChannel?.name || '...'}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem', padding: '4px 8px' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-pill)' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
