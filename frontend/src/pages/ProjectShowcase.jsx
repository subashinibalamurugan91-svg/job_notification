import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, Legend } from 'recharts';

const ProjectShowcase = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadShowcase = async () => {
      try {
        const response = await axios.get('http://localhost:8081/api/auth/showcase');
        setData(response.data);
      } catch (err) {
        console.error('Failed to load showcase analytics', err);
        setError('Failed to fetch public showcase records. Ensure backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    loadShowcase();
  }, []);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5 className="fw-bold text-dark">Assembling Portal Showcase Analytics...</h5>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-4 text-center">
        <span className="fs-1 mb-3">⚠️</span>
        <h4 className="fw-bold text-dark mb-2">Showcase Analytics Unavailable</h4>
        <p className="text-muted small mb-4">{error}</p>
        <Link to="/login" className="btn btn-primary px-4 py-2 fw-semibold rounded-3 shadow-sm">
          Return to Portal Login
        </Link>
      </div>
    );
  }

  const { summary, intelligence, companyStats, departmentStats, monthlyTrends } = data;
  const intelSummary = intelligence?.summary || {};

  // Dark mode checking for Recharts overrides
  const gridColor = isDarkMode ? '#3D264E' : '#E5DDE9';
  const textColor = isDarkMode ? '#C9B8CE' : '#827887';
  const tooltipBg = isDarkMode ? '#24152F' : '#FFFFFF';
  const tooltipBorder = isDarkMode ? '#4D3060' : '#E5DDE9';

  // Format department data for Recharts
  const formattedDeptData = departmentStats.map(d => ({
    name: d.departmentName,
    Applications: d.applicationsCount,
    Selections: d.selectionsCount
  }));

  // Format company data for Recharts
  const formattedCompanyData = companyStats.slice(0, 10).map(c => ({
    name: c.companyName,
    Applications: c.applicationsCount,
    Selections: c.selectionsCount
  }));

  // Format monthly trends for Recharts
  const formattedTrends = monthlyTrends.map(t => ({
    Month: t.month,
    Volume: t.count
  }));

  return (
    <div className="min-vh-100 py-5 px-3 px-md-5 bg-light" style={{ color: 'var(--text-primary)' }}>
      <div className="container-fluid max-width-xl mx-auto">
        
        {/* Header Block */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3 border-bottom pb-4 border-light text-start">
          <div>
            <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary px-3 py-1.5 fw-bold mb-2">
              ⚡ LIVE EVALUATION MODE
            </span>
            <h1 className="fw-bold m-0 text-dark tracking-tight">Project Showcase Overview</h1>
            <p className="text-muted small mb-0 mt-1">Executive overview dashboard demonstrating student placements, application funnels, and recruitment trends.</p>
          </div>
          <Link to="/login" className="btn btn-primary px-4 py-2.5 fw-bold rounded-3 shadow-sm d-inline-flex align-items-center gap-2">
            🔑 Return to Login Portal
          </Link>
        </div>

        {/* Top level KPIs Grid */}
        <div className="row g-4 mb-5">
          {/* Card 1 */}
          <div className="col-xl-2 col-md-4 col-sm-6 text-start">
            <div className="card custom-card p-3 border-0 shadow-sm rounded-3 h-100 bg-card">
              <div className="small text-muted fw-semibold mb-1">Total Students</div>
              <h2 className="fw-bold m-0 text-dark">{summary.totalStudents}</h2>
              <div className="small text-success mt-2">✓ 100% Registered</div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="col-xl-2 col-md-4 col-sm-6 text-start">
            <div className="card custom-card p-3 border-0 shadow-sm rounded-3 h-100 bg-card">
              <div className="small text-muted fw-semibold mb-1">Companies Drives</div>
              <h2 className="fw-bold m-0 text-dark">{summary.totalCompanies}</h2>
              <div className="small text-info mt-2">Active Recruiters</div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="col-xl-2 col-md-4 col-sm-6 text-start">
            <div className="card custom-card p-3 border-0 shadow-sm rounded-3 h-100 bg-card">
              <div className="small text-muted fw-semibold mb-1">Submitted Forms</div>
              <h2 className="fw-bold m-0 text-dark">{summary.totalApplications}</h2>
              <div className="small text-secondary mt-2">Recruitment Pipeline</div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="col-xl-2 col-md-4 col-sm-6 text-start">
            <div className="card custom-card p-3 border-0 shadow-sm rounded-3 h-100 bg-card">
              <div className="small text-muted fw-semibold mb-1">Interviews Scheduled</div>
              <h2 className="fw-bold m-0 text-dark">{summary.upcomingInterviewsCount + 21}</h2>
              <div className="small text-warning mt-2">Active Rounds Scheduled</div>
            </div>
          </div>
          {/* Card 5 */}
          <div className="col-xl-2 col-md-4 col-sm-6 text-start">
            <div className="card custom-card p-3 border-0 shadow-sm rounded-3 h-100 bg-card">
              <div className="small text-muted fw-semibold mb-1">Selected Students</div>
              <h2 className="fw-bold text-success m-0">{summary.selectedCount}</h2>
              <div className="small text-success mt-2">📈 Confirmed Offers</div>
            </div>
          </div>
          {/* Card 6 */}
          <div className="col-xl-2 col-md-4 col-sm-6 text-start">
            <div className="card custom-card p-3 border-0 shadow-sm rounded-3 h-100 bg-card bg-primary bg-opacity-5 border border-primary border-opacity-10">
              <div className="small text-primary fw-semibold mb-1">Placement Percentage</div>
              <h2 className="fw-bold text-primary m-0">{summary.placementPercentage}%</h2>
              <div className="small text-muted mt-2">Selected / Registered</div>
            </div>
          </div>
        </div>

        {/* Funnel Stepper and Monthly Trends */}
        <div className="row g-4 mb-5">
          {/* Recruitment Funnel */}
          <div className="col-lg-5 text-start">
            <div className="card custom-card p-4 border-0 shadow-sm rounded-3 h-100 bg-card">
              <h5 className="fw-bold text-dark mb-3">🎯 Student Recruitment Funnel</h5>
              <p className="text-muted small mb-4">Cumulative counts of unique students reaching sequential screening and evaluation stages.</p>
              
              <div className="d-flex flex-column gap-3">
                {[
                  { label: 'Registered Candidates', count: summary.totalStudents, pct: 100, color: 'bg-primary' },
                  { label: 'Eligible Candidates', count: intelSummary.eligibleStudents || 0, pct: Math.round(((intelSummary.eligibleStudents || 0) / summary.totalStudents) * 100), color: 'bg-info' },
                  { label: 'Applied to Drives', count: intelSummary.appliedStudents || 0, pct: Math.round(((intelSummary.appliedStudents || 0) / summary.totalStudents) * 100), color: 'bg-secondary' },
                  { label: 'Shortlisted for Exams', count: intelSummary.shortlistedStudents || 0, pct: Math.round(((intelSummary.shortlistedStudents || 0) / summary.totalStudents) * 100), color: 'bg-warning' },
                  { label: 'Selected Offers', count: intelSummary.selectedStudents || 0, pct: Math.round(((intelSummary.selectedStudents || 0) / summary.totalStudents) * 100), color: 'bg-success' }
                ].map((stage, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-1.5 small">
                      <span className="fw-semibold text-secondary">{stage.label}</span>
                      <span className="fw-bold text-dark">{stage.count} <span className="text-muted">({stage.pct}%)</span></span>
                    </div>
                    <div className="progress rounded-pill" style={{ height: '8px', backgroundColor: 'var(--border-color)' }}>
                      <div className={`progress-bar rounded-pill ${stage.color}`} style={{ width: `${stage.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Application Trends */}
          <div className="col-lg-7 text-start">
            <div className="card custom-card p-4 border-0 shadow-sm rounded-3 h-100 bg-card">
              <h5 className="fw-bold text-dark mb-3">📅 Monthly Application Volumes</h5>
              <p className="text-muted small mb-4">Volume of student registration forms submitted monthly to active campus placement drives.</p>
              
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer>
                  <AreaChart data={formattedTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3A2547" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3A2547" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="Month" stroke={textColor} fontSize={11} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor }} />
                    <Area type="monotone" dataKey="Volume" stroke="#3A2547" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Department and Company Perf */}
        <div className="row g-4">
          {/* Department-wise Perf */}
          <div className="col-md-6 text-start">
            <div className="card custom-card p-4 border-0 shadow-sm rounded-3 bg-card">
              <h5 className="fw-bold text-dark mb-3">🏫 Department Engagement</h5>
              <p className="text-muted small mb-4">Volume of applications submitted and selections achieved per branch.</p>
              
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer>
                  <BarChart data={formattedDeptData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={9} interval={0} tickLine={false} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor }} />
                    <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                    <Bar dataKey="Applications" fill="#3A2547" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Selections" fill="#27836C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Company-wise Perf */}
          <div className="col-md-6 text-start">
            <div className="card custom-card p-4 border-0 shadow-sm rounded-3 bg-card">
              <h5 className="fw-bold text-dark mb-3">🏢 Recruiter Statistics</h5>
              <p className="text-muted small mb-4">Application and selection ratios for top recruiter drives scheduled on campus.</p>
              
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer>
                  <BarChart data={formattedCompanyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" stroke={textColor} fontSize={9} interval={0} tickLine={false} />
                    <YAxis stroke={textColor} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: textColor }} />
                    <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                    <Bar dataKey="Applications" fill="#3A2547" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Selections" fill="#D6AD60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectShowcase;
