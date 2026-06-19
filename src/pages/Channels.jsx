import React, { useState, useEffect } from 'react';
import { Hash, Send, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Channels() {
  const [activeChannel, setActiveChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      
      const subscription = supabase
        .channel(`messages:channel_id=eq.${activeChannel.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` }, payload => {
          setMessages(prev => [...prev, payload.new]);
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
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please log in first");

    const { error } = await supabase.from('messages').insert([
      { channel_id: activeChannel.id, user_id: user.id, content: newMessage }
    ]);
    
    if (!error) {
      setNewMessage('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 80px)', display: 'flex', gap: '20px' }}>
      {/* Channels List */}
      <div className="card" style={{ width: '250px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Text Channels
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {channels.map(ch => (
            <button 
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '6px',
                background: activeChannel?.id === ch.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeChannel?.id === ch.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeChannel?.id === ch.id ? '500' : '400',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={16} /> {ch.name}
              </div>
              {ch.unread > 0 && (
                <span style={{ background: 'var(--accent-red)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {ch.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Chat Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: '600' }}>
            <Hash size={20} className="text-secondary" /> {activeChannel?.name || 'Loading...'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Users size={18} /> 42 Online
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map(msg => {
            const isSpecialist = msg.profiles?.role === 'specialist';
            const name = msg.profiles ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}` : 'Unknown User';
            const avatar = name.charAt(0).toUpperCase();
            
            return (
            <div key={msg.id} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: isSpecialist ? 'var(--gradient-primary)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {avatar}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: isSpecialist ? 'var(--accent-red)' : 'var(--text-primary)' }}>{name}</span>
                  {isSpecialist && <span style={{ fontSize: '0.7rem', background: 'rgba(204,0,0,0.1)', color: 'var(--accent-red)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Specialist</span>}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {msg.content}
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Input */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={sendMessage} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="text" 
              placeholder={`Message #${activeChannel?.name || '...'}`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1rem' }}
            />
            <button type="submit" className="text-accent" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
