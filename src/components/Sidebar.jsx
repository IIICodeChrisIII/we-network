import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Newspaper, MessageSquare, Briefcase, Users, User, BarChart2, LogOut, Inbox, Sun, Moon, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import weLogo from '../assets/we-logo.gif';

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Leiste beim Runterscrollen ausblenden, beim Hochscrollen wieder einblenden
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY && y > 80);
      lastY = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('first_name, last_name, role, avatar_url').eq('id', user.id).single();
      if (data) setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Feed', path: '/feed', icon: <Newspaper size={16} /> },
    { name: 'Channels', path: '/channels', icon: <MessageSquare size={16} /> },
    { name: 'Nachrichten', path: '/messages', icon: <Inbox size={16} /> },
    { name: 'Kontakte', path: '/contacts', icon: <Users size={16} /> },
    { name: 'Karriere', path: '/career', icon: <Briefcase size={16} /> },
    { name: 'Produkte', path: '/network/rewards', icon: <ShoppingBag size={16} /> },
    ...(profile && (profile.role === 'admin' || profile.role === 'analytics')
      ? [{ name: 'Analytics', path: '/admin/dashboard', icon: <BarChart2 size={16} /> }]
      : [])
  ];

  const initials = profile 
    ? `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase()
    : '?';

  return (
    <nav className={`navbar ${hidden ? 'navbar--hidden' : ''}`}>
      <NavLink to="/" className="navbar-brand">
        <img src={weLogo} className="navbar-logo" alt="Würth Elektronik" />
        <span style={{ fontWeight: 400, marginLeft: '8px' }}>Network</span>
      </NavLink>

      <div className="navbar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            end={item.path === '/feed'}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>

      <div className="navbar-actions">
        <button onClick={toggleTheme} className="navbar-theme-toggle" aria-label="Toggle Theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <NavLink to="/profile" className="navbar-user">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="navbar-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="navbar-avatar">{initials}</div>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {profile ? profile.first_name : 'Profil'}
          </span>
        </NavLink>
        <button className="navbar-logout" onClick={handleLogout}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
