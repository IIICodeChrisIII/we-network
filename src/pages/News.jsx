import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, Calendar, Send, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { triggerRewardEvent } from '../lib/rewardEvents';
import CertificateBadges from '../components/CertificateBadges';

export default function News() {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isChallenge, setIsChallenge] = useState(false);
  
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    fetchUserProfile();
    fetchPosts();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setCurrentUserProfile(data);
    }
  };

  const fetchPosts = async () => {
    // Try fetching with comments first
    let { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (first_name, last_name, status, role, avatar_url),
        comments (
          id,
          content,
          created_at,
          profiles (first_name, last_name, avatar_url, role)
        )
      `)
      .order('created_at', { ascending: false });
      
    // Fallback if comments table doesn't exist yet
    if (error) {
      const fallback = await supabase
        .from('posts')
        .select(`*, profiles (first_name, last_name, status, role, avatar_url)`)
        .order('created_at', { ascending: false });
      data = fallback.data;
    }
    
    if (data) {
      // Sort comments by created_at inside each post
      data = data.map(post => {
        if (post.comments) {
          post.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        return post;
      });
      setPosts(data);
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Log in to post");

    const postData = { 
      title: newTitle, 
      content: newContent, 
      author_id: user.id,
      type: isChallenge ? 'challenge' : 'news'
    };

    // Note: If setup_challenges.sql is run, we could also pass reward_nodes here.

    const { error } = await supabase.from('posts').insert([postData]);
    
    if (!error) {
      setNewTitle('');
      setNewContent('');
      setIsChallenge(false);
      fetchPosts();
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Log in to comment");

    // Optimistic UI for comments
    const optimisticComment = {
      id: 'temp-' + Date.now(),
      content: text,
      created_at: new Date().toISOString(),
      profiles: currentUserProfile
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...(p.comments || []), optimisticComment] };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));

    const { error } = await supabase.from('comments').insert([
      { post_id: postId, author_id: user.id, content: text }
    ]);

    if (!error) {
      fetchPosts(); // Refresh to get real IDs
      
      // Farm Nodes Logic: If it's a tech challenge, award nodes!
      const post = posts.find(p => p.id === postId);
      if (post && post.type === 'challenge') {
        triggerRewardEvent('challenge_solved', { userId: user.id, challengeId: postId });
      }
    } else {
      alert("Error posting comment. Did you run the SQL script?");
    }
  };

  const canPost = currentUserProfile && (currentUserProfile.status !== 'student' || currentUserProfile.role === 'startup');

  const renderAvatar = (profile, size = 48) => {
    if (profile?.avatar_url) {
      return (
        <img 
          src={profile.avatar_url} 
          alt="Avatar" 
          style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
        />
      );
    }
    const initials = `${(profile?.first_name || 'U')[0]}${(profile?.last_name || '')[0] || ''}`.toUpperCase();
    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size > 32 ? '1.1rem' : '0.85rem', color: 'var(--text-primary)' }}>
        {initials}
      </div>
    );
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <div className="page-header">
          <h1 className="page-title">Community Feed</h1>
          <p className="page-description">The latest updates, events, and discussions from the network.</p>
        </div>

        {/* Create Post Input - Hidden for students */}
        {canPost && (
          <div className="card" style={{ marginBottom: '32px', padding: '20px' }}>
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="What's on your mind?" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 500, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, paddingLeft: 0, paddingRight: 0 }}
              />
              <textarea 
                className="input-field" 
                placeholder="Add details..." 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows="2"
                style={{ background: 'transparent', border: 'none', resize: 'none', paddingLeft: 0, paddingRight: 0 }}
              />
            </div>
            <div className="flex-between">
              <button className="btn btn-secondary" style={{ borderRadius: 'var(--border-radius-pill)' }}>
                <Calendar size={16} /> Event
              </button>
              <button className="btn btn-primary" onClick={handlePost}>Post</button>
            </div>
          </div>
        )}

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p> : posts.map(post => {
            const isExpanded = expandedPost === post.id;
            const commentsCount = post.comments?.length || 0;

            return (
              <div key={post.id} className="card" style={post.type === 'challenge' ? { border: '2px solid var(--accent-red)', position: 'relative' } : {}}>
                {post.type === 'challenge' && (
                  <div style={{ position: 'absolute', top: '-12px', left: '20px', background: 'var(--accent-red)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 12px rgba(226, 0, 26, 0.3)' }}>
                    <Zap size={14} fill="#fff" />
                    TECH CHALLENGE — Lösen für 50 WE-Nodes!
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', marginTop: post.type === 'challenge' ? '12px' : '0' }}>
                  {renderAvatar(post.profiles)}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <CertificateBadges profile={post.profiles} max={3} />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{post.profiles?.first_name || 'User'} {post.profiles?.last_name || ''}</h3>
                      <span className={`badge ${post.profiles?.role === 'startup' ? 'badge-green' : (post.profiles?.status === 'employee' ? 'badge-red' : 'badge-blue')}`}>
                        {post.profiles?.role === 'startup' ? 'Startup' : (post.profiles?.status === 'employee' ? 'Mitarbeiter' : (post.profiles?.status || 'Student'))}
                      </span>
                    </div>
                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                      {new Date(post.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {post.type === 'event' && (
                    <span className="badge badge-red" style={{ marginLeft: 'auto' }}>Event</span>
                  )}
                </div>
                
                <h2 style={{ fontSize: '1.3rem', marginBottom: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{post.title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6', fontSize: '1rem' }}>
                  {post.content}
                </p>
                
                <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <ThumbsUp size={18} /> {post.likes || 0}
                  </button>
                  <button 
                    className="text-secondary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color var(--transition-fast)', color: isExpanded ? 'var(--accent-red)' : 'var(--text-secondary)' }} 
                    onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                    onMouseOver={e => e.currentTarget.style.color = isExpanded ? 'var(--accent-red)' : 'var(--text-primary)'} 
                    onMouseOut={e => e.currentTarget.style.color = isExpanded ? 'var(--accent-red)' : 'var(--text-secondary)'}
                  >
                    <MessageSquare size={18} /> {commentsCount} Comments
                  </button>
                  <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color var(--transition-fast)' }} onClick={() => alert('Share feature coming soon!')} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <Share2 size={18} /> Share
                  </button>
                </div>

                {/* Reddit-style Comments Section */}
                {isExpanded && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Comment List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                      {(!post.comments || post.comments.length === 0) ? (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No comments yet. Be the first to share your thoughts!</p>
                      ) : (
                        post.comments.map(comment => (
                          <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                            {renderAvatar(comment.profiles, 32)}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {comment.profiles?.first_name} {comment.profiles?.last_name}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '0 12px 12px 12px', display: 'inline-block' }}>
                                {comment.content}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {renderAvatar(currentUserProfile, 32)}
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                          type="text" 
                          placeholder="Write a comment..." 
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if(e.key === 'Enter') handleCommentSubmit(post.id); }}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-pill)', padding: '10px 40px 10px 16px', color: 'var(--text-primary)', outline: 'none', transition: 'border-color var(--transition-fast)' }}
                          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-red)'}
                          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        />
                        <button 
                          onClick={() => handleCommentSubmit(post.id)}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '4px' }}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}