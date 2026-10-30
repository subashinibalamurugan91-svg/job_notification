import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT'); // STUDENT or ADMIN
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const data = await login(cleanEmail, password, role);
      if (data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please verify Spring Boot is running on port 8081.');
      } else if (err.response.status === 401) {
        setError(err.response.data?.message || 'Invalid email or password. Please check your credentials.');
      } else {
        setError(err.response.data?.message || 'Login failed. Please check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (val.toLowerCase().includes('admin') || val.toLowerCase().includes('tpo')) {
      setRole('ADMIN');
    }
  };

  const fillCredentials = (demoEmail, demoPassword, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setError('');
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-5 px-3" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="card custom-card p-4 p-md-5 border rounded-4 w-100 shadow-sm" style={{ maxWidth: '480px', borderColor: 'var(--border-color)' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 p-3 mb-3 shadow-sm" style={{ width: 58, height: 58, backgroundColor: '#24152F', border: '1.5px solid #D6AD60', color: '#D6AD60' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Campus Placement Portal</h3>
          <p className="text-muted small mb-0">Sign in to monitor recruitment progress & analytics</p>
        </div>

        {/* Quick Demo Credentials Autofill */}
        <div className="p-3 mb-3 rounded-3 border" style={{ backgroundColor: '#FAF7FB', borderColor: 'var(--border-color)' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px', color: '#3A2547' }}>⚡ Quick Demo Login</span>
            <span className="badge rounded-pill fw-semibold" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(214, 173, 96, 0.18)', color: '#9E7422', border: '1px solid rgba(214, 173, 96, 0.4)' }}>1-Click Fill</span>
          </div>
          <div className="d-flex flex-column gap-1.5">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--border-color)', color: '#292431' }}
              onClick={() => fillCredentials('admin@placement.edu', 'admin123', 'ADMIN')}
            >
              <span className="small"><strong>💼 Coordinator:</strong> admin@placement.edu</span>
              <span className="badge" style={{ backgroundColor: '#24152F', color: '#D6AD60', fontSize: '0.65rem' }}>admin123</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--border-color)', color: '#292431' }}
              onClick={() => fillCredentials('tpo@university.edu', 'admin123', 'ADMIN')}
            >
              <span className="small"><strong>🏛️ TPO Director:</strong> tpo@university.edu</span>
              <span className="badge" style={{ backgroundColor: '#24152F', color: '#D6AD60', fontSize: '0.65rem' }}>admin123</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--border-color)', color: '#292431' }}
              onClick={() => fillCredentials('amit.sharma@student.edu', 'password123', 'STUDENT')}
            >
              <span className="small"><strong>🎓 Student:</strong> amit.sharma@student.edu</span>
              <span className="badge" style={{ backgroundColor: '#27836C', color: '#FFFFFF', fontSize: '0.65rem' }}>password123</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-start d-flex justify-content-between align-items-center py-1.5 px-2.5 rounded-2"
              style={{ backgroundColor: '#FFFFFF', borderColor: 'var(--border-color)', color: '#292431' }}
              onClick={() => fillCredentials('priya.patel@student.edu', 'password123', 'STUDENT')}
            >
              <span className="small"><strong>🎓 Student:</strong> priya.patel@student.edu</span>
              <span className="badge" style={{ backgroundColor: '#3A2547', color: '#FFFFFF', fontSize: '0.65rem' }}>password123</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 rounded-3 text-center mb-3 fw-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Toggle Selector */}
          <div className="mb-3">
            <label className="form-label small fw-bold text-secondary text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Role Type</label>
            <div className="btn-group w-100 p-1 bg-light rounded-3" role="group">
              <button
                type="button"
                className={`btn py-2 border-0 rounded-2 fw-semibold btn-sm ${role === 'STUDENT' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
                onClick={() => setRole('STUDENT')}
              >
                🎓 Student
              </button>
              <button
                type="button"
                className={`btn py-2 border-0 rounded-2 fw-semibold btn-sm ${role === 'ADMIN' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
                onClick={() => setRole('ADMIN')}
              >
                💼 Coordinator
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {role === 'STUDENT' && (
          <div className="text-center mt-4 small border-top pt-3">
            <span className="text-muted">New student? </span>
            <Link to="/register" className="text-decoration-none fw-semibold text-primary">Create an Account</Link>
          </div>
        )}

        <div className="text-center mt-3 border-top pt-3">
          <Link to="/showcase" className="btn btn-outline-primary btn-sm w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3" style={{ borderStyle: 'dashed' }}>
            ⚡ Access Project Showcase Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
