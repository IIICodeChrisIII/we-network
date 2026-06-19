import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function News() {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (first_name, last_name)
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Log in to post");

    const { error } = await supabase.from('posts').insert([
      { title: newTitle, content: newContent, author_id: user.id }
    ]);
    
    if (!error) {
      setNewTitle('');
      setNewContent('');
      fetchPosts();
    }
  };

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '800px' }}>
        <div className="page-header">
          <h1 className="page-title">Community Feed</h1>
          <p className="page-description">The latest updates, events, and discussions from the network.</p>
        </div>

        {/* Create Post Input */}
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

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p> : posts.map(post => {
            const initials = `${(post.profiles?.first_name || 'U')[0]}${(post.profiles?.last_name || '')[0] || ''}`.toUpperCase();
            
            return (
              <div key={post.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{post.profiles?.first_name || 'User'} {post.profiles?.last_name || ''}</h3>
                      <span className="badge badge-blue">Student</span>
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
                  <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color var(--transition-fast)' }} onClick={() => alert('Comments feature coming soon!')} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <MessageSquare size={18} /> Comment
                  </button>
                  <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color var(--transition-fast)' }} onClick={() => alert('Share feature coming soon!')} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    <Share2 size={18} /> Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
