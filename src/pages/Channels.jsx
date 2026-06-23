import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { triggerRewardEvent } from '../lib/rewardEvents';
import { GERMAN_UNIVERSITIES, findUniversity, getLogoUrl } from '../lib/universities';
import CertificateBadges from '../components/CertificateBadges';
import { useTranslation } from 'react-i18next';

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

  CREATE POLICY "Students can create their university channel." ON public.channels
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND name LIKE 'uni-%'
    AND name = 'uni-' || lower(regexp_replace(
      (SELECT university FROM public.profiles WHERE id = auth.uid()),
      '[^a-z0-9]+', '-', 'g'
    ))
  );
*/

const MESSAGES_LIMIT = 150;
const POLL_INTERVAL_MS = 3000;

// ── helpers ────────────────────────────────────────────────────────────────

function normalizeUni(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function chanIcon(name = '') {
  if (name.startsWith('dm-')) return 'chat_bubble';
  if (name.startsWith('uni-')) return 'school';
  if (name.includes('embedded') || name.includes('microcontroller')) return 'memory';
  if (name.includes('hardware') || name.includes('pcb')) return 'developer_board';
  if (name.includes('energie') || name.includes('power')) return 'bolt';
  if (name.includes('auto')) return 'settings_input_component';
  if (name.includes('elektro') || name.includes('electric')) return 'electrical_services';
  if (name.includes('hf') || name.includes('frequenz') || name.includes('signal')) return 'graphic_eq';
  if (name.includes('software') || name.includes('program')) return 'code';
  if (name.includes('general') || name.includes('allgemein')) return 'forum';
  if (name.includes('job') || name.includes('intern') || name.includes('career') || name.includes('career') || name.includes('praktik')) return 'work';
  if (name.includes('announce') || name.includes('news') || name.includes('ankündig')) return 'campaign';
  return 'tag';
}

function chanIconBg(name = '') {
  if (name.startsWith('uni-')) return 'var(--ch-blue-tint)';
  if (name.includes('embedded') || name.includes('hardware') || name.includes('elektro') || name.includes('hf')) return 'var(--ch-indigo-tint)';
  if (name.includes('job') || name.includes('intern') || name.includes('praktik')) return 'var(--ch-amber-tint)';
  return 'var(--ch-brand-tint)';
}

function chanIconColor(name = '') {
  if (name.startsWith('uni-')) return 'var(--ch-blue)';
  if (name.includes('embedded') || name.includes('hardware') || name.includes('elektro') || name.includes('hf')) return 'var(--ch-indigo)';
  if (name.includes('job') || name.includes('intern') || name.includes('praktik')) return 'var(--ch-amber)';
  return 'var(--ch-brand)';
}

function displayName(ch, t) {
  if (!ch) return '';
  const n = ch.name || '';
  if (n.startsWith('uni-')) return n.slice(4).replace(/-/g, ' ');
  if (n.startsWith('dm-')) return t('channels.dm');
  return n.replace(/-/g, ' ');
}

function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function avatarStyle(name = '', size = 36) {
  const colors = ['#6D5BD0', '#2A6FDB', '#1F8A5B', '#C2410C', '#E2001A', '#5B616E'];
  const idx = name.charCodeAt(0) % colors.length;
  const r = Math.min(size * 0.3, 10);
  return {
    width: size, height: size, borderRadius: r,
    background: colors[idx], color: '#fff',
    fontFamily: "'Barlow Semi Condensed', sans-serif",
    fontWeight: 700, fontSize: size * 0.38,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };
}

function groupChannels(channels, t) {
  const unis = channels.filter(c => c.name.startsWith('uni-'));
  const rest = channels.filter(c => !c.name.startsWith('dm-') && !c.name.startsWith('uni-'));
  const groups = [];
  if (unis.length) groups.push({ id: 'uni', label: t('channels.group_uni'), icon: 'school', color: 'var(--ch-blue)', channels: unis });
  if (rest.length) groups.push({ id: 'topic', label: t('channels.group_topic'), icon: 'tag', color: 'var(--ch-text-3)', channels: rest });
  return groups;
}

const STATUS_LABEL = { student: 'Student', intern: 'Intern', working_student: 'Working Student', employee: 'Mitarbeiter' };

// ── component ───────────────────────────────────────────────────────────────

export default function Channels() {
  const navigate = useNavigate();

  // Supabase state
  const [activeChannel, setActiveChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [announce, setAnnounce] = useState(false);
  const [threadMsgId, setThreadMsgId] = useState(null);
  const [threadReply, setThreadReply] = useState('');
  const [localReactions, setLocalReactions] = useState({}); // msgId → {emoji: count}
  const [localThreads, setLocalThreads] = useState({});    // msgId → [{author, text, time}]
  const [hoverCard, setHoverCard] = useState(null);

  // Modal (create channel)
  const [showModal, setShowModal] = useState(false);
  const [genericName, setGenericName] = useState('');
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const hoverTimeoutRef = useRef(null);
  const { t } = useTranslation();

  // ── init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCurrentUser();
    fetchChannels();
  }, []);

  // Auto-create the user's university channel on first visit
  useEffect(() => {
    if (!currentUser || loading) return;
    ensureUniChannel(currentUser, channels);
  }, [currentUser, loading]);

  useEffect(() => {
    if (!isLoadingMoreRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!activeChannel) return;
    setMessages([]);
    setHasMore(false);
    setActiveTab('chat');
    setThreadMsgId(null);
    setShowAdminMenu(false);
    lastTimestampRef.current = null;
    fetchMessages(activeChannel.id);

    const sub = supabase
      .channel(`ch:${activeChannel.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannel.id}` }, async (payload) => {
        const { data } = await supabase.from('messages')
          .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
          .eq('id', payload.new.id).single();
        if (data) {
          lastTimestampRef.current = data.created_at;
          setMessages(prev => {
            const arr = prev.filter(m => !(String(m.id).startsWith('temp-') && m.content === data.content));
            if (arr.some(m => m.id === data.id)) return arr;
            return [...arr, data];
          });
        }
      }).subscribe();

    const poll = setInterval(async () => {
      if (!lastTimestampRef.current) return;
      const { data } = await supabase.from('messages')
        .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
        .eq('channel_id', activeChannel.id)
        .gt('created_at', lastTimestampRef.current)
        .order('created_at', { ascending: true });
      if (data?.length) {
        lastTimestampRef.current = data[data.length - 1].created_at;
        setMessages(prev => {
          let arr = [...prev];
          data.forEach(m => {
            arr = arr.filter(x => !(String(x.id).startsWith('temp-') && x.content === m.content));
            if (!arr.some(x => x.id === m.id)) arr.push(m);
          });
          return arr;
        });
      }
    }, POLL_INTERVAL_MS);

    return () => { supabase.removeChannel(sub); clearInterval(poll); };
  }, [activeChannel]);

  // ── data ────────────────────────────────────────────────────────────────

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
      const first = data.find(c => !c.name.startsWith('dm-'));
      if (first) setActiveChannel(first);
    }
    setLoading(false);
  };

  const ensureUniChannel = async (user, currentChannels) => {
    if (!user?.university) return;
    const uniName = `uni-${normalizeUni(user.university)}`;

    // Already visible in the list — nothing to do
    if (currentChannels.some(c => c.name === uniName)) return;

    // Try to create it (idempotent: unique constraint on name means a duplicate silently fails)
    const { data: inserted } = await supabase
      .from('channels')
      .insert({ name: uniName, description: user.university })
      .select()
      .single();

    if (inserted) {
      setChannels(prev => [...prev, inserted]);
      return;
    }

    // Channel already existed but wasn't returned (e.g. created by someone else) — fetch it directly
    const { data: existing } = await supabase
      .from('channels').select('*').eq('name', uniName).single();
    if (existing) {
      setChannels(prev => prev.some(c => c.id === existing.id) ? prev : [...prev, existing]);
    }
  };

  const fetchMessages = async (channelId) => {
    const { data, error } = await supabase.from('messages')
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
    const { data } = await supabase.from('messages')
      .select('*, profiles(first_name, last_name, role, university, degree, semester, bio, status)')
      .eq('channel_id', activeChannel.id)
      .lt('created_at', messages[0].created_at)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);
    if (data) {
      setMessages(prev => [...data.reverse(), ...prev]);
      setHasMore(data.length === MESSAGES_LIMIT);
    }
    setLoadingMore(false);
    setTimeout(() => { isLoadingMoreRef.current = false; }, 50);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return;
    const content = newMessage.trim();
    setNewMessage('');
    const tempId = 'temp-' + Date.now();
    const me = currentUser;
    setMessages(prev => [...prev, {
      id: tempId, channel_id: activeChannel.id, user_id: 'pending', content,
      created_at: new Date().toISOString(),
      profiles: { first_name: me?.first_name || t('channels.you'), last_name: me?.last_name || '', role: me?.role },
    }]);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessages(prev => prev.filter(m => m.id !== tempId)); return; }
    await supabase.from('messages').insert([{ channel_id: activeChannel.id, user_id: user.id, content }]);
    
    // Trigger Gamification Event (Fire & Forget to ensure Graceful Degradation)
    triggerRewardEvent('message_sent', { userId: user.id });
  };

  const createChannel = async () => {
    if (!genericName.trim() || creating) return;
    setCreating(true);
    const name = genericName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('channels').insert({ name }).select().single();
    setCreating(false);
    if (error) { alert(t('channels.err_create_channel')); return; }
    setChannels(prev => [...prev, data]);
    setActiveChannel(data);
    setShowModal(false);
    setGenericName('');
  };

  // ── reactions & threads (client-side) ──────────────────────────────────

  const toggleReaction = (msgId, emoji) => {
    setLocalReactions(prev => {
      const key = `${msgId}:${emoji}`;
      const cur = prev[key] || { count: 0, mine: false };
      return { ...prev, [key]: { count: cur.mine ? cur.count - 1 : cur.count + 1, mine: !cur.mine } };
    });
  };

  const addThreadReply = () => {
    if (!threadReply.trim() || !threadMsgId) return;
    const name = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : t('channels.you');
    const reply = { author: name, text: threadReply.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setLocalThreads(prev => ({ ...prev, [threadMsgId]: [...(prev[threadMsgId] || []), reply] }));
    setThreadReply('');
  };

  // ── hover card ─────────────────────────────────────────────────────────

  const showHoverCard = (e, msg) => {
    if (String(msg.id).startsWith('temp-') || !msg.profiles) return;
    clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverCard({
      userId: msg.user_id, profile: msg.profiles,
      position: { top: Math.min(rect.bottom + 8, window.innerHeight - 300), left: Math.min(rect.left, window.innerWidth - 300) },
    });
  };
  const hideHoverCard = () => { hoverTimeoutRef.current = setTimeout(() => setHoverCard(null), 180); };
  const keepHoverCard = () => clearTimeout(hoverTimeoutRef.current);

  // ── derived ────────────────────────────────────────────────────────────

  const isAdmin = currentUser?.role === 'admin';
  const q = searchQuery.trim().toLowerCase();

  const visibleChannels = channels.filter(ch => {
    if (ch.name.startsWith('dm-')) return false;
    if (q && !ch.name.toLowerCase().includes(q)) return false;
    if (!ch.name.startsWith('uni-')) return true;
    if (isAdmin) return true;
    return normalizeUni(currentUser?.university) === ch.name.slice(4);
  });

  const groups = groupChannels(visibleChannels, t);

  const threadMsg = threadMsgId ? messages.find(m => m.id === threadMsgId) : null;
  const threadReplies = threadMsgId ? (localThreads[threadMsgId] || []) : [];

  const activeName = activeChannel ? displayName(activeChannel, t) : 'Channels';
  const activeIcon = activeChannel ? chanIcon(activeChannel.name) : 'tag';
  const activeIconBg = activeChannel ? chanIconBg(activeChannel.name) : 'var(--ch-brand-tint)';
  const activeIconColor = activeChannel ? chanIconColor(activeChannel.name) : 'var(--ch-brand)';
  const isUni = activeChannel?.name?.startsWith('uni-');

  // ── quick emoji set ────────────────────────────────────────────────────
  const QUICK_EMOJI = ['👍', '🙏', '🔥', '🎉'];

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Inject scoped CSS variables + utility classes */}
      <style>{`
        :root {
          --ch-brand: #E2001A; --ch-brand-2: #B80016; --ch-brand-tint: #FDECEE;
          --ch-blue: #2A6FDB; --ch-blue-tint: #E8F0FD;
          --ch-green: #1F8A5B; --ch-amber: #C2410C; --ch-amber-tint: rgba(194,65,12,.1);
          --ch-indigo: #6D5BD0; --ch-indigo-tint: rgba(109,91,208,.1);
          --ch-text-3: #9097A3;
        }
        [data-theme="dark"] {
          --ch-brand: #FF2138; --ch-brand-2: #FF4759; --ch-brand-tint: rgba(255,33,56,.12);
          --ch-blue: #5B9BFF; --ch-blue-tint: rgba(91,155,255,.12);
          --ch-green: #46C08A; --ch-amber: #E97A3C; --ch-amber-tint: rgba(233,122,60,.12);
          --ch-indigo: #9b8cf0; --ch-indigo-tint: rgba(155,140,240,.12);
          --ch-text-3: #6B7280;
        }
        .ms{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;direction:ltr;font-variation-settings:'FILL' 0,'wght' 500,'GRAD' 0,'opsz' 24;-webkit-font-feature-settings:'liga';font-feature-settings:'liga'}
        .ms.fill{font-variation-settings:'FILL' 1,'wght' 500,'GRAD' 0,'opsz' 24}
        .disp{font-family:'Barlow Semi Condensed','Barlow',sans-serif}
        .ch-scroll{scrollbar-width:thin;scrollbar-color:var(--border-color) transparent}
        .ch-scroll::-webkit-scrollbar{width:8px}
        .ch-scroll::-webkit-scrollbar-thumb{background:var(--border-color);border-radius:20px;border:2px solid transparent;background-clip:content-box}
        .ch-row:hover .ch-hover-actions{opacity:1;transform:translateY(0)}
        .ch-hover-actions{opacity:0;transform:translateY(-2px);transition:opacity .12s,transform .12s;pointer-events:none}
        .ch-row:hover .ch-hover-actions{pointer-events:auto}
        .ch-row:hover{background:var(--bg-tertiary) !important}
        .ch-sidebar-row:hover{background:var(--bg-tertiary)}
        .ch-icon-btn:hover{background:var(--bg-tertiary)}
        .ch-send-btn:hover{background:var(--ch-brand-2) !important}
        .ch-reaction-btn:hover{border-color:var(--ch-brand) !important;color:var(--ch-brand) !important}
        .ch-tab:hover{color:var(--text-primary) !important}
        .ch-admin-action:hover{border-color:var(--ch-brand)}
        .ch-msg-action:hover{background:var(--bg-tertiary)}
        .ch-channel-link:hover{background:var(--bg-tertiary)}
        @keyframes ch-fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ch-slideL{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes ch-pop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
      `}</style>

      <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 90px)', maxWidth: 1440, margin: '0 auto', padding: '0 0 14px' }}>

        {/* ===== SIDEBAR ===== */}
        <aside style={{
          width: 280, flexShrink: 0,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 16, boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '14px 14px 10px', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <span className="ms" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--text-muted)' }}>search</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('channels.search_placeholder')}
                style={{
                  width: '100%', height: 40, border: '1px solid var(--border-color)',
                  background: 'var(--bg-tertiary)', borderRadius: 11,
                  padding: '0 12px 0 38px', fontSize: 14, color: 'var(--text-primary)', outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--ch-brand)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  marginTop: 10, width: '100%', height: 40,
                  border: '1px dashed var(--border-hover)', background: 'transparent',
                  borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  fontFamily: "'Barlow Semi Condensed', sans-serif", transition: 'all .15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--ch-brand)'; e.currentTarget.style.color = 'var(--ch-brand)'; e.currentTarget.style.background = 'var(--ch-brand-tint)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="ms" style={{ fontSize: 18 }}>add</span>
                <span>{t('channels.btn_new_channel')}</span>
              </button>
            )}
          </div>

          {/* Channels */}
          <div className="ch-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <span className="ms" style={{ fontSize: 24 }}>hourglass_empty</span>
              </div>
            ) : (
              <>
                {/* Trending strip */}
                {!q && channels.length >= 3 && (
                  <div style={{ margin: '4px 2px 8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', borderRadius: 13, padding: '10px 10px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 4px 6px' }}>
                      <span className="ms fill" style={{ fontSize: 16, color: 'var(--ch-amber)' }}>local_fire_department</span>
                      <span className="disp" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{t('channels.trending')}</span>
                    </div>
                    {channels.filter(c => !c.name.startsWith('dm-')).slice(0, 3).map((ch, i) => (
                      <button key={ch.id} onClick={() => { setActiveChannel(ch); setSearchQuery(''); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', borderRadius: 9, cursor: 'pointer',
                          background: 'transparent', border: 'none', textAlign: 'left',
                          transition: 'background .12s',
                        }}
                        className="ch-channel-link"
                      >
                        <span className="disp" style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-muted)', width: 14, textAlign: 'center' }}>{i + 1}</span>
                        <span className="disp" style={{ fontWeight: 600, fontSize: 14, color: activeChannel?.id === ch.id ? 'var(--ch-brand)' : 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName(ch, t)}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--ch-amber)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          <span className="ms fill" style={{ fontSize: 13 }}>local_fire_department</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Channel groups */}
                {groups.map(g => (
                  <div key={g.id} style={{ marginTop: 8 }}>
                    <button
                      onClick={() => setCollapsedGroups(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                        padding: '6px 8px', background: 'transparent', border: 'none',
                        cursor: 'pointer', color: 'var(--text-muted)',
                      }}
                    >
                      <span className="ms" style={{ fontSize: 15, transition: 'transform .15s', transform: collapsedGroups[g.id] ? 'rotate(0deg)' : 'rotate(90deg)' }}>chevron_right</span>
                      <span className="ms" style={{ fontSize: 15, color: g.color }}>{ g.icon}</span>
                      <span className="disp" style={{ fontWeight: 700, fontSize: 11, letterSpacing: '.7px', textTransform: 'uppercase', flex: 1, textAlign: 'left', color: 'var(--text-secondary)' }}>{g.label}</span>
                    </button>

                    {!collapsedGroups[g.id] && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 2 }}>
                        {g.channels.map(ch => {
                          const isAct = activeChannel?.id === ch.id;
                          return (
                            <button key={ch.id} onClick={() => setActiveChannel(ch)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                                background: isAct ? 'var(--ch-brand-tint)' : 'transparent',
                                border: 'none', textAlign: 'left', transition: 'background .12s', width: '100%',
                              }}
                              className="ch-sidebar-row"
                            >
                              <span className="ms" style={{ fontSize: 17, color: isAct ? 'var(--ch-brand)' : 'var(--text-muted)', flexShrink: 0 }}>{chanIcon(ch.name)}</span>
                              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                                <span className="disp" style={{ fontWeight: isAct ? 700 : 600, fontSize: 14.5, color: isAct ? 'var(--ch-brand)' : 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {displayName(ch, t)}
                                </span>
                                {ch.description && (
                                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {ch.description}
                                  </span>
                                )}
                              </div>
                              {isUni && ch.name.startsWith('uni-') && (
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ch-brand)', flexShrink: 0 }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {visibleChannels.length === 0 && !loading && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 12px' }}>{t('channels.no_channels')}</p>
                )}
              </>
            )}
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <main style={{
          flex: 1, minWidth: 0,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 16, boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Channel header */}
          <div style={{ flexShrink: 0, padding: '14px 18px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: activeIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="ms fill" style={{ fontSize: 22, color: activeIconColor }}>{activeIcon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="disp" style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeName}
                  </span>
                  {isUni && (
                    <span style={{ height: 20, padding: '0 8px', borderRadius: 6, background: 'var(--ch-blue-tint)', color: 'var(--ch-blue)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', letterSpacing: '.3px' }}>
                      {t('channels.badge_university')}
                    </span>
                  )}
                </div>
                {activeChannel?.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeChannel.description}
                  </div>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowAdminMenu(v => !v)}
                  className="ch-icon-btn"
                  style={{ width: 38, height: 38, borderRadius: 9, border: '1px solid var(--border-color)', background: showAdminMenu ? 'var(--ch-brand-tint)' : 'var(--bg-secondary)', color: showAdminMenu ? 'var(--ch-brand)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s', flexShrink: 0 }}
                >
                  <span className="ms" style={{ fontSize: 20 }}>settings</span>
                </button>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 12 }}>
              {[
                { id: 'chat', icon: 'forum', label: t('channels.tab_chat') },
                { id: 'members', icon: 'group', label: t('channels.tab_members') },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="ch-tab"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, height: 34,
                    padding: '0 12px', border: 'none', background: 'transparent',
                    borderBottom: `2px solid ${activeTab === t.id ? 'var(--ch-brand)' : 'transparent'}`,
                    borderRadius: '9px 9px 0 0', cursor: 'pointer', fontFamily: 'inherit',
                    color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    transition: 'color .12s',
                  }}
                >
                  <span className="ms" style={{ fontSize: 16 }}>{t.icon}</span>
                  <span className="disp" style={{ fontWeight: 600, fontSize: 14 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin manage strip */}
          {showAdminMenu && isAdmin && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--ch-brand-tint)', borderBottom: '1px solid var(--border-color)', animation: 'ch-fadeUp .18s', flexWrap: 'wrap' }}>
              <span className="ms fill" style={{ fontSize: 17, color: 'var(--ch-brand)' }}>shield</span>
              <span className="disp" style={{ fontWeight: 700, fontSize: 13, color: 'var(--ch-brand)', marginRight: 4 }}>{t('channels.admin_manage')}</span>
              {[
                { icon: 'edit', label: t('channels.admin_edit') },
                { icon: 'group_add', label: t('channels.tab_members') },
                { icon: 'push_pin', label: t('channels.admin_pin') },
                { icon: 'archive', label: t('channels.admin_archive') },
              ].map(a => (
                <button key={a.label}
                  className="ch-admin-action"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .12s' }}
                >
                  <span className="ms" style={{ fontSize: 15 }}>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <>
              <div className="ch-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 6px 12px' }}>
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                    <button onClick={loadMoreMessages} disabled={loadingMore}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px', borderRadius: 9, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <span className="ms" style={{ fontSize: 16 }}>expand_less</span>
                      {loadingMore ? t('channels.loading') : t('channels.btn_load_more')}
                    </button>
                  </div>
                )}

                {messages.length === 0 && !loading && (
                  <div style={{ height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40, animation: 'ch-fadeUp .3s' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: activeIconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <span className="ms fill" style={{ fontSize: 36, color: activeIconColor }}>{activeIcon}</span>
                    </div>
                    <div className="disp" style={{ fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>
                      {t('channels.welcome_to')}{activeName}
                    </div>
                    <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', maxWidth: 340, marginTop: 8, lineHeight: 1.5 }}>
                      {activeChannel?.description || t('channels.welcome_desc')}
                    </div>
                    <button onClick={() => composerRef.current?.focus()}
                      style={{ marginTop: 18, height: 42, padding: '0 20px', borderRadius: 11, border: 'none', background: 'var(--ch-brand)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--ch-brand-2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'var(--ch-brand)'}
                    >
                      <span className="ms" style={{ fontSize: 18 }}>edit</span>
                      <span className="disp">{t('channels.btn_write_first')}</span>
                    </button>
                  </div>
                )}

                {/* Date divider */}
                {messages.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px 6px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.4px' }}>{t('channels.today')}</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
                  </div>
                )}

                {/* Messages */}
                {messages.map(msg => {
                  const isTemp = String(msg.id).startsWith('temp-');
                  const p = msg.profiles;
                  const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : 'Unknown';
                  const ini = initials(name) || '?';
                  const avStyle = { ...avatarStyle(name, 40), borderRadius: '50%' };
                  const isSpecialist = p?.role === 'specialist';
                  const isAdminRole = p?.role === 'admin';
                  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const msgReactions = QUICK_EMOJI.map(e => {
                    const key = `${msg.id}:${e}`;
                    const lr = localReactions[key];
                    return lr && lr.count > 0 ? { e, count: lr.count, mine: lr.mine } : null;
                  }).filter(Boolean);
                  const threads = localThreads[msg.id] || [];

                  return (
                    <div key={msg.id} className="ch-row"
                      style={{ position: 'relative', display: 'flex', gap: 13, padding: '8px 16px', borderRadius: 12, margin: '1px 6px', opacity: isTemp ? 0.6 : 1, animation: isTemp ? 'none' : 'ch-fadeUp .2s', transition: 'background .12s' }}
                    >
                      {/* Avatar */}
                      <div
                        style={{ ...avStyle, cursor: isTemp ? 'default' : 'pointer', flexShrink: 0 }}
                        onMouseEnter={e => !isTemp && showHoverCard(e, msg)}
                        onMouseLeave={hideHoverCard}
                      >
                        {p?.avatar_url
                          ? <img src={p.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : ini
                        }
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span className="disp"
                            style={{ fontWeight: 700, fontSize: 15, color: isSpecialist ? 'var(--ch-brand)' : 'var(--text-primary)', cursor: isTemp ? 'default' : 'pointer' }}
                            onMouseEnter={e => !isTemp && showHoverCard(e, msg)}
                            onMouseLeave={hideHoverCard}
                          >
                            {name}
                          </span>
                          {isSpecialist && (
                            <span style={{ height: 17, padding: '0 7px', borderRadius: 5, background: 'var(--ch-brand-tint)', color: 'var(--ch-brand)', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                              {t('channels.badge_specialist')}
                            </span>
                          )}
                          {isAdminRole && (
                            <span style={{ height: 17, padding: '0 7px', borderRadius: 5, background: 'rgba(226,0,26,.08)', color: 'var(--ch-brand)', fontSize: 10.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                              {t('channels.badge_admin')}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{time}</span>
                        </div>

                        <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.content}
                        </div>

                        {/* Reactions */}
                        {msgReactions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                            {msgReactions.map(r => (
                              <button key={r.e} onClick={() => toggleReaction(msg.id, r.e)}
                                className="ch-reaction-btn"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  height: 26, padding: '0 9px', borderRadius: 13,
                                  cursor: 'pointer', border: `1px solid ${r.mine ? 'var(--ch-brand)' : 'var(--border-color)'}`,
                                  background: r.mine ? 'var(--ch-brand-tint)' : 'var(--bg-secondary)',
                                  color: r.mine ? 'var(--ch-brand)' : 'var(--text-secondary)',
                                  transition: 'all .12s', fontFamily: 'inherit',
                                }}
                              >
                                <span style={{ fontSize: 14 }}>{r.e}</span>
                                <span style={{ fontWeight: 700, fontSize: 12 }}>{r.count}</span>
                              </button>
                            ))}
                            <button onClick={() => toggleReaction(msg.id, '👍')}
                              className="ch-reaction-btn"
                              style={{ width: 30, height: 26, borderRadius: 13, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .12s' }}
                            >
                              <span className="ms" style={{ fontSize: 15 }}>add_reaction</span>
                            </button>
                          </div>
                        )}

                        {/* Thread preview */}
                        {threads.length > 0 && (
                          <button onClick={() => setThreadMsgId(msg.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 7, padding: '5px 10px 5px 6px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span className="disp" style={{ fontWeight: 700, fontSize: 13, color: 'var(--ch-brand)' }}>{threads.length} {threads.length === 1 ? 'Antwort' : 'Antworten'}</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>zuletzt {threads[threads.length - 1].time}</span>
                            <span className="ms" style={{ fontSize: 15, color: 'var(--text-muted)' }}>chevron_right</span>
                          </button>
                        )}
                      </div>

                      {/* Hover action bar */}
                      {!isTemp && (
                        <div className="ch-hover-actions" style={{ position: 'absolute', top: -12, right: 14, display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, boxShadow: 'var(--shadow-md)', padding: 3 }}>
                          {QUICK_EMOJI.slice(0, 3).map(e => (
                            <button key={e} onClick={() => toggleReaction(msg.id, e)}
                              className="ch-msg-action"
                              style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s' }}
                            >{e}</button>
                          ))}
                          <button onClick={() => setThreadMsgId(msg.id)} title="Antworten"
                            className="ch-msg-action"
                            style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s' }}
                          >
                            <span className="ms" style={{ fontSize: 17 }}>reply</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div style={{ flexShrink: 0, padding: '0 16px 16px' }}>
                {isAdmin && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, margin: '0 0 9px 4px', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    <span onClick={() => setAnnounce(v => !v)}
                      style={{ display: 'inline-flex', alignItems: 'center', width: 34, height: 20, borderRadius: 11, padding: 2, background: announce ? 'var(--ch-brand)' : 'var(--border-color)', transition: 'background .15s', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', transform: `translateX(${announce ? '14px' : '0'})`, transition: 'transform .15s', display: 'block' }} />
                    </span>
                    <span className="ms" style={{ fontSize: 15, color: 'var(--ch-amber)' }}>campaign</span>
                    Als Ankündigung anpinnen
                  </label>
                )}
                <div
                  style={{ display: 'flex', alignItems: 'flex-end', gap: 10, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', borderRadius: 14, padding: '8px 8px 8px 6px', transition: 'border-color .15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--ch-brand)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <button style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                    className="ch-icon-btn"
                    title="Anhang"
                  >
                    <span className="ms" style={{ fontSize: 20 }}>attach_file</span>
                  </button>
                  <textarea
                    ref={composerRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    rows={1}
                    placeholder={`Nachricht an #${activeName} …`}
                    style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: 15, lineHeight: 1.5, color: 'var(--text-primary)', maxHeight: 120, padding: '9px 0', fontFamily: 'inherit' }}
                  />
                  <button style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .12s' }}
                    className="ch-icon-btn"
                    title="Emoji"
                  >
                    <span className="ms" style={{ fontSize: 20 }}>mood</span>
                  </button>
                  <button onClick={sendMessage}
                    className="ch-send-btn"
                    style={{ width: 42, height: 42, borderRadius: 11, border: 'none', background: newMessage.trim() ? 'var(--ch-brand)' : 'var(--border-color)', color: '#fff', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}
                  >
                    <span className="ms" style={{ fontSize: 20 }}>send</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="ch-scroll" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div className="disp" style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--text-primary)' }}>Mitglieder</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--text-secondary)', fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 11, background: 'var(--bg-tertiary)' }}>
                  <span className="ms" style={{ fontSize: 20, color: 'var(--text-muted)' }}>group</span>
                  Mitgliederdaten werden über Profile geladen.
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ===== THREAD PANEL ===== */}
        {threadMsgId && threadMsg && (
          <aside style={{
            width: 310, flexShrink: 0,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 16, boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            animation: 'ch-slideL .2s',
          }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <span className="ms" style={{ fontSize: 19, color: 'var(--text-secondary)' }}>forum</span>
              <span className="disp" style={{ fontWeight: 700, fontSize: 16, flex: 1, color: 'var(--text-primary)' }}>Thread</span>
              <button onClick={() => setThreadMsgId(null)}
                className="ch-icon-btn"
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}
              >
                <span className="ms" style={{ fontSize: 19 }}>close</span>
              </button>
            </div>

            <div className="ch-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
              {/* Parent message */}
              <div style={{ display: 'flex', gap: 11, paddingBottom: 14, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ ...avatarStyle((threadMsg.profiles ? `${threadMsg.profiles.first_name} ${threadMsg.profiles.last_name}`.trim() : 'U'), 38), borderRadius: '50%', flexShrink: 0 }}>
                  {initials(threadMsg.profiles ? `${threadMsg.profiles.first_name} ${threadMsg.profiles.last_name}`.trim() : 'U') || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    {!isTemp && <CertificateBadges profile={msg.profiles} max={3} />}
                    <span onMouseEnter={e => !isTemp && showHoverCard(e, msg)} onMouseLeave={hideHoverCard} style={{ fontWeight: 600, fontSize: '1rem', color: isSpecialist ? 'var(--accent-red)' : 'var(--text-primary)', cursor: isTemp ? 'default' : 'pointer' }}>
                      {name}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {new Date(threadMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{threadMsg.content}</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, padding: '12px 2px 8px' }}>
                {threadReplies.length} {threadReplies.length === 1 ? 'Antwort' : 'Antworten'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {threadReplies.map((r, i) => {
                  const meN = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : 'Du';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 11, animation: 'ch-fadeUp .18s' }}>
                      <div style={{ ...avatarStyle(r.author, 34), borderRadius: '50%', flexShrink: 0 }}>
                        {initials(r.author) || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                          <span className="disp" style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{r.author}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.time}</span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{r.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thread composer */}
            <div style={{ flexShrink: 0, padding: '12px 14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', borderRadius: 12, padding: '4px 4px 4px 12px', transition: 'border-color .15s' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--ch-brand)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <input
                  value={threadReply}
                  onChange={e => setThreadReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addThreadReply(); } }}
                  placeholder="Antworten…"
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: 'var(--text-primary)', padding: '8px 0', fontFamily: 'inherit' }}
                />
                <button onClick={addThreadReply}
                  style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: threadReply.trim() ? 'var(--ch-brand)' : 'var(--border-color)', color: '#fff', cursor: threadReply.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s', flexShrink: 0 }}
                >
                  <span className="ms" style={{ fontSize: 17 }}>send</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ===== CREATE CHANNEL MODAL ===== */}
      {showModal && (
        <div
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div style={{ width: '100%', maxWidth: 400, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 18, boxShadow: '0 32px 80px rgba(0,0,0,.5)', animation: 'ch-pop .22s' }}>
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="disp" style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>Neuer Channel</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Channel zum Netzwerk hinzufügen</div>
              </div>
              <button onClick={() => setShowModal(false)}
                className="ch-icon-btn"
                style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s' }}
              >
                <span className="ms" style={{ fontSize: 19 }}>close</span>
              </button>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Channel-Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span className="ms" style={{ position: 'absolute', left: 12, fontSize: 18, color: 'var(--text-muted)' }}>tag</span>
                  <input
                    autoFocus
                    type="text"
                    value={genericName}
                    onChange={e => setGenericName(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && genericName.trim() && createChannel()}
                    placeholder="z.B. ankündigungen"
                    style={{ width: '100%', height: 44, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', borderRadius: 11, padding: '0 14px 0 38px', fontSize: 15, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = 'var(--ch-brand)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
                {genericName && (
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    Wird erstellt als <span style={{ color: 'var(--ch-brand)', fontWeight: 600 }}>#{genericName}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: 42, borderRadius: 11, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  Abbrechen
                </button>
                <button onClick={createChannel} disabled={!genericName.trim() || creating}
                  style={{ flex: 1, height: 42, borderRadius: 11, border: 'none', background: genericName.trim() ? 'var(--ch-brand)' : 'var(--border-color)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: genericName.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background .15s' }}
                  onMouseOver={e => { if (genericName.trim()) e.currentTarget.style.background = 'var(--ch-brand-2)'; }}
                  onMouseOut={e => { if (genericName.trim()) e.currentTarget.style.background = 'var(--ch-brand)'; }}
                >
                  {creating ? 'Erstelle…' : 'Channel erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HOVER PROFILE CARD ===== */}
      {hoverCard && (() => {
        const p = hoverCard.profile;
        const uniData = p.university ? findUniversity(p.university) : null;
        const uniLogoUrl = uniData ? getLogoUrl(uniData.domain) : null;
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        const ini = initials(name) || '?';
        const isSelf = hoverCard.userId === currentUser?.authId;
        const isSpec = p.role === 'specialist';
        const isAdm = p.role === 'admin';
        const avS = { ...avatarStyle(name, 54), borderRadius: '50%', border: '3px solid var(--bg-secondary)' };

        return (
          <div
            onMouseEnter={keepHoverCard}
            onMouseLeave={hideHoverCard}
            style={{ position: 'fixed', top: hoverCard.position.top, left: hoverCard.position.left, width: 290, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,.4)', zIndex: 1000, overflow: 'hidden', animation: 'ch-pop .18s' }}
          >
            <div style={{ position: 'relative', height: 60, background: 'var(--gradient-primary)', flexShrink: 0 }}>
              {uniLogoUrl && <img src={uniLogoUrl} alt="" onError={e => e.target.style.display = 'none'} style={{ position: 'absolute', right: 12, top: 10, width: 28, height: 28, objectFit: 'contain', opacity: .3 }} />}
              <div style={{ position: 'absolute', left: 18, bottom: -27, ...avS }}>{ini}</div>
            </div>
            <div style={{ padding: '6px 18px 0', display: 'flex', justifyContent: 'flex-end', gap: 5, minHeight: 32, flexWrap: 'wrap' }}>
              {isSpec && <span style={{ height: 18, padding: '0 7px', borderRadius: 5, background: 'var(--ch-brand-tint)', color: 'var(--ch-brand)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', fontFamily: "'Barlow Semi Condensed',sans-serif" }}>Specialist</span>}
              {isAdm && <span style={{ height: 18, padding: '0 7px', borderRadius: 5, background: 'var(--ch-blue-tint)', color: 'var(--ch-blue)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', fontFamily: "'Barlow Semi Condensed',sans-serif" }}>Admin</span>}
              {p.status && <span style={{ height: 18, padding: '0 7px', borderRadius: 5, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', fontFamily: "'Barlow Semi Condensed',sans-serif" }}>{STATUS_LABEL[p.status] || p.status}</span>}
            </div>
            <div style={{ padding: '10px 18px 12px' }}>
              <div className="disp" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.2 }}>{name || 'Unbekannt'}</div>
            </div>
            {(p.university || p.degree || p.bio) && (
              <div style={{ margin: '0 18px 14px', padding: '12px 14px', background: 'var(--bg-primary)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {p.university && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    {uniLogoUrl ? <img src={uniLogoUrl} alt="" onError={e => e.target.style.display = 'none'} style={{ width: 15, height: 15, objectFit: 'contain', flexShrink: 0 }} /> : <span className="ms fill" style={{ fontSize: 14, color: 'var(--ch-brand)', flexShrink: 0 }}>school</span>}
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.university}</span>
                  </div>
                )}
                {p.degree && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span className="ms" style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>school</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.degree}{p.semester ? ` · Sem. ${p.semester}` : ''}</span>
                  </div>
                )}
                {p.bio && (
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.bio}</p>
                )}
              </div>
            )}
            <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>
              {!isSelf && (
                <button onClick={() => { setHoverCard(null); navigate(`/messages?with=${hoverCard.userId}`); }}
                  style={{ flex: 1, height: 38, borderRadius: 10, border: 'none', background: 'var(--ch-brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--ch-brand-2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--ch-brand)'}
                >
                  <span className="ms" style={{ fontSize: 16 }}>chat_bubble</span> Nachricht
                </button>
              )}
              <button style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', ...(isSelf ? { flex: 1, justifyContent: 'center' } : {}) }}>
                <span className="ms" style={{ fontSize: 16 }}>person</span> Profil
              </button>
            </div>
          </div>
        );
      })()}
    </>
  );
}
