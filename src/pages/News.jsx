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
    <div className="page-content animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Neues</h1>
        <p className="page-description">The latest updates, events, and discussions.</p>
      </div>

      <div style={{ maxWidth: '800px' }}>
        {/* Create Post Input */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="input-group" style={{ marginBottom: '12px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Title..." 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <textarea 
              className="input-field" 
              placeholder="Create a new post..." 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows="3"
            />
          </div>
          <div className="flex-between">
            <button className="btn btn-secondary">
              <Calendar size={18} /> Add Event
            </button>
            <button className="btn btn-primary" onClick={handlePost}>Post</button>
          </div>
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loading ? <p>Loading posts...</p> : posts.map(post => (
            <div key={post.id} className="card">
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <span className="text-secondary text-sm">
                  {post.profiles?.first_name || 'User'} {post.profiles?.last_name || ''} • {new Date(post.created_at).toLocaleDateString()}
                </span>
                {post.type === 'event' && (
                  <span style={{ background: 'rgba(204,0,0,0.1)', color: 'var(--accent-red)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500' }}>
                    Event
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{post.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                {post.content}
              </p>
              
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ThumbsUp size={18} /> {post.likes || 0}
                </button>
                <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={18} /> 0
                </button>
                <button className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
