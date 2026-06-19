import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Newspaper, MessageSquare, Briefcase, Users, User, BarChart2, LogOut } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const navItems = [
    { name: 'Neues', path: '/', icon: <Newspaper size={20} /> },
    { name: 'Channels', path: '/channels', icon: <MessageSquare size={20} /> },
    { name: 'Karriere', path: '/career', icon: <Briefcase size={20} /> },
    { name: 'Kontakte', path: '/contacts', icon: <Users size={20} /> },
    { name: 'Profil', path: '/profile', icon: <User size={20} /> },
    { name: 'Analytics (HR)', path: '/admin/dashboard', icon: <BarChart2 size={20} /> },
  ];

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-logo">W</span>
          <span className="brand-text">Würth Elektronik <span className="text-accent">Net</span></span>
        </div>
      </div>
      
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span className="nav-label">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
  );
}
