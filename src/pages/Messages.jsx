import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Send, Search, MessageSquare, ChevronLeft, GraduationCap, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { findUniversity, getLogoUrl } from '../lib/universities';

const MESSAGES_LIMIT = 100;
const POLL_INTERVAL_MS = 2000;

const STATUS_LABEL = {
  student: 'Student', intern: 'Intern',
  working_student: 'Working Student', employee: 'Employee',
};

function Avatar({ profile, size = 40 }) {
  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || '?';
  const isSpecialist = profile?.role === 'specialist';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isSpecialist ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, color: isSpecialist ? 'white' : 'var(--text-primary)',
    }}>
      {initials}
    </div>
  );
}

function timeLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Jetzt';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('de', { day: '2-digit', month: 'short' });
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);       // { authId, ...profile }
  const [conversations, setConversations] = useState([]);     // [{ channel, otherProfile, lastMsg }]
  const [activeConv, setActiveConv] = useState(null);         // { channel, otherProfile }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const pollingRef = useRef(null);
  const subscriptionRef = useRef(null);
  const isInitialized = useRef(false);

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    init();
    return () => cleanup();
  }, []);

  async function init() {
    const user = await fetchCurrentUser();
    if (!user) { navigate('/login', { replace: true, state: { from: location.pathname + location.search } }); return; }
    await fetchConversations(user);
    setLoading(false);
    isInitialized.current = true;
  }

  function cleanup() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
  }

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const me = { authId: user.id, ...(profile || {}) };
    setCurrentUser(me);
    return me;
  }

  async function fetchConversations(user) {
    // Find all DM channels that reference current user's ID in description
    const uid = user.authId;
    const { data: channels } = await supabase
      .from('channels')
      .select('*')
      .like('name', 'dm-%');

    if (!channels) return;

    // Filter to channels that contain our UID slice in the name
    const mySlice = uid.slice(0, 8);
    const myChannels = channels.filter(ch => {
      const parts = ch.name.split('-'); // ['dm', slice1, slice2]
      return parts[1] === mySlice || parts[2] === mySlice;
    });

    // For each channel, find the other participant from description or by querying messages
    const convs = await Promise.all(myChannels.map(async ch => {
      let otherProfile = null;

      // Description format: dm:uuid1:uuid2
      const desc = ch.description || '';
      if (desc.startsWith('dm:')) {
        const [, id1, id2] = desc.split(':');
        const otherId = id1 === uid ? id2 : id1;
        if (otherId) {
          const { data } = await supabase.from('profiles').select('*').eq('id', otherId).single();
          otherProfile = data;
        }
      }

      // Fallback: look at messages to find the other person
      if (!otherProfile) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('user_id, profiles(*)')
          .eq('channel_id', ch.id)
          .neq('user_id', uid)
          .limit(1);
        if (msgs?.[0]?.profiles) otherProfile = msgs[0].profiles;
      }

      // Get last message for preview
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('content, created_at, user_id')
        .eq('channel_id', ch.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return { channel: ch, otherProfile, lastMsg: lastMsgs?.[0] || null };
    }));

    const valid = convs.filter(c => c.otherProfile);
    valid.sort((a, b) => {
      const ta = a.lastMsg?.created_at || a.channel.created_at;
      const tb = b.lastMsg?.created_at || b.channel.created_at;
      return new Date(tb) - new Date(ta);
    });

    setConversations(valid);
    return valid;
  }

  // ── Handle ?with= param ───────────────────────────────────
  useEffect(() => {
    const withUserId = searchParams.get('with');
    if (!withUserId || !currentUser || !isInitialized.current) return;
    openOrCreateDM(withUserId);
  }, [searchParams, currentUser]);

  async function openOrCreateDM(otherUserId) {
    if (!currentUser || otherUserId === currentUser.authId) return;

    const ids = [currentUser.authId, otherUserId].sort();
    const dmName = `dm-${ids[0].slice(0, 8)}-${ids[1].slice(0, 8)}`;

    let channel;
    const { data: existing } = await supabase.from('channels').select('*').eq('name', dmName).single();

    if (existing) {
      channel = existing;
    } else {
      const { data: created, error } = await supabase
        .from('channels')
        .insert({
          name: dmName,
          description: `dm:${ids[0]}:${ids[1]}`,
        })
        .select()
        .single();

      if (error || !created) {
        alert('Konnte DM nicht erstellen. Supabase INSERT-Policy für DM-Channels prüfen.');
        return;
      }
      channel = created;
    }

    const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
    const conv = { channel, otherProfile };

    setConversations(prev => {
      const exists = prev.find(c => c.channel.id === channel.id);
      if (exists) return prev;
      return [conv, ...prev];
    });

    selectConversation(conv);
  }

  // ── Open conversation ─────────────────────────────────────
  function selectConversation(conv) {
    setActiveConv(conv);
    loadMessages(conv.channel.id);
    startRealtime(conv.channel.id);
  }

  async function loadMessages(channelId) {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);

    const sorted = (data || []).reverse();
    setMessages(sorted);
    if (sorted.length > 0) lastTimestampRef.current = sorted[sorted.length - 1].created_at;
    setLoadingMessages(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
  }

  function startRealtime(channelId) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);

    // Polling
    pollingRef.current = setInterval(async () => {
      if (!lastTimestampRef.current) return;
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(*)')
        .eq('channel_id', channelId)
        .gt('created_at', lastTimestampRef.current)
        .order('created_at', { ascending: true });

      if (data?.length) {
        setMessages(prev => {
          const deduped = data.filter(m => !prev.some(pm => pm.id === m.id));
          if (!deduped.length) return prev;
          lastTimestampRef.current = deduped[deduped.length - 1].created_at;
          return [...prev, ...deduped];
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
      }
    }, POLL_INTERVAL_MS);

    // WebSocket
    subscriptionRef.current = supabase
      .channel(`dm-realtime-${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data: full } = await supabase
            .from('messages').select('*, profiles(*)').eq('id', payload.new.id).single();
          if (!full) return;
          setMessages(prev => {
            if (prev.some(m => m.id === full.id)) return prev;
            lastTimestampRef.current = full.created_at;
            return [...prev, full];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
        })
      .subscribe();
  }

  // ── Send ──────────────────────────────────────────────────
  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const content = newMessage.trim();
    setNewMessage('');

    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId, channel_id: activeConv.channel.id, user_id: currentUser.authId,
      content, created_at: new Date().toISOString(),
      profiles: { first_name: currentUser.first_name, last_name: currentUser.last_name, role: currentUser.role },
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);

    const { data } = await supabase
      .from('messages')
      .insert({ channel_id: activeConv.channel.id, user_id: currentUser.authId, content })
      .select('*, profiles(*)')
      .single();

    if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      lastTimestampRef.current = data.created_at;
      // Update last message in conversation list
      setConversations(prev => prev.map(c =>
        c.channel.id === activeConv.channel.id ? { ...c, lastMsg: data } : c
      ));
    }
  }

  // ── Filter conversations ───────────────────────────────────
  const filteredConvs = conversations.filter(c => {
    if (!convSearch) return true;
    const q = convSearch.toLowerCase();
    const name = `${c.otherProfile?.first_name || ''} ${c.otherProfile?.last_name || ''}`.toLowerCase();
    return name.includes(q);
  });

  // ── Render ────────────────────────────────────────────────
  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Laden...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', gap: '0' }}>

      {/* ── Left: Conversation list ──────────────────────────── */}
      <div className="card card-static" style={{
        width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none',
        margin: 0, padding: 0,
      }}>
        {/* Header */}
        <div style={{ padding: '20px 18px 12px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Nachrichten
          </h2>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Suchen..."
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '34px', fontSize: '0.85rem', padding: '8px 12px 8px 34px' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConvs.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <MessageSquare size={28} style={{ color: 'var(--text-muted)', marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {conversations.length === 0 ? 'Noch keine Konversationen' : 'Keine Treffer'}
              </p>
            </div>
          )}
          {filteredConvs.map(conv => {
            const p = conv.otherProfile;
            const isActive = activeConv?.channel.id === conv.channel.id;
            const isMine = conv.lastMsg?.user_id === currentUser?.authId;
            return (
              <button
                key={conv.channel.id}
                onClick={() => selectConversation(conv)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 18px', textAlign: 'left', cursor: 'pointer',
                  background: isActive ? 'rgba(204,0,0,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: isActive ? '3px solid var(--accent-red)' : '3px solid transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Avatar profile={p} size={42} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p?.first_name} {p?.last_name}
                    </span>
                    {conv.lastMsg && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '6px' }}>
                        {timeLabel(conv.lastMsg.created_at)}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMsg
                      ? `${isMine ? 'Du: ' : ''}${conv.lastMsg.content}`
                      : <span style={{ fontStyle: 'italic' }}>Konversation starten</span>
                    }
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Chat area ─────────────────────────────────── */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{
            padding: '14px 24px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '14px',
            background: 'var(--bg-secondary)', flexShrink: 0,
          }}>
            <Avatar profile={activeConv.otherProfile} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {activeConv.otherProfile?.first_name} {activeConv.otherProfile?.last_name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                {activeConv.otherProfile?.role === 'specialist' && (
                  <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>Specialist</span>
                )}
                {activeConv.otherProfile?.status && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {STATUS_LABEL[activeConv.otherProfile.status] || activeConv.otherProfile.status}
                  </span>
                )}
                {activeConv.otherProfile?.university && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    · {activeConv.otherProfile.university}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {loadingMessages ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>Laden...</p>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.6 }}>
                <Avatar profile={activeConv.otherProfile} size={56} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                  Starte eine Konversation mit <strong style={{ color: 'var(--text-secondary)' }}>{activeConv.otherProfile?.first_name}</strong>
                </p>
              </div>
            ) : (
              (() => {
                const grouped = [];
                messages.forEach((msg, i) => {
                  const prev = messages[i - 1];
                  const sameUser = prev?.user_id === msg.user_id && !msg.id.startsWith('temp-');
                  const withinMinute = prev && (new Date(msg.created_at) - new Date(prev.created_at)) < 60000;
                  grouped.push({ msg, compact: sameUser && withinMinute });
                });
                return grouped.map(({ msg, compact }) => {
                  const isMine = msg.user_id === currentUser?.authId || msg.user_id === 'pending';
                  const isTemp = msg.id.startsWith('temp-');
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row',
                        alignItems: 'flex-end', gap: '8px',
                        marginTop: compact ? '2px' : '14px',
                      }}
                    >
                      {!compact && !isMine && (
                        <Avatar profile={msg.profiles} size={30} />
                      )}
                      {compact && !isMine && <div style={{ width: 30 }} />}

                      <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: '2px' }}>
                        {!compact && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px', paddingLeft: isMine ? 0 : '4px', paddingRight: isMine ? '4px' : 0 }}>
                            {isMine ? 'Du' : `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim()}
                            {' · '}{new Date(msg.created_at).toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <div style={{
                          padding: '9px 14px', borderRadius: compact
                            ? (isMine ? '16px 4px 4px 16px' : '4px 16px 16px 4px')
                            : '16px',
                          background: isMine ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                          color: isMine ? 'white' : 'var(--text-primary)',
                          fontSize: '0.9rem', lineHeight: 1.45,
                          opacity: isTemp ? 0.65 : 1,
                          wordBreak: 'break-word',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{
            padding: '16px 24px', borderTop: '1px solid var(--border-color)',
            display: 'flex', gap: '10px', background: 'var(--bg-secondary)', flexShrink: 0,
          }}>
            <input
              type="text"
              className="input-field"
              placeholder={`Nachricht an ${activeConv.otherProfile?.first_name || ''}...`}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newMessage.trim()}
              style={{ padding: '10px 18px' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', opacity: 0.55 }}>
          <MessageSquare size={48} style={{ color: 'var(--text-muted)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>Keine Konversation ausgewählt</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Wähle eine Konversation aus oder starte eine neue über ein Profil.</p>
          </div>
        </div>
      )}
    </div>
  );
}
