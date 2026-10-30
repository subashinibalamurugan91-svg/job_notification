import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { readinessService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ReadinessDashboard = () => {
  const toast = useToast();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    try {
      const data = await readinessService.getMyReadiness();
      setReadiness(data);
    } catch (err) {
      toast.error('Failed to load placement readiness insights.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Calculating placement readiness score...</p>
      </div>
    );
  }

  const score = readiness?.readinessScore || 0;
  const category = readiness?.category || 'Needs Improvement';
  const completeness = readiness?.profileCompleteness || 0;

  // Determine gauge chart empty track color based on active theme
  const isDarkMode = document.body.classList.contains('dark-mode');
  const emptyTrackColor = isDarkMode ? '#3D264E' : '#E5DDE9';

  // Pie chart data representing gauge out of 100 (Midnight Plum & Champagne Gold Palette)
  const gaugeData = [
    { value: score, color: score >= 90 ? '#27836C' : score >= 75 ? '#D6AD60' : score >= 60 ? '#D99536' : '#C65362' },
    { value: 100 - score, color: emptyTrackColor }
  ];

  const getCategoryColorClass = (cat) => {
    if (cat === 'Excellent') return 'selected';
    if (cat === 'Good') return 'eligible';
    if (cat === 'Average') return 'shortlisted';
    return 'rejected';
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">Placement Readiness Index</h2>
        <p className="text-muted small mb-0">Evaluate your current preparation level, identify weaknesses, and see tailored company recommendations</p>
      </div>

      <div className="row g-4 mb-4">
        {/* Gauge Chart Card & Index details */}
        <div className="col-lg-4">
          <div className="card custom-card p-4 text-center h-100 shadow-sm border-0">
            <h5 className="fw-bold text-dark mb-2">Readiness Index Score</h5>
            
            {/* Recharts Circular Gauge */}
            <div className="d-flex align-items-center justify-content-center position-relative mx-auto" style={{ width: '180px', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={-180}
                    innerRadius={60}
                    outerRadius={75}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill={gaugeData[0].color} />
                    <Cell fill={gaugeData[1].color} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="position-absolute text-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="display-6 fw-bold text-dark">{score}</div>
                <div className="small text-muted fw-semibold">out of 100</div>
              </div>
            </div>

            <span className={`badge badge-status ${getCategoryColorClass(category)} text-uppercase fw-bold p-2 mx-auto my-3`} style={{ fontSize: '0.85rem' }}>
              Readiness: {category}
            </span>

            <div className="small text-secondary px-2">
              Based on your current academic score, applied drives count, and resume completion status.
            </div>
          </div>
        </div>

        {/* Profile completion & preparation stats */}
        <div className="col-lg-8">
          <div className="card custom-card p-4 h-100 shadow-sm border-0">
            <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Preparation Indicators</h5>
            
            <div className="row g-4">
              {/* Profile Completeness */}
              <div className="col-md-6">
                <label className="form-label small fw-bold d-flex justify-content-between">
                  <span>Profile Completeness</span>
                  <span className="text-primary">{completeness}%</span>
                </label>
                <div className="progress rounded-pill mb-3" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar rounded-pill" 
                    role="progressbar" 
                    style={{ width: `${completeness}%`, backgroundColor: 'var(--primary-color)' }}
                    aria-valuenow={completeness} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
                <span className="small text-muted">Complete details like contact phone numbers and drives resume mappings to boost score.</span>
              </div>

              {/* Resume status check */}
              <div className="col-md-6">
                <label className="form-label small fw-bold d-block">Resume Verification</label>
                <div className="d-flex align-items-center gap-3 bg-light p-3 rounded-3 border">
                  <span className="fs-3">📄</span>
                  <div>
                    <div className="small fw-bold text-dark">System Resume Status</div>
                    <span className={`badge badge-status ${readiness?.resumeStatus === 'Uploaded' ? 'selected' : 'rejected'} mt-1`}>
                      {readiness?.resumeStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-4 opacity-25" />

            {/* Quick Metrics */}
            <div className="row text-center">
              <div className="col-6 border-end">
                <h3 className="fw-bold text-primary m-0">{readiness?.applicationsCount}</h3>
                <span className="small text-muted uppercase">Drives Applied</span>
              </div>
              <div className="col-6">
                <h3 className="fw-bold text-warning m-0">{readiness?.interviewsCount}</h3>
                <span className="small text-muted uppercase">Interview Rounds</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Strengths & Weaknesses */}
        <div className="col-md-6">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold text-dark mb-3">💡 Student Insights</h5>
            
            {/* Strengths */}
            <div className="mb-4">
              <h6 className="fw-bold text-success mb-2">🚀 Primary Strengths:</h6>
              {readiness?.strengths && readiness.strengths.length > 0 ? (
                <ul className="list-unstyled d-flex flex-column gap-2 m-0">
                  {readiness.strengths.map((str, idx) => (
                    <li key={idx} className="small text-secondary d-flex align-items-start gap-2">
                      <span className="text-success">✔</span> {str}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="small text-muted">No primary strengths mapped. Enhance CGPA or apply to drives to register strengths.</span>
              )}
            </div>

            {/* Improvement Areas */}
            <div>
              <h6 className="fw-bold text-danger mb-2">🔧 Key Areas of Improvement:</h6>
              {readiness?.improvements && readiness.improvements.length > 0 ? (
                <ul className="list-unstyled d-flex flex-column gap-2 m-0">
                  {readiness.improvements.map((imp, idx) => (
                    <li key={idx} className="small text-secondary d-flex align-items-start gap-2">
                      <span className="text-danger">⚠</span> {imp}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="small text-muted">No critical improvements needed! Keep up the good preparation.</span>
              )}
            </div>
          </div>
        </div>

        {/* Tailored Company Recommendations */}
        <div className="col-md-6">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold text-dark mb-3">🏢 Recommended For You</h5>
            <p className="text-muted small mb-3">Tailored drive recommendations based on eligible cutoffs, department criteria, and CTC values.</p>

            <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: '240px' }}>
              {readiness?.recommendations && readiness.recommendations.length > 0 ? (
                readiness.recommendations.map(opp => (
                  <div key={opp.companyId} className="p-3 bg-light bg-opacity-50 rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.9rem' }}>{opp.companyName}</h6>
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                        Cutoff: {opp.eligibilityCgpa.toFixed(2)} CGPA | Deadline: {opp.applicationDeadline}
                      </div>
                    </div>
                    <span className="badge badge-status eligible fw-bold" style={{ fontSize: '0.72rem' }}>
                      {opp.packageAmount} LPA
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted small">No drive recommendations matching your criteria at this moment.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Future AI Roadmap Architecture */}
      <div className="card custom-card p-4 shadow-sm border-0 bg-primary bg-opacity-5">
        <h5 className="fw-bold text-dark mb-3 d-flex align-items-center">
          <span className="me-2">🤖</span> Placement AI Engine - Future Roadmap
        </h5>
        <p className="text-muted small mb-4">
          Visual architecture illustrating future AI-driven placement enhancement models targeted for subsequent releases.
        </p>

        <div className="row g-3">
          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-white rounded-3 border text-center h-100 shadow-sm">
              <div className="fs-3 mb-2">📄</div>
              <h6 className="fw-bold text-dark small mb-1">AI Resume Analyzer</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>Keyword scoring, formats check, and automatic skill matching matching target recruiters.</p>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-white rounded-3 border text-center h-100 shadow-sm">
              <div className="fs-3 mb-2">📈</div>
              <h6 className="fw-bold text-dark small mb-1">Success Predictor</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>Likelihood prediction of clearing tests based on historic selection stats.</p>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-white rounded-3 border text-center h-100 shadow-sm">
              <div className="fs-3 mb-2">🧩</div>
              <h6 className="fw-bold text-dark small mb-1">Skill Gap Analysis</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>Identifies missing branches/skills and matches online study guidelines manuals.</p>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="p-3 bg-white rounded-3 border text-center h-100 shadow-sm">
              <div className="fs-3 mb-2">🧭</div>
              <h6 className="fw-bold text-dark small mb-1">Career Guidance</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>AI mentor providing round-wise prep paths and placement warnings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadinessDashboard;
