import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Euro, Clock, UserCheck, Search, Activity, TrendingUp, X, UserPlus, Briefcase, Award, FileText, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { supabase } from '../lib/supabase';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, talentPool: 0, interns: 0, employees: 0 });
  const [loading, setLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState('30d');
  const [monthlyBudget, setMonthlyBudget] = useState(1000);
  const [selectedCrmProfile, setSelectedCrmProfile] = useState(null);
  const [pendingDocs, setPendingDocs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    if (profiles) {
      const studentsList = profiles.filter(p => p.role === 'user' || p.status === 'student');
      setStudents(studentsList.map(s => ({
        ...s,
        healthScore: Math.floor(Math.random() * 25) + 70, // 70-95
        lastTouchpoint: s.status === 'intern' ? 'Vor 1 Tag: Vertrag bestätigt' : 'Vor 3 Tagen: Event Zusage'
      })));
      setStats({
        total: profiles.length,
        talentPool: profiles.filter(p => p.status !== 'employee').length,
        interns: profiles.filter(p => p.status === 'intern').length,
        employees: profiles.filter(p => p.status === 'employee').length
      });
    }

    const { data: docs } = await supabase.from('user_documents').select('*, profiles(first_name, last_name)').eq('status', 'pending');
    if (docs) setPendingDocs(docs);

    setLoading(false);
  };

  const handleApproveDoc = async (docId, type, userId) => {
    const { error } = await supabase.from('user_documents').update({ status: 'approved' }).eq('id', docId);
    if (!error) {
      if (type === 'student_verification') {
        await supabase.from('profiles').update({ is_verified_student: true }).eq('id', userId);
      }
      setPendingDocs(prev => prev.filter(d => d.id !== docId));
    }
  };

  const handleRejectDoc = async (docId) => {
    const { error } = await supabase.from('user_documents').update({ status: 'rejected' }).eq('id', docId);
    if (!error) {
      setPendingDocs(prev => prev.filter(d => d.id !== docId));
    }
  };

  // Time Filter Simulation Logic
  let budgetMultiplier = 1;
  let hireMultiplier = 1;
  if (timeFilter === 'Q2') { budgetMultiplier = 3; hireMultiplier = 2.5; }
  else if (timeFilter === 'YTD') { budgetMultiplier = 6; hireMultiplier = 4; }

  const currentBudget = monthlyBudget * budgetMultiplier;
  const baseHires = stats.interns + stats.employees;
  const scaledHires = Math.max(1, Math.round(baseHires * hireMultiplier));
  
  const sourcingSavings = scaledHires * 3500;
  const trueRoi = Math.round(((sourcingSavings - currentBudget) / currentBudget) * 100);
  const costPerHire = Math.round(currentBudget / scaledHires);
  
  const qualifiedTalents = students.filter(s => s.healthScore > 80).length;
  const scaledQualified = Math.max(1, Math.round(qualifiedTalents * hireMultiplier));
  const costPerQualified = Math.round(currentBudget / scaledQualified);

  const engagementData = [
    { name: 'Jan', rate: 45 },
    { name: 'Feb', rate: 52 },
    { name: 'Mar', rate: 68 },
    { name: 'Apr', rate: 74 },
    { name: 'May', rate: 82 },
    { name: 'Jun', rate: 89 },
  ];

  // True funnel with percentages
  const conversionData = [
    { name: 'Talent Pool', value: 100, label: '100%' },
    { name: 'Engaged', value: 65, label: '65%' },
    { name: 'Interns', value: stats.total ? Math.round((stats.interns / stats.total) * 100) : 0, label: `${stats.total ? Math.round((stats.interns / stats.total) * 100) : 0}%` },
    { name: 'Hires', value: stats.total ? Math.round((stats.employees / stats.total) * 100) : 0, label: `${stats.total ? Math.round((stats.employees / stats.total) * 100) : 0}%` },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterUni, setFilterUni] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterDegree, setFilterDegree] = useState('');

  const uniqueUnis = [...new Set(students.map(s => s.university).filter(Boolean))].sort();
  const uniqueSemesters = [...new Set(students.map(s => s.semester).filter(Boolean))].sort((a, b) => a - b);
  const uniqueDegrees = [...new Set(students.map(s => s.degree).filter(Boolean))].sort();

  const filteredStudents = students.filter(s => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (filterUni && s.university !== filterUni) return false;
    if (filterDegree) {
      const dq = filterDegree.toLowerCase();
      if (!s.degree || !s.degree.toLowerCase().includes(dq)) return false;
    }
    if (filterSemester && String(s.semester) !== String(filterSemester)) return false;
    return true;
  });

  return (
    <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1400px' }}>
        <div className="page-header flex-between" style={{ marginBottom: '40px' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: '2.4rem' }}>Management ROI Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
              <p className="page-description" style={{ fontSize: '1.1rem', margin: 0 }}>Financial impact, hiring efficiency & candidate quality.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Budget Simulator/mo:</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>€</span>
                <input 
                  type="number" 
                  min="0" step="100"
                  value={monthlyBudget} 
                  onChange={e => setMonthlyBudget(Number(e.target.value))}
                  style={{ width: '80px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--text-muted)', color: 'var(--text-primary)', fontWeight: '600', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: 'var(--border-radius-pill)', backgroundColor: 'var(--bg-secondary)', fontWeight: '600' }}>
              <option value="30d">Letzte 30 Tage</option>
              <option value="Q2">Q2 (Quartal)</option>
              <option value="YTD">Year to Date</option>
            </select>
            <button className="btn btn-secondary" style={{ borderRadius: 'var(--border-radius-pill)', padding: '12px 24px', fontSize: '1rem' }}>Export PDF Report</button>
          </div>
        </div>

      <div className="stats-grid" style={{ gap: '32px', marginBottom: '48px' }}>
        <div className="card stat-card delay-100" style={{ padding: '32px', background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(204,0,0,0.05) 100%)', border: '1px solid rgba(204,0,0,0.1)' }}>
          <div className="flex-between">
            <span className="stat-label">True ROI (%)</span>
            <TrendingUp className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem', color: 'var(--accent-red)' }}>+{trueRoi}%</span>
          <span className="text-secondary text-sm">Return on Marketing Budget</span>
        </div>
        
        <div className="card stat-card delay-200" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">Cost per Hire (CAC)</span>
            <Users className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>€ {costPerHire.toLocaleString()}</span>
          <span className="text-secondary text-sm">Target: {'<'} € 1,000 / hire</span>
        </div>

        <div className="card stat-card delay-300" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">Cost per Qualified Talent</span>
            <Activity className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>€ {costPerQualified.toLocaleString()}</span>
          <span className="text-secondary text-sm">Pipeline Value (Health {'>'} 80)</span>
        </div>

        <div className="card stat-card delay-300" style={{ padding: '32px' }}>
          <div className="flex-between">
            <span className="stat-label">Sourcing Cost Savings</span>
            <Euro className="text-accent" size={24} />
          </div>
          <span className="stat-value" style={{ fontSize: '3rem' }}>€ {sourcingSavings.toLocaleString()}</span>
          <span className="text-secondary text-sm">Absolute eingesparte Headhunter-Kosten</span>
        </div>
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Candidate Engagement Health (%)</h3>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cc0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#cc0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9aa3af" tick={{fontSize: 14}} axisLine={false} tickLine={false} />
                <YAxis stroke="#9aa3af" tick={{fontSize: 14}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(16,24,40,0.08)' }} />
                <Area type="monotone" dataKey="rate" stroke="#cc0000" strokeWidth={4} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>True Funnel Conversion (%)</h3>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" stroke="#9aa3af" tick={{fontSize: 14}} axisLine={false} tickLine={false} />
                <YAxis stroke="#9aa3af" tick={{fontSize: 14}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(16,24,40,0.08)' }} cursor={{ fill: 'rgba(204,0,0,0.05)' }} />
                <Bar dataKey="value" fill="#cc0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '48px' }}>
        <h3 style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Pending Document Reviews</h3>
        {pendingDocs.length === 0 ? (
          <p className="text-secondary">Keine ausstehenden Dokumente zur Überprüfung.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingDocs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', color: 'var(--text-primary)' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {doc.profiles?.first_name} {doc.profiles?.last_name}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {doc.type === 'student_verification' ? 'Immatrikulationsbescheinigung' : 'Zertifikat'} • {doc.file_name}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <a href={doc.file_data} download={doc.file_name} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                    View Document
                  </a>
                  <button onClick={() => handleApproveDoc(doc.id, doc.type, doc.user_id)} className="btn btn-primary" style={{ padding: '8px 16px', background: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handleRejectDoc(doc.id)} className="btn btn-secondary" style={{ padding: '8px 16px', color: 'var(--accent-red)', borderColor: 'rgba(204,0,0,0.3)' }}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <h3>Talent Pool Database</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select className="input-field" value={filterUni} onChange={e => setFilterUni(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
              <option value="">Alle Universitäten</option>
              {uniqueUnis.map(uni => <option key={uni} value={uni}>{uni}</option>)}
            </select>
            
            <div style={{ position: 'relative' }}>
              <input 
                className="input-field" 
                type="text" 
                list="degrees-list"
                placeholder="Studiengang suchen..." 
                value={filterDegree} 
                onChange={e => setFilterDegree(e.target.value)} 
                style={{ padding: '8px 12px', width: '200px' }} 
              />
              <datalist id="degrees-list">
                {uniqueDegrees.map(deg => <option key={deg} value={deg} />)}
              </datalist>
            </div>

            <select className="input-field" value={filterSemester} onChange={e => setFilterSemester(e.target.value)} style={{ padding: '8px 12px', width: 'auto' }}>
              <option value="">Alle Semester</option>
              {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}. Semester</option>)}
            </select>
            <div className="input-with-icon" style={{ width: '240px' }}>
              <Search className="input-icon" size={18} />
              <input type="text" className="input-field pl-10" placeholder="Search talents..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Name</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>University</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Major</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Health Score</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Last Touchpoint</th>
                <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: '500' }}>{student.first_name} {student.last_name}</td>
                  <td style={{ padding: '16px 12px' }}>{student.university} (Sem. {student.semester})</td>
                  <td style={{ padding: '16px 12px' }}>{student.degree}</td>
                  <td style={{ padding: '16px 12px' }}>
                    {student.status === 'intern'
                      ? <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>Intern</span>
                      : student.status === 'employee' 
                      ? <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>Employee</span>
                      : <span style={{ background: 'rgba(204,0,0,0.1)', color: 'var(--accent-red)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Talent Pool</span>}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} style={{ color: student.healthScore > 85 ? 'var(--accent-green)' : 'var(--text-primary)' }} />
                      <span style={{ fontWeight: '600', color: student.healthScore > 85 ? 'var(--accent-green)' : 'var(--text-primary)' }}>{student.healthScore}/100</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {student.lastTouchpoint}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <button className="text-accent" onClick={() => setSelectedCrmProfile(student)} style={{ fontSize: '0.9rem', fontWeight: '500', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>CRM Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      
      {/* CRM Profile Modal */}
      {/* CRM Profile Modal */}
      {selectedCrmProfile && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-fade-in" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '32px' }}>
            <button 
              onClick={() => setSelectedCrmProfile(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {selectedCrmProfile.first_name} {selectedCrmProfile.last_name}
            </h2>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', color: 'var(--text-secondary)' }}>
              <span>{selectedCrmProfile.university}</span>
              <span>•</span>
              <span>{selectedCrmProfile.degree}</span>
              <span>•</span>
              <span style={{ color: selectedCrmProfile.status === 'intern' || selectedCrmProfile.status === 'employee' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {selectedCrmProfile.status.toUpperCase()}
              </span>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Career Journey</h3>
            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                
                {/* Step 1: Join Network */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <UserPlus size={16} />
                    </div>
                    <div style={{ width: '2px', height: '40px', background: (selectedCrmProfile.status === 'intern' || selectedCrmProfile.status === 'working_student' || selectedCrmProfile.status === 'employee') ? 'var(--accent-red)' : 'var(--border-color)', margin: '4px 0' }} />
                  </div>
                  <div style={{ paddingBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Beitritt ins Wörth Netzwerk</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>März 2024</span>
                  </div>
                </div>

                {/* Step 2: Internship / Working Student */}
                {(selectedCrmProfile.status === 'intern' || selectedCrmProfile.status === 'working_student' || selectedCrmProfile.status === 'employee') && (
                  <div style={{ display: 'flex', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(204,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-red)' }}>
                        <Briefcase size={16} />
                      </div>
                      <div style={{ width: '2px', height: '40px', background: selectedCrmProfile.status === 'employee' ? 'var(--accent-green)' : 'var(--border-color)', margin: '4px 0' }} />
                    </div>
                    <div style={{ paddingBottom: '24px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {selectedCrmProfile.status === 'working_student' ? 'Start als Werkstudent' : 'Start Praktikum'}
                      </h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Oktober 2024</span>
                    </div>
                  </div>
                )}

                {/* Step 3: Employee */}
                {selectedCrmProfile.status === 'employee' && (
                  <div style={{ display: 'flex', gap: '16px', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                        <Award size={16} />
                      </div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Übernahme in Festanstellung</h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Heute</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
