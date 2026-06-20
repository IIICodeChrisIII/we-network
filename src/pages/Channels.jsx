import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Send, Users, ChevronUp, Search, Plus, X, MessageSquare, GraduationCap, BookOpen, ChevronDown, CheckCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GERMAN_UNIVERSITIES, findUniversity, getLogoUrl } from '../lib/universities';
import CertificateBadges from '../components/CertificateBadges';

/*
  Required Supabase SQL (run once in SQL Editor):

  CREATE POLICY "Admins can create channels." ON public.channels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

  CREATE POLICY "Users can create DM channels." ON public.channels
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND name LIKE 'dm-%'
  );
*/

const MESSAGES_LIMIT = 150;
const POLL_INTERVAL_MS = 2000;

function normalizeUni(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const STATUS_LABEL = {
  student: 'Student', intern: 'Intern',
  working_student: 'Working Student', employee: 'Employee',
};

export default function Channels() {
  const navigate = useNavigate();
  // ── Core state ────────────────────────────────────────────
  const [activeChannel, setActiveChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // ── User / sidebar ────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverCard, setHoverCard] = useState(null);

  // ── Create-channel modal ──────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [channelType, setChannelType] = useState('generic'); // 'generic' | 'university'
  const [genericName, setGenericName] = useState('');
  const [allUniversities, setAllUniversities] = useState([]);   // all unique unis in DB
  const [takenUnis, setTakenUnis] = useState([]);               // normalized names already claimed
  const [uniSearch, setUniSearch] = useState('');
  const [selectedUni, setSelectedUni] = useState('');           // display name
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const hoverTimeoutRef = useRef(null);
  const uniDropdownRef = useRef(null);

  // ── Effects ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoadingMoreRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchCurrentUser();
    fetchChannels();
  }, []);

  // Close uni dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target)) {
        setShowUniDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!activeChannel) return;

    setMessages([]);
    setHasMore(false);
    lastTimestampRef.current = null;
    fetchMessages(activeChannel.id);

    const subscription = supabase
      .channel(`messages:channel_id=eq.${activeChannel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` }, async (payload) => {
        const { data: newMsg } = await supabase
          .from('messages')
          .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
          .eq('id', payload.new.id)
          .single();

        if (newMsg) {
          lastTimestampRef.current = newMsg.created_at;
          setMessages(prev => {
            let arr = prev.filter(m => !(String(m.id).startsWith('temp-') && m.content === newMsg.content));
            if (arr.some(m => m.id === newMsg.id)) return arr;
            return [...arr, newMsg];
          });
        }
      })
      .subscribe();

    const pollInterval = setInterval(async () => {
      if (!lastTimestampRef.current) return;
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
        .eq('channel_id', activeChannel.id)
        .gt('created_at', lastTimestampRef.current)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        lastTimestampRef.current = data[data.length - 1].created_at;
        setMessages(prev => {
          let arr = [...prev];
          data.forEach(newMsg => {
            arr = arr.filter(m => !(String(m.id).startsWith('temp-') && m.content === newMsg.content));
            if (!arr.some(m => m.id === newMsg.id)) {
              arr.push(newMsg);
            }
          });
          return arr;
        });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(pollInterval);
    };
  }, [activeChannel]);

  // ── Data fetching ─────────────────────────────────────────
  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setCurrentUser({ ...data, authId: user.id });
  };

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
      .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);

    if (!error && data) {
      const ordered = data.reverse();
      setMessages(ordered);
      setHasMore(data.length === MESSAGES_LIMIT);
      if (ordered.length > 0) lastTimestampRef.current = ordered[ordered.length - 1].created_at;
    }
  };

  const loadMoreMessages = async () => {
    if (!activeChannel || messages.length === 0 || loadingMore) return;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
      .eq('channel_id', activeChannel.id)
      .lt('created_at', messages[0].created_at)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);

    if (!error && data) {
      setMessages(prev => [...data.reverse(), ...prev]);
      setHasMore(data.length === MESSAGES_LIMIT);
    }
    setLoadingMore(false);
    setTimeout(() => { isLoadingMoreRef.current = false; }, 50);
  };

  // ── Modal: open + load data ───────────────────────────────
  const openModal = async () => {
    setShowModal(true);
    setChannelType('generic');
    setGenericName('');
    setSelectedUni('');
    setUniSearch('');

    setAllUniversities(GERMAN_UNIVERSITIES);

    // Fetch which unis already have a channel
    const { data: uniChannels } = await supabase
      .from('channels')
      .select('name')
      .like('name', 'uni-%');

    setTakenUnis((uniChannels || []).map(c => c.name.slice(4))); // normalized names
  };

  const closeModal = () => {
    setShowModal(false);
    setGenericName('');
    setSelectedUni('');
    setUniSearch('');
    setShowUniDropdown(false);
  };

  // ── Create channel ────────────────────────────────────────
  const createChannel = async () => {
    if (creating) return;

    let finalName = '';
    let description = '';

    if (channelType === 'generic') {
      if (!genericName.trim()) return;
      finalName = genericName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      description = '';
    } else {
      if (!selectedUni) return;
      finalName = `uni-${normalizeUni(selectedUni)}`;
      description = `University channel for ${selectedUni}`;
    }

    setCreating(true);
    const { data, error } = await supabase
      .from('channels')
      .insert({ name: finalName, description })
      .select()
      .single();

    setCreating(false);

    if (error) {
      alert('Could not create channel.\nRun the INSERT policy SQL in Supabase (see top of Channels.jsx).');
      return;
    }

    setChannels(prev => [...prev, data]);
    setActiveChannel(data);
    closeModal();
  };

  // ── DM ────────────────────────────────────────────────────
  const startDM = async (otherUserId) => {
    if (!currentUser || otherUserId === currentUser.authId) return;
    const ids = [currentUser.authId, otherUserId].sort();
    const dmName = `dm-${ids[0].slice(0, 8)}-${ids[1].slice(0, 8)}`;

    const { data: existing } = await supabase.from('channels').select('*').eq('name', dmName).single();
    if (existing) {
      setActiveChannel(existing);
    } else {
      const { data: newCh, error } = await supabase
        .from('channels')
        .insert({ name: dmName, description: 'Direct Message' })
        .select()
        .single();
      if (newCh) {
        setChannels(prev => [...prev, newCh]);
        setActiveChannel(newCh);
      } else {
        alert('Could not create DM.\nRun the DM INSERT policy SQL in Supabase (see top of Channels.jsx).');
      }
    }
    setHoverCard(null);
  };

  // ── Send message ──────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    const content = newMessage;
    setNewMessage('');

    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId, channel_id: activeChannel.id, user_id: 'pending',
      content, created_at: new Date().toISOString(),
      profiles: { first_name: 'Du', last_name: '', role: 'user' },
    }]);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      return alert('Please log in first');
    }
    await supabase.from('messages').insert([{ channel_id: activeChannel.id, user_id: user.id, content }]);
  };

  // ── Hover card ────────────────────────────────────────────
  const showHoverCard = (e, msg) => {
    if (String(msg.id).startsWith('temp-') || !msg.profiles) return;
    clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverCard({
      userId: msg.user_id, profile: msg.profiles,
      position: {
        top: Math.min(rect.bottom + 8, window.innerHeight - 300),
        left: Math.min(rect.left, window.innerWidth - 290),
      },
    });
  };

  const hideHoverCard = () => { hoverTimeoutRef.current = setTimeout(() => setHoverCard(null), 180); };
  const keepHoverCard = () => clearTimeout(hoverTimeoutRef.current);

  // ── Derived ───────────────────────────────────────────────
  const isAdmin = currentUser?.role === 'admin';

  const visibleChannels = channels.filter(ch => {
    if (!ch.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (!ch.name.startsWith('uni-')) return true;
    if (isAdmin) return true;
    return normalizeUni(currentUser?.university) === ch.name.slice(4);
  });

  // Uni dropdown: filter by name and city
  const filteredUnis = allUniversities.filter(u => {
    const q = uniSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
  });

  const canCreate = channelType === 'generic' ? genericName.trim().length > 0 : !!selectedUni;

  // ── Render ────────────────────────────────────────────────
  return (
    <>
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div className="card card-static" style={{ width: '280px', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '32px', fontSize: '0.83rem', padding: '8px 10px 8px 32px', borderRadius: 'var(--border-radius-pill)' }}
          />
        </div>

        {/* Admin: new channel button */}
        {isAdmin && (
          <button
            className="btn btn-secondary"
            onClick={openModal}
            style={{ width: '100%', fontSize: '0.82rem', padding: '8px 12px', justifyContent: 'flex-start', gap: '8px' }}
          >
            <Plus size={14} /> New Channel
          </button>
        )}

        <p style={{ padding: '2px 8px', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '4px' }}>
          Channels
        </p>

        {/* Channel list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 }}>
          {visibleChannels.map(ch => {
            const isActive = activeChannel?.id === ch.id;
            const label = ch.name.startsWith('uni-') ? ch.name.slice(4) : ch.name.startsWith('dm-') ? 'Direct Message' : ch.name;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '9px 12px', borderRadius: 'var(--border-radius-sm)',
                  background: isActive ? 'rgba(204, 0, 0, 0.12)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem', border: 'none', cursor: 'pointer',
                  textAlign: 'left', transition: 'background var(--transition-fast)', width: '100%',
                }}
              >
                <Hash size={14} style={{ color: isActive ? 'var(--accent-red)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
                {ch.name.startsWith('uni-') && (
                  <span style={{ fontSize: '0.62rem', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', padding: '2px 5px', borderRadius: '100px', flexShrink: 0, fontWeight: 700, letterSpacing: '0.04em' }}>UNI</span>
                )}
              </button>
            );
          })}
          {visibleChannels.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '8px 12px' }}>No channels found.</p>
          )}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────── */}
      <div className="card card-static" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 28px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
            <Hash size={20} style={{ color: 'var(--text-secondary)' }} />
            {activeChannel?.name.startsWith('uni-') ? activeChannel.name.slice(4) : activeChannel?.name || 'Loading...'}
            {activeChannel?.name.startsWith('uni-') && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>University</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Users size={16} /> {activeChannel?.description || 'Team'}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={loadMoreMessages} disabled={loadingMore} style={{ borderRadius: 'var(--border-radius-pill)', fontSize: '0.82rem' }}>
                <ChevronUp size={14} /> {loadingMore ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}

          {messages.map(msg => {
            const isSpecialist = msg.profiles?.role === 'specialist';
            const isTemp = String(msg.id).startsWith('temp-');
            const name = msg.profiles ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}`.trim() : 'Unknown';
            const avatar = name.charAt(0).toUpperCase();

            return (
              <div key={msg.id} style={{ display: 'flex', gap: '14px', opacity: isTemp ? 0.6 : 1 }}>
                <div
                  onMouseEnter={e => !isTemp && showHoverCard(e, msg)}
                  onMouseLeave={hideHoverCard}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: isSpecialist ? 'var(--gradient-primary)' : 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: isSpecialist ? 'white' : 'var(--text-primary)', flexShrink: 0, cursor: isTemp ? 'default' : 'pointer', overflow: 'hidden' }}
                >
                  {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    {!isTemp && <CertificateBadges profile={msg.profiles} max={3} />}
                    <span onMouseEnter={e => !isTemp && showHoverCard(e, msg)} onMouseLeave={hideHoverCard} style={{ fontWeight: 600, fontSize: '1rem', color: isSpecialist ? 'var(--accent-red)' : 'var(--text-primary)', cursor: isTemp ? 'default' : 'pointer' }}>
                      {name}
                    </span>
                    {isSpecialist && <span className="badge badge-red">Specialist</span>}
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.55, fontSize: '0.95rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '10px 14px', borderRadius: '0 12px 12px 12px', display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '20px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
          <form onSubmit={sendMessage} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-pill)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'border-color var(--transition-fast)' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
            <input type="text" placeholder={`Message #${activeChannel?.name.startsWith('uni-') ? activeChannel.name.slice(4) : activeChannel?.name || '...'}`} value={newMessage} onChange={e => setNewMessage(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '0.95rem', padding: '4px 8px' }} />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-pill)', flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>

    {/* ── Create Channel Modal ──────────────────────────────── */}
    {showModal && (
      <div
        onClick={e => e.target === e.currentTarget && closeModal()}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >
        <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-xl)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

          {/* Modal header */}
          <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2px' }}>Create Channel</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Add a new channel to the network</p>
            </div>
            <button onClick={closeModal} style={{ padding: '6px', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-muted)', transition: 'color var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Type toggle */}
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Channel type</p>
              <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-pill)', padding: '4px', border: '1px solid var(--border-color)' }}>
                {[{ key: 'generic', label: 'Generic' }, { key: 'university', label: 'University' }].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setChannelType(key); setSelectedUni(''); setUniSearch(''); }}
                    style={{
                      flex: 1, padding: '9px 16px', borderRadius: 'var(--border-radius-pill)',
                      fontSize: '0.875rem', fontWeight: 600, transition: 'all var(--transition-fast)',
                      background: channelType === key ? 'var(--gradient-primary)' : 'transparent',
                      color: channelType === key ? 'white' : 'var(--text-secondary)',
                      boxShadow: channelType === key ? '0 2px 10px var(--accent-glow)' : 'none',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generic: name input */}
            {channelType === 'generic' && (
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Channel name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Hash size={15} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    autoFocus
                    type="text"
                    className="input-field"
                    placeholder="e.g. announcements"
                    value={genericName}
                    onChange={e => setGenericName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && canCreate && createChannel()}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
                {genericName && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Will be created as <code style={{ color: 'var(--accent-red)' }}>#{genericName}</code>
                  </p>
                )}
              </div>
            )}

            {/* University: searchable dropdown */}
            {channelType === 'university' && (
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Select university</label>
                <div ref={uniDropdownRef} style={{ position: 'relative' }}>
                  {/* Trigger / search input */}
                  <div
                    onClick={() => setShowUniDropdown(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: 'var(--border-radius-sm)',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${showUniDropdown ? 'var(--accent-red)' : 'var(--border-color)'}`,
                      cursor: 'pointer', minHeight: '44px',
                      boxShadow: showUniDropdown ? '0 0 0 3px rgba(204,0,0,0.1)' : 'none',
                    }}
                  >
                    {selectedUni ? (() => {
                      const d = findUniversity(selectedUni);
                      const logoUrl = d ? getLogoUrl(d.domain) : null;
                      return (
                        <>
                          {logoUrl
                            ? <img src={logoUrl} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
                            : <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>{selectedUni[0]}</div>
                          }
                          <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUni}</span>
                          {d?.city && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{d.city}</span>}
                          <button onClick={e => { e.stopPropagation(); setSelectedUni(''); setUniSearch(''); }} style={{ padding: '2px', color: 'var(--text-muted)', lineHeight: 0, flexShrink: 0 }}>
                            <X size={13} />
                          </button>
                        </>
                      );
                    })() : (
                      <>
                        <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hochschule auswählen...</span>
                        <ChevronDown size={15} style={{ color: 'var(--text-muted)', transform: showUniDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                      </>
                    )}
                  </div>

                  {showUniDropdown && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 3000, overflow: 'hidden' }}>
                      {/* Search */}
                      <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                        <div style={{ position: 'relative' }}>
                          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Name oder Stadt..."
                            value={uniSearch}
                            onChange={e => setUniSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '7px 10px 7px 30px', color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none' }}
                          />
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '5px 0 0' }}>
                          {filteredUnis.length} Hochschulen
                        </p>
                      </div>
                      {/* List */}
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {filteredUnis.map(uni => {
                          const taken = takenUnis.includes(normalizeUni(uni.name));
                          const logoUrl = getLogoUrl(uni.domain);
                          return (
                            <button
                              key={uni.name}
                              onClick={e => { e.stopPropagation(); if (taken) return; setSelectedUni(uni.name); setUniSearch(''); setShowUniDropdown(false); }}
                              style={{
                                width: '100%', padding: '9px 14px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'transparent', fontSize: '0.86rem',
                                color: taken ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: taken ? 'not-allowed' : 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                opacity: taken ? 0.55 : 1,
                              }}
                              onMouseOver={e => { if (!taken) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              {logoUrl
                                ? <img src={logoUrl} alt="" style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
                                : <div style={{ width: 18, height: 18, borderRadius: 3, background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>{uni.name[0]}</div>
                              }
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni.name}</span>
                              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', flexShrink: 0 }}>{uni.city}</span>
                              {taken && (
                                <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '100px', flexShrink: 0 }}>
                                  Vergeben
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {selectedUni && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '8px 12px', background: 'rgba(204,0,0,0.06)', border: '1px solid rgba(204,0,0,0.15)', borderRadius: 'var(--border-radius-sm)' }}>
                    <CheckCircle size={14} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Creates <code style={{ color: 'var(--accent-red)' }}>uni-{normalizeUni(selectedUni)}</code> — visible only to <strong style={{ color: 'var(--text-primary)' }}>{selectedUni}</strong> students
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button className="btn btn-secondary" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={createChannel}
                disabled={!canCreate || creating}
                style={{ flex: 1, opacity: (!canCreate || creating) ? 0.5 : 1 }}
              >
                {creating ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Hover Profile Card ────────────────────────────────── */}
    {hoverCard && (() => {
      const p = hoverCard.profile;
      const uniData = p.university ? findUniversity(p.university) : null;
      const uniLogoUrl = uniData ? getLogoUrl(uniData.domain) : null;
      const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || '?';
      const isSpecialist = p.role === 'specialist';
      const isAdmin = p.role === 'admin';
      const isSelf = hoverCard.userId === currentUser?.authId;

      return (
        <div
          onMouseEnter={keepHoverCard}
          onMouseLeave={hideHoverCard}
          style={{
            position: 'fixed', top: hoverCard.position.top, left: hoverCard.position.left,
            width: '300px', background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            zIndex: 1000, overflow: 'hidden',
          }}
        >
          {/* Banner with avatar overlapping */}
          <div style={{ position: 'relative', height: '60px', background: 'var(--gradient-primary)', flexShrink: 0 }}>
            {uniLogoUrl && (
              <img
                src={uniLogoUrl}
                alt=""
                onError={e => e.target.style.display = 'none'}
                style={{ position: 'absolute', right: 12, top: 10, width: 28, height: 28, objectFit: 'contain', opacity: 0.35 }}
              />
            )}
            {/* Avatar positioned ON TOP of banner, overlapping downward */}
            <div style={{
              position: 'absolute', left: 18, bottom: '-28px',
              width: '56px', height: '56px', borderRadius: '50%',
              background: isSpecialist ? 'var(--gradient-primary)' : 'var(--bg-primary)',
              border: '3px solid var(--bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.3rem',
              color: isSpecialist ? 'white' : 'var(--text-primary)',
              zIndex: 2,
            }}>
              {initials}
            </div>
          </div>

          {/* Badges row — right side, below banner */}
          <div style={{ padding: '6px 18px 0', display: 'flex', justifyContent: 'flex-end', gap: '5px', flexWrap: 'wrap', minHeight: '32px' }}>
            {isSpecialist && <span className="badge badge-red">Specialist</span>}
            {isAdmin && <span className="badge badge-blue">Admin</span>}
            {p.status && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                {STATUS_LABEL[p.status] || p.status}
              </span>
            )}
          </div>

          {/* Name (below avatar offset) */}
          <div style={{ padding: '10px 18px 12px' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {p.first_name} {p.last_name}
            </div>
          </div>

          {/* Info rows */}
          {(p.university || p.degree || p.bio) && (
            <div style={{ margin: '0 18px 14px', padding: '12px 14px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {p.university && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  {uniLogoUrl
                    ? <img src={uniLogoUrl} alt="" onError={e => e.target.style.display='none'} style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />
                    : <BookOpen size={13} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.university}</span>
                  {uniData?.city && <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', flexShrink: 0 }}>· {uniData.city}</span>}
                </div>
              )}
              {p.degree && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <GraduationCap size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {p.degree}{p.semester ? ` · Semester ${p.semester}` : ''}
                  </span>
                </div>
              )}
              {p.bio && (
                <>
                  {(p.university || p.degree) && <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />}
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.bio}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '0 18px 18px', display: 'flex', gap: '8px' }}>
            {!isSelf && (
              <button
                className="btn btn-primary"
                onClick={() => { setHoverCard(null); navigate(`/messages?with=${hoverCard.userId}`); }}
                style={{ flex: 1, fontSize: '0.83rem', padding: '8px 12px' }}
              >
                <MessageSquare size={13} /> Nachricht
              </button>
            )}
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.83rem', ...(isSelf ? { flex: 1 } : {}) }}
              onClick={() => {}}
              title="Profil ansehen"
            >
              <ExternalLink size={13} /> Profil
            </button>
          </div>
        </div>
      );
    })()}
    </>
  );
}
