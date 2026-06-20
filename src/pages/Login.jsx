import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, GraduationCap, Calendar, Lock, Search, X, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GERMAN_UNIVERSITIES, getLogoUrl, findUniversity } from '../lib/universities';

function UniLogoSmall({ domain, name, size = 20 }) {
  const [err, setErr] = useState(false);
  const url = getLogoUrl(domain);
  if (err || !url) return (
    <div style={{ width: size, height: size, borderRadius: 4, background: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {(name || '?')[0]}
    </div>
  );
  return <img src={url} alt="" onError={() => setErr(true)} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, borderRadius: 3 }} />;
}

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // University dropdown
  const [uniSearch, setUniSearch] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const uniDropdownRef = useRef(null);
  const uniInputRef = useRef(null);

  const navigate = useNavigate();

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

  const selectedUniData = university ? findUniversity(university) : null;

  const filteredUnis = GERMAN_UNIVERSITIES.filter(u => {
    const q = uniSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q);
  });

  const selectUniversity = (uni) => {
    setUniversity(uni.name);
    setUniSearch('');
    setShowUniDropdown(false);
  };

  const clearUniversity = (e) => {
    e.stopPropagation();
    setUniversity('');
    setUniSearch('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            university,
            degree,
            semester,
          });
          if (profileError) {
            console.error('Profile creation error:', profileError);
            alert(`Registered, but profile save failed: ${profileError.message}`);
          } else {
            alert('Registrierung erfolgreich! Bitte anmelden.');
          }
        }
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-glow" />

      <div className="login-card">
        <h2 className="login-heading">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
        <p className="login-subheading">
          {isRegistering
            ? <>Join the <span className="text-accent">Würth Elektronik</span> Network</>
            : <>Log in to <span className="text-accent">Würth Elektronik</span> Network</>
          }
        </p>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}

          {isRegistering && (
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">First Name</label>
                <input type="text" required className="input-field" placeholder="Max" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input type="text" required className="input-field" placeholder="Mustermann" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input type="email" required className="input-field pl-10" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input type="password" required className="input-field pl-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>

          {isRegistering && (
            <>
              {/* ── University Dropdown ─────────────────────── */}
              <div className="input-group" ref={uniDropdownRef} style={{ position: 'relative' }}>
                <label className="input-label">Hochschule</label>

                {/* Trigger */}
                <div
                  onClick={() => { setShowUniDropdown(v => !v); if (!showUniDropdown) setTimeout(() => uniInputRef.current?.focus(), 50); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: 'var(--border-radius-sm)',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${showUniDropdown ? 'var(--accent-red)' : 'var(--border-color)'}`,
                    cursor: 'pointer', minHeight: '44px',
                    boxShadow: showUniDropdown ? '0 0 0 3px rgba(204,0,0,0.1)' : 'none',
                  }}
                >
                  {university ? (
                    <>
                      <UniLogoSmall domain={selectedUniData?.domain} name={university} size={20} />
                      <span style={{ flex: 1, fontSize: '0.92rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {university}
                      </span>
                      {selectedUniData?.city && (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', flexShrink: 0 }}>{selectedUniData.city}</span>
                      )}
                      <button onClick={clearUniversity} style={{ padding: '2px', color: 'var(--text-muted)', lineHeight: 0, flexShrink: 0 }}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.92rem', color: 'var(--text-muted)' }}>Hochschule auswählen...</span>
                      <ChevronUp size={14} style={{ color: 'var(--text-muted)', transform: showUniDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </>
                  )}
                </div>

                {/* Drop-up list */}
                {showUniDropdown && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
                    zIndex: 500, overflow: 'hidden',
                  }}>
                    {/* Sticky search */}
                    <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                          ref={uniInputRef}
                          type="text"
                          placeholder="Name oder Stadt..."
                          value={uniSearch}
                          onChange={e => setUniSearch(e.target.value)}
                          style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '7px 10px 7px 30px', color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none' }}
                          onFocus={e => e.target.style.borderColor = 'var(--accent-red)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                        />
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '5px 0 0' }}>
                        {filteredUnis.length} Hochschulen
                      </p>
                    </div>
                    {/* List */}
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {filteredUnis.length === 0 ? (
                        <p style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Keine Ergebnisse</p>
                      ) : filteredUnis.map(uni => {
                        const isSelected = university === uni.name;
                        return (
                          <button
                            key={uni.name}
                            type="button"
                            onClick={() => selectUniversity(uni)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 14px', textAlign: 'left', fontSize: '0.86rem',
                              background: isSelected ? 'rgba(204,0,0,0.08)' : 'transparent',
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              cursor: 'pointer',
                            }}
                            onMouseOver={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            onMouseOut={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <UniLogoSmall domain={uni.domain} name={uni.name} size={18} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSelected ? 600 : 400 }}>
                              {uni.name}
                            </span>
                            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', flexShrink: 0 }}>{uni.city}</span>
                            {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-red)', flexShrink: 0 }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Studiengang</label>
                  <div className="input-with-icon">
                    <GraduationCap className="input-icon" size={18} />
                    <input type="text" required className="input-field pl-10" placeholder="z.B. Elektrotechnik" value={degree} onChange={e => setDegree(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <div className="input-with-icon">
                    <Calendar className="input-icon" size={18} />
                    <input type="number" required min="1" max="20" className="input-field pl-10" placeholder="1" value={semester} onChange={e => setSemester(e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Verarbeitung...' : (isRegistering ? 'Registrieren' : 'Anmelden')} <ArrowRight size={18} />
          </button>
        </form>

        <div className="divider">
          <span>oder fortfahren mit</span>
        </div>

        <div className="sso-buttons">
          <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="btn btn-secondary sso-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button type="button" onClick={() => alert('SAML SSO via Shibboleth wird hier konfiguriert.')} className="btn btn-secondary sso-btn shibboleth-btn">
            <GraduationCap size={18} />
            Uni Login (Shibboleth)
          </button>
        </div>

        <p className="toggle-mode">
          {isRegistering ? 'Bereits registriert?' : 'Noch kein Konto?'}{' '}
          <button type="button" className="text-accent" style={{ fontWeight: 600 }} onClick={() => { setIsRegistering(!isRegistering); setUniversity(''); setUniSearch(''); }}>
            {isRegistering ? 'Anmelden' : 'Hier registrieren'}
          </button>
        </p>
      </div>
    </div>
  );
}
