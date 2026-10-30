import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    regNo: '',
    name: '',
    email: '',
    password: '',
    department: 'Computer Science',
    cgpa: '',
    phone: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cgpaVal = parseFloat(formData.cgpa);
    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
      setError('CGPA must be a valid decimal between 0.00 and 10.00');
      setLoading(false);
      return;
    }

    try {
      await register({
        ...formData,
        cgpa: cgpaVal
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering'
  ];

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 py-5 px-3" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="card custom-card p-4 p-md-5 border rounded-4 w-100 shadow-sm" style={{ maxWidth: '520px', borderColor: 'var(--border-color)' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 p-3 mb-3 shadow-sm" style={{ width: 58, height: 58, backgroundColor: '#24152F', border: '1.5px solid #D6AD60', color: '#D6AD60' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>Student Candidate Registration</h3>
          <p className="text-muted small">Create your verified placement profile to apply for active drives</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small border-0 rounded-3 text-center mb-3 fw-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success py-2 px-3 small border-0 rounded-3 text-center mb-3 fw-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Registration Number</label>
              <input
                type="text"
                name="regNo"
                className="form-control"
                placeholder="e.g. CS2023001"
                value={formData.regNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Amit Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="amit.sharma@student.edu"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">Department</label>
              <select
                name="department"
                className="form-select"
                value={formData.department}
                onChange={handleChange}
                required
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label small fw-semibold">CGPA</label>
              <input
                type="number"
                name="cgpa"
                step="0.01"
                className="form-control"
                placeholder="e.g. 8.50"
                value={formData.cgpa}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Phone Number</label>
            <input
              type="text"
              name="phone"
              className="form-control"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 fw-semibold mb-3 shadow-sm"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-2 small border-top pt-3">
          <span className="text-muted">Already registered? </span>
          <Link to="/login" className="text-decoration-none fw-semibold text-primary">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
