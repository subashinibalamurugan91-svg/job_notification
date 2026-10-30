import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { readinessService } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminReadiness = () => {
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await readinessService.getAdminSummary();
      setSummary(data);
    } catch (err) {
      toast.error('Failed to load portal readiness summary statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyStudent = (name) => {
    toast.success(`Sent academic counseling notification to ${name}!`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Analyzing student preparation risk parameters...</p>
      </div>
    );
  }

  const averageScore = summary?.averageReadinessScore || 0;
  const atRiskCount = summary?.atRiskCount || 0;
  const totalStudents = summary?.totalStudents || 0;
  const deptAverages = summary?.deptAverages || [];
  const atRiskStudents = summary?.atRiskStudents || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">Student Placement Readiness</h2>
          <p className="text-muted small mb-0">Monitor collective readiness metrics and identify candidates at risk of missing placements</p>
        </div>
        
        <button 
          onClick={fetchSummary}
          className="btn btn-secondary btn-sm py-1.5 px-3 fw-bold no-print"
          style={{ fontSize: '0.8rem' }}
        >
          🔄 Refresh Diagnostic
        </button>
      </div>

      {/* Metrics widgets */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="metric-card shadow-sm h-100 border-start-0 border-top border-4 border-primary">
            <div className="metric-title text-secondary">Global Average Readiness</div>
            <div className="metric-value text-primary">{averageScore} / 100</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="metric-card shadow-sm h-100 border-start-0 border-top border-4 border-danger">
            <div className="metric-title text-danger">At-Risk Students Count</div>
            <div className="metric-value text-danger">{atRiskCount}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="metric-card shadow-sm h-100 border-start-0 border-top border-4 border-secondary">
            <div className="metric-title text-secondary">Total Diagnostic Pool</div>
            <div className="metric-value">{totalStudents} Students</div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Department Average Chart */}
        <div className="col-lg-7">
          <div className="card custom-card p-4 shadow-sm border-0 h-100">
            <h5 className="fw-bold text-dark mb-3">🎓 Branch Readiness Comparison</h5>
            <p className="text-muted small mb-4">Compares the average readiness index scores across engineering branches.</p>
            
            <div style={{ width: '100%', height: '260px' }}>
              {deptAverages.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={deptAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="departmentName" stroke="var(--text-secondary)" fontSize={9} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="averageScore" name="Avg Readiness Score" fill="#3A2547" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted small">No department statistics computed.</div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Threshold description card */}
        <div className="col-lg-5">
          <div className="card custom-card p-4 shadow-sm border-0 bg-danger bg-opacity-5 h-100">
            <h5 className="fw-bold text-danger mb-3 d-flex align-items-center">
              <span className="me-2">⚠</span> Diagnostic Risk Thresholds
            </h5>
            <p className="small text-secondary mb-3">
              Students are automatically flagged as <strong>"At Risk"</strong> by the system engine if they meet <strong>all</strong> of the following criteria:
            </p>
            <ul className="small text-secondary d-flex flex-column gap-2 mb-4">
              <li>🚫 Has submitted <strong>zero (0)</strong> active company drive applications.</li>
              <li>📄 Has <strong>no resume PDF</strong> uploaded or verified on the profile center.</li>
              <li>📅 Has participated in <strong>zero (0)</strong> interview round schedules.</li>
            </ul>
            <div className="small text-muted mt-auto" style={{ fontSize: '0.75rem' }}>
              TPO Administrators are advised to initiate counselor meetings or send registration reminders immediately to these candidates.
            </div>
          </div>
        </div>
      </div>

      {/* At-risk student list */}
      <div className="card custom-card p-4 shadow-sm border-0">
        <h5 className="fw-bold text-dark mb-3">🚨 At-Risk Student Directory</h5>
        
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Student Name</th>
                <th>Department</th>
                <th className="text-center">CGPA</th>
                <th className="text-center">Readiness Index</th>
                <th className="text-center">TPO Action</th>
              </tr>
            </thead>
            <tbody>
              {atRiskStudents.length > 0 ? (
                atRiskStudents.map((s) => (
                  <tr key={s.studentId}>
                    <td className="fw-bold text-dark">{s.regNo}</td>
                    <td className="fw-semibold text-secondary">{s.name}</td>
                    <td className="small text-muted">{s.department}</td>
                    <td className="text-center fw-bold text-primary">{s.cgpa.toFixed(2)}</td>
                    <td className="text-center">
                      <span className="badge badge-status rejected fw-bold">
                        {s.readinessScore} / 100
                      </span>
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => handleNotifyStudent(s.name)}
                        className="btn btn-outline-danger btn-sm py-1 px-3 fw-bold"
                        style={{ fontSize: '0.78rem' }}
                      >
                        📧 Alert Candidate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted small">
                    🎉 Excellent! Zero students matched the placement risk thresholds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReadiness;
