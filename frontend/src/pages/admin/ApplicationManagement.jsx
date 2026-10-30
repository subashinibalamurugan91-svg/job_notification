import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/api';

const ApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedApp, setSelectedApp] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('SHORTLISTED');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState(''); // '' | 'QUALIFIED' | 'NEEDS_UPSKILL'
  const [minCgpa, setMinCgpa] = useState('');
  const [minPackage, setMinPackage] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState('appliedDate'); // 'appliedDate', 'studentName', 'companyName', 'studentCgpa', 'skillMatchPercentage'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, statusFilter, skillFilter, minCgpa, minPackage, sortField, sortOrder]);

  const fetchApplications = async () => {
    try {
      const data = await applicationService.getAllApplications();
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpdate = (app) => {
    setSelectedApp(app);
    setUpdateStatus(app.status);
    setRemarks('');
    setError('');
    setSuccess('');
    setIsUpdateModalOpen(true);
    fetchHistory(app.applicationId);
  };

  const fetchHistory = async (id) => {
    setHistoryLoading(true);
    try {
      const data = await applicationService.getHistory(id);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching logs', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitStatus = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await applicationService.updateStatus(selectedApp.applicationId, updateStatus, remarks);
      setSuccess('Application status updated successfully!');
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        fetchApplications();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed.');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  const statuses = [
    'APPLIED',
    'SHORTLISTED',
    'APTITUDE_CLEARED',
    'TECHNICAL_CLEARED',
    'HR_CLEARED',
    'SELECTED',
    'REJECTED'
  ];

  // Filter and Sort Logic
  const filtered = applications.filter(app => {
    const matchesSearch = app.studentName.toLowerCase().includes(search.toLowerCase()) || 
                          app.studentRegNo.toLowerCase().includes(search.toLowerCase()) ||
                          app.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === '' || app.studentDepartment.toLowerCase() === deptFilter.toLowerCase();
    const matchesStatus = statusFilter === '' || app.status === statusFilter;
    const matchesSkill = skillFilter === '' ||
      (skillFilter === 'QUALIFIED' && (app.skillMatchPercentage || 0) >= 60) ||
      (skillFilter === 'NEEDS_UPSKILL' && (app.skillMatchPercentage || 0) < 60);
    const matchesCgpa = minCgpa === '' || app.studentCgpa >= parseFloat(minCgpa);
    const matchesPackage = minPackage === '' || app.packageAmount >= parseFloat(minPackage);
    return matchesSearch && matchesDept && matchesStatus && matchesSkill && matchesCgpa && matchesPackage;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'studentCgpa' || sortField === 'skillMatchPercentage') {
      const aNum = aVal != null ? parseFloat(aVal) : 0;
      const bNum = bVal != null ? parseFloat(bVal) : 0;
      return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    }
    if (sortField === 'appliedDate') {
      return sortOrder === 'asc' 
        ? new Date(aVal) - new Date(bVal) 
        : new Date(bVal) - new Date(aVal);
    }

    aVal = String(aVal || '').toLowerCase();
    bVal = String(bVal || '').toLowerCase();
    return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  // Pagination Slicing
  const totalAppsCount = sorted.length;
  const totalPages = Math.ceil(totalAppsCount / pageSize);
  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentRecords = sorted.slice(indexOfFirstRecord, indexOfLastRecord);

  // Client-side CSV Export helper
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Roll Number', 'Department', 'CGPA', 'Company', 'Applied Date', 'Status'];
    const rows = filtered.map(a => [
      a.studentName,
      a.studentRegNo,
      a.studentDepartment,
      a.studentCgpa.toFixed(2),
      a.companyName,
      new Date(a.appliedDate).toLocaleDateString(),
      a.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applicant_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '🔼' : '🔽';
  };

  const departments = Array.from(new Set(applications.map(a => a.studentDepartment)));

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0 text-dark">Recruitment Applications Processing</h2>
          <p className="text-muted small mb-0">Track student application statuses, change recruitment rounds, and add coordinator feedback</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="btn btn-success btn-sm py-2 px-3 fw-bold text-white border-0 rounded-3"
          disabled={filtered.length === 0}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Advanced Filter Card */}
      <div className="filter-card shadow-sm mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label small fw-bold text-secondary">Search student or company</label>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search name, roll no, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold text-secondary">Branch / Dept</label>
            <select
              className="form-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Branches</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold text-secondary">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold text-secondary">Skill Match Gate</label>
            <select
              className="form-select"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="">All Skill Scores</option>
              <option value="QUALIFIED">✓ Qualified (≥ 60%)</option>
              <option value="NEEDS_UPSKILL">✕ Below Cutoff (&lt; 60%)</option>
            </select>
          </div>
          <div className="col-md-1.5 col-sm-6">
            <label className="form-label small fw-bold text-secondary">Min CGPA</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 8.0"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
            />
          </div>
          <div className="col-md-1.5 col-sm-6">
            <label className="form-label small fw-bold text-secondary">Min CTC</label>
            <input
              type="number"
              step="0.5"
              className="form-control"
              placeholder="e.g. 10.0"
              value={minPackage}
              onChange={(e) => setMinPackage(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Applications Data Grid */}
      <div className="card custom-card shadow-sm border-0 rounded-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr>
                <th onClick={() => handleSort('studentName')} style={{ cursor: 'pointer' }} aria-label="Sort by name">
                  Student {getSortIcon('studentName')}
                </th>
                <th>Roll Number</th>
                <th onClick={() => handleSort('studentDepartment')} style={{ cursor: 'pointer' }} aria-label="Sort by department">
                  Department {getSortIcon('studentDepartment')}
                </th>
                <th onClick={() => handleSort('studentCgpa')} style={{ cursor: 'pointer' }} className="text-center" aria-label="Sort by CGPA">
                  CGPA {getSortIcon('studentCgpa')}
                </th>
                <th onClick={() => handleSort('skillMatchPercentage')} style={{ cursor: 'pointer' }} className="text-center" aria-label="Sort by Skill Match">
                  Skill Match {getSortIcon('skillMatchPercentage')}
                </th>
                <th onClick={() => handleSort('companyName')} style={{ cursor: 'pointer' }} aria-label="Sort by company">
                  Company {getSortIcon('companyName')}
                </th>
                <th onClick={() => handleSort('appliedDate')} style={{ cursor: 'pointer' }} aria-label="Sort by application date">
                  Applied Date {getSortIcon('appliedDate')}
                </th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length > 0 ? (
                currentRecords.map((app) => (
                  <tr key={app.applicationId}>
                    <td className="fw-semibold text-secondary">{app.studentName}</td>
                    <td className="small">{app.studentRegNo}</td>
                    <td className="small text-muted">{app.studentDepartment}</td>
                    <td className="text-center fw-bold text-dark">{app.studentCgpa.toFixed(2)}</td>
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center">
                        <span className={`badge ${app.skillMatchPercentage >= 60 ? 'bg-success' : 'bg-warning text-dark'} fw-bold px-2 py-1`}>
                          {app.skillMatchPercentage != null ? `${app.skillMatchPercentage}%` : 'N/A'}
                        </span>
                        {app.skillMatchPercentage != null && (
                          <span className="text-muted" style={{ fontSize: '0.62rem' }}>
                            {app.skillMatchPercentage >= 60 ? '✓ ≥60%' : '✕ <60%'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="fw-bold text-primary">{app.companyName}</td>
                    <td className="small text-muted">{new Date(app.appliedDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-status ${app.status.toLowerCase()}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-primary py-1 px-3 shadow-sm fw-semibold rounded-3" onClick={() => handleOpenUpdate(app)}>
                        📝 Process Step
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted small">No student applications logged for placement drives.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        {totalAppsCount > 0 && (
          <div className="card-footer bg-transparent border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-start">
            <div className="small text-secondary">
              Showing <strong>{indexOfFirstRecord + 1}</strong> to <strong>{Math.min(indexOfLastRecord, totalAppsCount)}</strong> of <strong>{totalAppsCount}</strong> applicant records
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-1.5 small text-secondary">
                <span>Show:</span>
                <select 
                  className="form-select form-select-sm py-0.5" 
                  value={pageSize} 
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: '70px' }}
                  aria-label="Select items per page size"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              {totalPages > 1 && (
                <nav aria-label="Table navigation page layout" className="m-0">
                  <ul className="pagination pagination-sm m-0 gap-1">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link rounded-3 border-0 bg-light"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous Page"
                      >
                        Previous
                      </button>
                    </li>
                    <li className="page-item active">
                      <span className="page-link rounded-3 border-0">
                        {currentPage} / {totalPages}
                      </span>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link rounded-3 border-0 bg-light"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next Page"
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update Modal containing Stepper details and History logs */}
      {isUpdateModalOpen && selectedApp && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.75)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content p-4 rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 p-0 mb-3">
                <h5 className="modal-title fw-bold text-primary fs-4">
                  ⚙️ Process Application - {selectedApp.studentName} ({selectedApp.companyName})
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsUpdateModalOpen(false)}></button>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              {/* Two-Stage Eligibility Verification Card */}
              <div className="card custom-card border-0 bg-light bg-opacity-70 p-3 mb-4 rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="fw-bold text-dark small">🎯 Two-Stage Eligibility Verification</div>
                  <span className={`badge ${selectedApp.skillMatchPercentage >= 60 ? 'bg-success' : 'bg-warning text-dark'} fw-bold`}>
                    {selectedApp.skillMatchPercentage != null ? `${selectedApp.skillMatchPercentage}% Match` : 'N/A'}
                  </span>
                </div>
                <div className="row g-2 small">
                  <div className="col-sm-6">
                    <div className="p-2 rounded bg-white border">
                      <span className="text-muted">Stage 1 (CGPA):</span>{' '}
                      <strong className="text-dark">{selectedApp.studentCgpa?.toFixed(2)}</strong>{' '}
                      <span className="badge bg-success bg-opacity-10 text-success ms-1">Cleared</span>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-2 rounded bg-white border">
                      <span className="text-muted">Stage 2 (Skill Match):</span>{' '}
                      <strong className={selectedApp.skillMatchPercentage >= 60 ? 'text-success' : 'text-danger'}>
                        {selectedApp.skillMatchPercentage}%
                      </strong>{' '}
                      <span className={`badge ${selectedApp.skillMatchPercentage >= 60 ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-15 text-dark'} ms-1`}>
                        {selectedApp.skillMatchPercentage >= 60 ? '≥ 60% Met' : '< 60% Cutoff'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApp.matchedSkills && selectedApp.matchedSkills.length > 0 && (
                  <div className="mt-2.5">
                    <div className="text-success small fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                      ✓ Matched Skills ({selectedApp.matchedSkills.length}):
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {selectedApp.matchedSkills.map(s => (
                        <span key={s} className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25" style={{ fontSize: '0.68rem' }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.missingSkills && selectedApp.missingSkills.length > 0 && (
                  <div className="mt-2">
                    <div className="text-danger small fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                      ✕ Missing Skills ({selectedApp.missingSkills.length}):
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {selectedApp.missingSkills.map(s => (
                        <span key={s} className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.68rem' }}>
                          ✕ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="row g-4">
                {/* Form column */}
                <div className="col-md-6 border-end">
                  <form onSubmit={handleSubmitStatus}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Move Status To</label>
                      <select
                        className="form-select"
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        required
                      >
                        {statuses.map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-semibold">Status Remarks / Round Feedback</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="e.g. Cleared online coding test, scheduled coding round 1."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        required
                      />
                    </div>

                    <div className="d-flex gap-2 justify-content-end pt-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm">Update Status</button>
                    </div>
                  </form>
                </div>

                {/* Audit history logs column */}
                <div className="col-md-6">
                  <h6 className="fw-bold mb-3 text-secondary border-bottom pb-2">📜 State History Logs</h6>
                  {historyLoading ? (
                    <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" role="status"></div></div>
                  ) : history.length > 0 ? (
                    <div className="d-flex flex-column gap-3 overflow-y-auto" style={{ maxHeight: '280px' }}>
                      {history.map((log) => (
                        <div key={log.historyId} className="border-start border-3 border-primary ps-3 py-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className={`badge badge-status ${log.currentStatus.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                              {log.currentStatus.replace('_', ' ')}
                            </span>
                            <span className="small text-muted" style={{ fontSize: '0.72rem' }}>{new Date(log.updatedAt).toLocaleDateString()}</span>
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
                    <div className="text-center py-4 text-muted small">No logs recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;
