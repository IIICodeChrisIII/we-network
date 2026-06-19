import React, { useState, useEffect } from 'react';
import { Users, BookOpen, MessageSquare, TrendingUp, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, talentPool: 0, interns: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      const studentsList = profiles.filter(p => p.role === 'user' || p.status === 'student');
      setStudents(studentsList);
      setStats(prev => ({
        ...prev,
        total: profiles.length,
        talentPool: profiles.filter(p => p.status !== 'employee').length,
        interns: profiles.filter(p => p.status === 'intern').length,
        employees: profiles.filter(p => p.status === 'employee').length
      }));
    }

    // Fetch message count
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true });
    if (count !== null) {
      setStats(prev => ({ ...prev, messages: count }));
    }

    setLoading(false);
  };

  const activityData = [
    { name: 'Jan', active: Math.floor(stats.total * 0.2) },
    { name: 'Feb', active: Math.floor(stats.total * 0.4) },
    { name: 'Mar', active: Math.floor(stats.total * 0.6) },
    { name: 'Apr', active: Math.floor(stats.total * 0.8) },
    { name: 'May', active: Math.floor(stats.total * 0.9) },
    { name: 'Jun', active: stats.total },
  ];

  const conversionData = [
    { name: 'Student', count: students.length },
    { name: 'Intern', count: stats.interns },
    { name: 'Employee', count: stats.employees || 0 },
  ];

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1400px' }}>
        <div className="page-header flex-between" style={{ marginBottom: '40px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '2.4rem' }}>HR & Analytics Dashboard</h1>
            <p className="page-description" style={{ fontSize: '1.1rem' }}>Overview of student engagement and ROI tracking.</p>
          </div>
          <button className="btn btn-secondary" style={{ borderRadius: 'var(--border-radius-pill)', padding: '12px 24px', fontSize: '1rem' }}>Export Report</button>
        </div>

      <div className="stats-grid" style={{ gap: '32px', marginBottom: '48px' }}>
        <div className="card stat-card delay-100" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">Total Users</span>
            <Users className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>{stats.total}</span>
          <span className="text-secondary text-sm">Registered profiles</span>
        </div>
        
        <div className="card stat-card delay-200" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">In Talent Pool</span>
            <TrendingUp className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>{stats.talentPool}</span>
          <span className="text-secondary text-sm">Active candidates</span>
        </div>

        <div className="card stat-card delay-300" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">Internships / Hires</span>
            <BookOpen className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>{stats.interns}</span>
          <span className="text-secondary text-sm">Status converted</span>
        </div>

        <div className="card stat-card delay-300" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">Active in Channels</span>
            <MessageSquare className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>{stats.messages}</span>
          <span className="text-secondary text-sm">Total messages sent</span>
        </div>
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Platform Activity Over Time</h3>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 14}} />
                <YAxis stroke="#888" tick={{fontSize: 14}} />
                <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #333', fontSize: '1.1rem' }} />
                <Line type="monotone" dataKey="active" stroke="#cc0000" strokeWidth={4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>User Funnel (ROI)</h3>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#888" tick={{fontSize: 14}} />
                <YAxis stroke="#888" tick={{fontSize: 14}} />
                <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #333', fontSize: '1.1rem' }} />
                <Bar dataKey="count" fill="#cc0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h3>Student Database</h3>
          <div className="input-with-icon" style={{ width: '300px' }}>
            <Search className="input-icon" size={18} />
            <input type="text" className="input-field pl-10" placeholder="Search students..." />
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Name</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>University</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Major</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Internships</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Talent Pool</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Channel Activity</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: '500' }}>{student.first_name} {student.last_name}</td>
                  <td style={{ padding: '16px 12px' }}>{student.university} (Sem. {student.semester})</td>
                  <td style={{ padding: '16px 12px' }}>{student.degree}</td>
                  <td style={{ padding: '16px 12px' }}>
                    {student.status === 'intern'
                      ? <span style={{ color: '#4ade80' }}>Yes</span> 
                      : <span style={{ color: 'var(--text-muted)' }}>No</span>}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    {student.status !== 'employee'
                      ? <span style={{ background: 'rgba(204,0,0,0.1)', color: 'var(--accent-red)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Active</span>
                      : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <button className="text-accent" style={{ fontSize: '0.9rem', fontWeight: '500' }}>View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
