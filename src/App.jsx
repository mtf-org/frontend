import React, { useState } from 'react';
import axios from 'axios';
import MapView from './MapView'; // Move your Leaflet map code into MapView.jsx

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/register' 
                     : authMode === 'login' ? '/api/auth/login' 
                     : '/api/auth/forgot-password';

      const res = await axios.post(`${BACKEND_URL}${endpoint}`, formData);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      } else {
        alert(res.data.message);
        if (authMode === 'forgot') setAuthMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  if (token) {
    return <MapView onLogout={() => { localStorage.removeItem('token'); setToken(null); }} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Left Landing Section */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '42px', marginBottom: '20px' }}>MTF Real-Time Tracking</h1>
        <p style={{ fontSize: '18px', lineHeight: '1.6', opacity: 0.9 }}>
          Enterprise-grade live device telemetry, route analytics, and fleet management from a unified cloud console.
        </p>
      </div>

      {/* Right Side Auth Panel */}
      <div style={{ width: '450px', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff' }}>
        <h2 style={{ marginBottom: '10px' }}>
          {authMode === 'login' && 'Welcome Back'}
          {authMode === 'signup' && 'Create Account'}
          {authMode === 'forgot' && 'Reset Password'}
        </h2>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {authMode === 'signup' && (
            <input name="name" placeholder="Full Name" onChange={handleChange} required style={inputStyle} />
          )}
          <input name="email" type="email" placeholder="Email Address" onChange={handleChange} required style={inputStyle} />
          {authMode !== 'forgot' && (
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required style={inputStyle} />
          )}

          <button type="submit" style={btnStyle}>
            {authMode === 'login' ? 'Log In' : authMode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
          {authMode === 'login' && (
            <>
              <span onClick={() => setAuthMode('forgot')} style={linkStyle}>Forgot Password?</span>
              <p>Don't have an account? <span onClick={() => setAuthMode('signup')} style={linkStyle}>Sign Up</span></p>
            </>
          )}
          {authMode === 'signup' && (
            <p>Already have an account? <span onClick={() => setAuthMode('login')} style={linkStyle}>Log In</span></p>
          )}
          {authMode === 'forgot' && (
            <span onClick={() => setAuthMode('login')} style={linkStyle}>Back to Login</span>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' };
const btnStyle = { padding: '12px', background: '#1e3c72', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };
const linkStyle = { color: '#1e3c72', cursor: 'pointer', fontWeight: 'bold' };

export default App;