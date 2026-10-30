import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationService } from '../../services/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await applicationService.getMyApplications();
      setApplications(data);
      if (data.length > 0) {
        handleViewHistory(data[0]); // default to first application
      }
    } catch (err) {
      console.error('Error fetching applications list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (app) => {
    setSelectedApp(app);
    setHistoryLoading(true);
    try {
      const data = await applicationService.getHistory(app.applicationId);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching status logs', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Skeleton Loader UI
  if (loading) {
    return (
      <div className="container-fluid py-2">
        <div className="skeleton skeleton-title" style={{ height: '32px', width: '300px' }}></div>
        <div className="skeleton skeleton-text medium mb-4"></div>
        <div className="row g-4">
          <div className="col-md-5">
            <div className="card custom-card p-3 border-0 shadow-sm">
              <div className="skeleton skeleton-title mb-3" style={{ width: '150px' }}></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-3 mb-2 border-0 bg-light">
                  <div className="skeleton skeleton-text short"></div>
                  <div className="skeleton skeleton-text medium"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-md-7">
            <div className="card custom-card p-4 border-0 shadow-sm" style={{ minHeight: '300px' }}>
              <div className="skeleton skeleton-title" style={{ width: '200px' }}></div>
              <div className="skeleton skeleton-text mb-4"></div>
              <div className="skeleton skeleton-text short"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stepper status definitions including ELIGIBLE
  const steps = [
    'ELIGIBLE',
    'APPLIED',
    'SHORTLISTED',
    'APTITUDE_CLEARED',
    'TECHNICAL_CLEARED',
    'HR_CLEARED',
    'SELECTED'
  ];

  const getStepClass = (stepKey, stepIndex, currentStatus) => {
    if (stepKey === 'ELIGIBLE') return 'completed';
    if (currentStatus === 'REJECTED') {
      return 'rejected';
    }
    const currentIdx = steps.indexOf(currentStatus);
    if (currentIdx >= stepIndex) {
      return currentIdx === stepIndex ? 'active' : 'completed';
    }
    return '';
  };

  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">My Submitted Applications</h2>
        <p className="text-muted small mb-0">Monitor your recruitment steps, rounds progress, and TPO feedback remarks</p>
      </div>

      {applications.length > 0 ? (
        <div className="row g-4">
          {/* Applications list */}
          <div className="col-md-5">
            <div className="card custom-card p-3 shadow-sm border-0 rounded-3">
              <h5 className="fw-bold text-dark mb-3 px-1">Application Drives</h5>
              <div className="d-flex flex-column gap-2">
                {applications.map((app) => {
                  const isSelected = selectedApp?.applicationId === app.applicationId;
                  return (
                    <div
                      key={app.applicationId}
                      onClick={() => handleViewHistory(app)}
                      className="p-3 rounded-3 transition-all"
                      style={{
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(214, 173, 96, 0.08)' : 'var(--card-bg)'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold m-0 text-dark" style={{ fontSize: '0.95rem' }}>{app.companyName}</h6>
                        <span className={`badge badge-status ${app.status.toLowerCase()}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="small text-secondary mb-1">
                        <strong>Package:</strong> {app.packageAmount.toFixed(2)} LPA
                      </div>
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                        Applied: {new Date(app.appliedDate).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stepper progress tracker & history log */}
          <div className="col-md-7">
            {selectedApp && (
              <div className="card custom-card p-4 shadow-sm border-0 rounded-3">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-2">
                  <h4 className="fw-bold text-dark m-0">{selectedApp.companyName} Tracker</h4>
                  <span className={`badge badge-status ${selectedApp.status.toLowerCase()} text-uppercase fw-bold`}>
                    {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress Stepper Timeline */}
                {selectedApp.status !== 'REJECTED' ? (
                  <div className="mb-4">
                    <ul className="status-stepper">
                      {steps.map((step, idx) => (
                        <li key={step} className={`status-step ${getStepClass(step, idx, selectedApp.status)}`}>
                          <div className="status-step-circle">
                            {step === 'ELIGIBLE' ? '✓' : idx}
                          </div>
                          <div className="status-step-label text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.3px' }}>
                            {step.replace('_', ' ').replace(' CLEARED', '')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="alert alert-danger border-0 bg-danger bg-opacity-10 text-danger text-center p-3 mb-4 rounded-3 fw-semibold">
                    🚫 This application was marked as REJECTED. Refer to coordinator logs details below.
                  </div>
                )}

                <hr className="my-4 text-muted opacity-25" />

                {/* Audit logs history */}
                <h5 className="fw-bold mb-3 text-dark">📜 Status Change History</h5>
                {historyLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                ) : history.length > 0 ? (
                  <div className="d-flex flex-column gap-3 mt-2">
                    {history.map((log) => (
                      <div key={log.historyId} className="border-start border-3 border-primary ps-3 py-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className={`badge badge-status ${log.currentStatus.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{log.currentStatus.replace('_', ' ')}</span>
                          <span className="small text-muted" style={{ fontSize: '0.72rem' }}>{new Date(log.updatedAt).toLocaleString()}</span>
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Updated by: {log.updatedBy}</div>
                        {log.remarks && (
                          <div className="small text-dark mt-1 bg-light p-2 rounded-2" style={{ fontSize: '0.78rem' }}>
                            📝 <em>{log.remarks}</em>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted small">No history logs recorded.</div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Professional Empty State */
        <div className="text-center py-5 border border-dashed rounded-3 bg-light bg-opacity-25 my-4">
          <span className="fs-1 d-block mb-3">📝</span>
          <h5 className="fw-bold text-dark">No Submitted Applications</h5>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '380px' }}>
            It looks like you haven't applied to any active recruitment drives yet. Register for eligible placement drives to build your timeline.
          </p>
          <Link to="/student/companies" className="btn btn-primary btn-sm px-4 py-2 fw-bold rounded-3">
            Browse Active Placement Drives
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
