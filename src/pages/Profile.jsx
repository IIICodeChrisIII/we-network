import React, { useState, useEffect, useRef } from 'react';
import { User, Save, Briefcase, ChevronDown, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GERMAN_UNIVERSITIES, getLogoUrl, findUniversity } from '../lib/universities';

function UniLogo({ domain, name, size = 22 }) {
  const [error, setError] = useState(false);
  const logoUrl = getLogoUrl(domain);
  if (error || !logoUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '5px', background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.52), fontWeight: 700, color: 'white', flexShrink: 0 }}>
        {(name || '?')[0]}
      </div>
    );
  }
  return (
    <img
      src={logoUrl}
      alt=""
      onError={() => setError(true)}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, borderRadius: '3px' }}
    />
  );
}

export default function Profile() {
  const [profile, setProfile] = useState({ first_name: '', last_name: '', bio: '', status: 'student', university: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // University dropdown state
  const [uniSearch, setUniSearch] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const uniDropdownRef = useRef(null);
  const uniInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target)) {
        setShowUniDropdown(false);
        setUniSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!error && data) setProfile(data);
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile });
      if (!error) alert('Profile saved!');
      else alert('Error saving profile');
    }
    setSaving(false);
  };

  const selectUniversity = (uni) => {
    setProfile(prev => ({ ...prev, university: uni.name }));
    setUniSearch('');
    setShowUniDropdown(false);
  };

  const clearUniversity = (e) => {
    e.stopPropagation();
    setProfile(prev => ({ ...prev, university: '' }));
    setUniSearch('');
  };

  const selectedUniData = profile.university ? findUniversity(profile.university) : null;

  const filteredUnis = GERMAN_UNIVERSITIES.filter(u =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.city.toLowerCase().includes(uniSearch.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h1 className="page-title">Profil</h1>
        <p className="page-description">Manage your personal information and career status.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-primary)', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', flexShrink: 0 }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div>
            <label className="btn btn-secondary" style={{ marginBottom: '8px', cursor: 'pointer', display: 'inline-block' }}>
              Upload Photo
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { alert('File is too large (max 2MB)'); return; }
                  const reader = new FileReader();
                  reader.onloadend = () => setProfile(prev => ({ ...prev, avatar_url: reader.result }));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>JPG or PNG, max 2MB</p>
          </div>
        </div>

        {/* Name */}
        <div className="form-row">
          <div className="input-group">
            <label className="input-label">First Name</label>
            <input type="text" className="input-field" value={profile.first_name || ''} onChange={e => setProfile({ ...profile, first_name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Last Name</label>
            <input type="text" className="input-field" value={profile.last_name || ''} onChange={e => setProfile({ ...profile, last_name: e.target.value })} />
          </div>
        </div>

        {/* Bio */}
        <div className="input-group">
          <label className="input-label">Bio</label>
          <textarea className="input-field" rows="3" value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} style={{ resize: 'vertical' }} />
        </div>

        {/* Status */}
        <div className="input-group">
          <label className="input-label">Current Status</label>
          <div className="input-with-icon">
            <Briefcase className="input-icon" size={18} />
            <select className="input-field pl-10" value={profile.status || 'student'} onChange={e => setProfile({ ...profile, status: e.target.value })} style={{ appearance: 'none' }}>
              <option value="student">Student</option>
              <option value="intern">Intern at Würth</option>
              <option value="working_student">Working Student at Würth</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>

        {/* ── University Picker ─────────────────────────────── */}
        <div className="input-group" style={{ marginBottom: '8px' }}>
          <label className="input-label">University</label>

          <div ref={uniDropdownRef} style={{ position: 'relative' }}>
            {/* Trigger */}
            <div
              onClick={() => { setShowUniDropdown(v => !v); if (!showUniDropdown) setTimeout(() => uniInputRef.current?.focus(), 50); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: 'var(--border-radius-sm)',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${showUniDropdown ? 'var(--accent-red)' : 'var(--border-color)'}`,
                cursor: 'pointer', transition: 'border-color var(--transition-fast)',
                boxShadow: showUniDropdown ? '0 0 0 3px rgba(204,0,0,0.1)' : 'none',
                minHeight: '44px',
              }}
            >
              {profile.university ? (
                <>
                  <UniLogo domain={selectedUniData?.domain} name={profile.university} size={22} />
                  <span style={{ flex: 1, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile.university}
                  </span>
                  {selectedUniData?.city && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{selectedUniData.city}</span>
                  )}
                  <button
                    onClick={clearUniversity}
                    style={{ padding: '2px', color: 'var(--text-muted)', borderRadius: '50%', flexShrink: 0, lineHeight: 0 }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', flex: 1 }}>Hochschule auswählen...</span>
                  <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: showUniDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </>
              )}
            </div>

            {/* Dropdown */}
            {showUniDropdown && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', boxShadow: '0 -20px 60px rgba(0,0,0,0.45)', zIndex: 500, overflow: 'hidden' }}>

                {/* Search inside dropdown */}
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      ref={uniInputRef}
                      type="text"
                      placeholder="Suchen nach Name oder Stadt..."
                      value={uniSearch}
                      onChange={e => setUniSearch(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '8px 10px 8px 32px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                    {filteredUnis.length} {filteredUnis.length === 1 ? 'Hochschule' : 'Hochschulen'} gefunden
                  </p>
                </div>

                {/* List */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {filteredUnis.length === 0 ? (
                    <p style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Keine Hochschule gefunden.
                    </p>
                  ) : (
                    filteredUnis.map(uni => {
                      const isSelected = profile.university === uni.name;
                      return (
                        <button
                          key={uni.name}
                          onClick={() => selectUniversity(uni)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', textAlign: 'left', fontSize: '0.875rem',
                            background: isSelected ? 'rgba(204,0,0,0.08)' : 'transparent',
                            color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer', transition: 'background var(--transition-fast)',
                          }}
                          onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                          onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <UniLogo domain={uni.domain} name={uni.name} size={22} />
                          <span style={{ flex: 1, fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {uni.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {uni.city}
                          </span>
                          {isSelected && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-red)', flexShrink: 0 }} />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
