import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, BookOpen, GraduationCap, Calendar, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            university: university,
            degree: degree,
            semester: semester
          });
        }
        alert('Registration successful! Please sign in.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
      <div className="login-visuals">
        <div className="brand-glow"></div>
        <div className="brand-content">
          <h1 className="brand-title">
            <span className="text-gradient">Würth Elektronik</span> Network
          </h1>
          <p className="brand-subtitle">
            Connect. Grow. Innovate. Join the exclusive network for students and tech specialists.
          </p>
        </div>
      </div>
      
      <div className="login-form-wrapper">
        <div className="glass-panel login-card">
          <h2 className="login-heading">{isRegistering ? 'Create an Account' : 'Welcome Back'}</h2>
          <p className="login-subheading">
            {isRegistering ? 'Join the Würth student network' : 'Sign in to continue to your dashboard'}
          </p>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {isRegistering && (
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">First Name</label>
                  <input type="text" required className="input-field" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Last Name</label>
                  <input type="text" required className="input-field" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  required 
                  className="input-field pl-10" 
                  placeholder="student@university.edu" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  required 
                  className="input-field pl-10" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {isRegistering && (
              <>
                <div className="input-group">
                  <label className="input-label">University</label>
                  <div className="input-with-icon">
                    <BookOpen className="input-icon" size={18} />
                    <input type="text" required className="input-field pl-10" placeholder="e.g. TU München" value={university} onChange={e => setUniversity(e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Major / Course</label>
                    <div className="input-with-icon">
                      <GraduationCap className="input-icon" size={18} />
                      <input type="text" required className="input-field pl-10" placeholder="e.g. Computer Science" value={degree} onChange={e => setDegree(e.target.value)} />
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
              {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')} <ArrowRight size={18} />
            </button>
          </form>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="sso-buttons">
            <button type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="btn btn-secondary sso-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" onClick={() => alert('SAML SSO via Shibboleth will be configured here.')} className="btn btn-secondary sso-btn shibboleth-btn">
              <BookOpen size={18} />
              University Login (Shibboleth)
            </button>
          </div>

          <p className="toggle-mode">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="text-accent" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
