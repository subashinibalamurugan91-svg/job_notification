import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { companyService, driveService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EligibilityPipeline from '../../components/EligibilityPipeline';

const CompanyManagement = () => {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search, Filter, Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Diagnostics Drawer state
  const [diagnosticsData, setDiagnosticsData] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Two-Stage Eligibility Pipeline Modal state
  const [pipelineData, setPipelineData] = useState(null);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    eligibilityCgpa: '0.0',
    eligibleDepartments: '',
    packageAmount: '',
    applicationDeadline: '',
    driveDate: '',
    active: true,
    requiredSkillsText: ''
  });

  // Theme styling helpers for Recharts elements (Midnight Plum & Champagne Gold)
  const isDarkMode = document.body.classList.contains('dark-mode');
  const primaryColor = isDarkMode ? '#E0BA72' : '#3A2547';
  const successColor = isDarkMode ? '#34A388' : '#27836C';
  const gridStrokeColor = isDarkMode ? '#3D264E' : '#E5DDE9';
  const tooltipStyle = {
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    boxShadow: '0 4px 14px rgba(36, 21, 47, 0.12)'
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Reset pagination on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  const fetchCompanies = async () => {
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching drives list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setFormData({
      companyName: '',
      description: '',
      eligibilityCgpa: '0.0',
      eligibleDepartments: '',
      packageAmount: '',
      applicationDeadline: '',
      driveDate: '',
      active: true,
      requiredSkillsText: ''
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      companyName: company.companyName,
      description: company.description || '',
      eligibilityCgpa: String(company.eligibilityCgpa),
      eligibleDepartments: company.eligibleDepartments,
      packageAmount: String(company.packageAmount),
      applicationDeadline: company.applicationDeadline,
      driveDate: company.driveDate,
      active: company.active,
      requiredSkillsText: (company.requiredSkills || []).join(', ')
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedSkills = formData.requiredSkillsText
      ? formData.requiredSkillsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const body = {
      ...formData,
      eligibilityCgpa: parseFloat(formData.eligibilityCgpa),
      packageAmount: parseFloat(formData.packageAmount),
      requiredSkills: parsedSkills
    };

    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.companyId, body);
        setSuccess('Placement drive updated successfully!');
      } else {
        await companyService.createCompany(body);
        setSuccess('Placement drive created successfully!');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchCompanies();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this placement drive? All associated applicant logs will be removed.')) {
      return;
    }
    try {
      await companyService.deleteCompany(id);
      fetchCompanies();
    } catch (err) {
      console.error(err);
      alert('Could not delete placement drive.');
    }
  };

  // Open diagnostics analytics drawer
  const handleOpenDiagnostics = async (companyId) => {
    setDrawerLoading(true);
    setIsDrawerOpen(true);
    setDiagnosticsData(null);
    try {
      const data = await driveService.getDriveAnalytics(companyId);
      setDiagnosticsData(data);
    } catch (err) {
      toast.error('Failed to load drive diagnostic summaries.');
      setIsDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Open Two-Stage Eligibility Pipeline Modal
  const handleOpenPipeline = async (companyId) => {
    try {
      const data = await companyService.getEligibilityPipeline(companyId);
      setPipelineData(data);
      setIsPipelineModalOpen(true);
    } catch (err) {
      toast.error('Failed to load eligibility pipeline for drive.');
    }
  };

  // Dispatch Targeted Notifications for Eligible Students
  const handleNotifyEligible = async (companyId) => {
    setIsNotifying(true);
    try {
      const res = await companyService.notifyEligible(companyId);
      toast.success(`Dispatched targeted notifications & emails to ${res.notificationsSent} eligible candidates!`);
      const updated = await companyService.getEligibilityPipeline(companyId);
      setPipelineData(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch notifications.');
    } finally {
      setIsNotifying(false);
    }
  };

  // Get dynamic status label based on calendar dates
  const getDriveStatus = (company) => {
    const today = new Date();
    const deadline = new Date(company.applicationDeadline);
    const driveDate = new Date(company.driveDate);

    const upcomingThreshold = new Date(deadline);
    upcomingThreshold.setDate(deadline.getDate() - 7);

    if (today < upcomingThreshold) return 'Upcoming';
    if (today <= deadline) return 'Registration Open';
    if (today < driveDate) return 'Registration Closed';
    if (today.toDateString() === driveDate.toDateString()) return 'Interview Ongoing';
    return 'Completed';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'Registration Open') return 'eligible';
    if (status === 'Upcoming') return 'shortlisted';
    if (status === 'Completed') return 'rejected';
    if (status === 'Registration Closed') return 'shortlisted';
    return 'rejected'; // Interview Ongoing
  };

  // Filter and Sort Companies List
  const filteredCompanies = companies
    .filter(c => c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(c => {
      const status = getDriveStatus(c);
      if (statusFilter === 'ALL') return true;
      return status.toUpperCase().replace(' ', '_') === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'package') return b.packageAmount - a.packageAmount;
      if (sortBy === 'cgpa') return b.eligibilityCgpa - a.eligibilityCgpa;
      if (sortBy === 'deadline') return new Date(a.applicationDeadline) - new Date(b.applicationDeadline);
      return a.companyName.localeCompare(b.companyName);
    });

  // Paginated Slicing
  const totalCompaniesCount = filteredCompanies.length;
  const totalPages = Math.ceil(totalCompaniesCount / pageSize);
  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentRecords = filteredCompanies.slice(indexOfFirstRecord, indexOfLastRecord);

  // Client-side CSV Export helper
  const handleExportCSV = () => {
    const headers = ['Company Name', 'Min CGPA', 'Eligible Branches', 'Package (LPA)', 'Deadline', 'Drive Date', 'Status'];
    const rows = filteredCompanies.map(c => [
      c.companyName,
      c.eligibilityCgpa.toFixed(2),
      c.eligibleDepartments,
      c.packageAmount.toFixed(2),
      new Date(c.applicationDeadline).toLocaleDateString(),
      new Date(c.driveDate).toLocaleDateString(),
      getDriveStatus(c)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `placement_drives_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold m-0 text-dark">Placement Drive Configuration</h2>
          <p className="text-muted small mb-0">Configure recruitment eligibility, packages, and timeline schedules</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="btn btn-success btn-sm py-2 px-3 fw-bold text-white border-0 rounded-3"
            disabled={filteredCompanies.length === 0}
          >
            📥 Export CSV
          </button>
          <button className="btn btn-primary fw-semibold py-2 px-4 shadow-sm" onClick={handleOpenCreate}>
            ➕ Set New Placement Drive
          </button>
        </div>
      </div>

      {/* Search, Filter, Sort Controls Panel */}
      <div className="filter-card shadow-sm mb-4">
        <div className="row g-3">
          <div className="col-md-5">
            <label className="form-label small fw-semibold">Search Recruiter</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="🔍 Search by company name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <label className="form-label small fw-semibold">Drive Status Filter</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Drives</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="REGISTRATION_OPEN">Registration Open</option>
              <option value="REGISTRATION_CLOSED">Registration Closed</option>
              <option value="INTERVIEW_ONGOING">Interview Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="col-md-4 col-sm-6">
            <label className="form-label small fw-semibold">Sort By</label>
            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Company Name (A-Z)</option>
              <option value="package">Highest Package (LPA)</option>
              <option value="cgpa">Highest Eligibility CGPA</option>
              <option value="deadline">Upcoming Deadline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Drives list table */}
      <div className="card custom-card shadow-sm mb-4 border-0 rounded-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Min CGPA</th>
                <th>Eligible Branches</th>
                <th>Package (LPA)</th>
                <th>Deadline</th>
                <th>Drive Date</th>
                <th className="text-center">Live Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length > 0 ? (
                currentRecords.map((company) => {
                  const status = getDriveStatus(company);
                  return (
                    <tr key={company.companyId}>
                      <td>
                        <div className="fw-bold text-dark">{company.companyName}</div>
                        {company.requiredSkills && company.requiredSkills.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {company.requiredSkills.map(s => (
                              <span key={s} className="badge bg-light text-primary border" style={{ fontSize: '0.68rem' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="fw-semibold">{company.eligibilityCgpa.toFixed(2)}</td>
                      <td className="small text-secondary">{company.eligibleDepartments}</td>
                      <td className="fw-bold text-primary">{company.packageAmount.toFixed(2)} LPA</td>
                      <td className="small">{new Date(company.applicationDeadline).toLocaleDateString()}</td>
                      <td className="small">{new Date(company.driveDate).toLocaleDateString()}</td>
                      <td className="text-center">
                        <span className={`badge badge-status ${getStatusBadgeColor(status)} text-uppercase fw-bold`} style={{ fontSize: '0.65rem' }}>
                          {status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button 
                          className="btn btn-sm btn-outline-success me-2 fw-semibold" 
                          onClick={() => handleOpenPipeline(company.companyId)}
                          title="View 4-Stage Eligibility Pipeline & Notify Eligible Candidates"
                        >
                          🎯 Pipeline
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-info me-2 fw-semibold" 
                          onClick={() => handleOpenDiagnostics(company.companyId)}
                        >
                          📊 Diagnostics
                        </button>
                        <button className="btn btn-sm btn-outline-primary me-2 fw-semibold" onClick={() => handleOpenEdit(company)}>
                          ⚙️ Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger fw-semibold" onClick={() => handleDelete(company.companyId)}>
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted small">No active drives match search filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        {totalCompaniesCount > 0 && (
          <div className="card-footer bg-transparent border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-start">
            <div className="small text-secondary">
              Showing <strong>{indexOfFirstRecord + 1}</strong> to <strong>{Math.min(indexOfLastRecord, totalCompaniesCount)}</strong> of <strong>{totalCompaniesCount}</strong> drives logs
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

      {/* Slide-out Diagnostics Drawer Overlay */}
      {isDrawerOpen && (
        <div className="offcanvas offcanvas-end show border-0 shadow-lg" tabIndex="-1" style={{ visibility: 'visible', width: '500px', backgroundColor: 'var(--card-bg)' }}>
          <div className="offcanvas-header border-bottom p-4">
            <h5 className="offcanvas-title fw-bold text-dark">📊 {diagnosticsData?.companyName} Analytics</h5>
            <button type="button" className="btn-close" onClick={() => setIsDrawerOpen(false)} aria-label="Close"></button>
          </div>
          <div className="offcanvas-body p-4 overflow-y-auto">
            {drawerLoading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : diagnosticsData ? (
              <div>
                {/* Metric grid */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <div className="small text-muted fw-semibold">Total Registrations</div>
                      <div className="fs-4 fw-bold text-dark">{diagnosticsData.totalRegistrations}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <div className="small text-muted fw-semibold">Eligible Student Pool</div>
                      <div className="fs-4 fw-bold text-primary">{diagnosticsData.eligibleCount}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <div className="small text-muted fw-semibold">Selections Offer</div>
                      <div className="fs-4 fw-bold text-success">{diagnosticsData.selectedCount}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <div className="small text-muted fw-semibold">Drive Success Rate</div>
                      <div className="fs-4 fw-bold text-warning">{diagnosticsData.successRate}%</div>
                    </div>
                  </div>
                </div>

                {/* Funnel Graph */}
                <h6 className="fw-bold text-dark mb-3">📈 Recruitment Progression Funnel</h6>
                <div className="mb-4" style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer>
                    <AreaChart data={diagnosticsData.funnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                      <XAxis type="number" stroke="var(--text-secondary)" />
                      <YAxis dataKey="stage" type="category" stroke="var(--text-secondary)" fontSize={9} width={90} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area dataKey="candidates" name="Candidates" stroke={primaryColor} fill={primaryColor} fillOpacity={0.12} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Department Registration comparison */}
                <h6 className="fw-bold text-dark mb-3">🎓 Branch Participation Details</h6>
                <div style={{ width: '100%', height: '200px' }}>
                  {diagnosticsData.departmentStats.length > 0 ? (
                    <ResponsiveContainer>
                      <BarChart data={diagnosticsData.departmentStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                        <XAxis type="number" stroke="var(--text-secondary)" />
                        <YAxis dataKey="departmentName" type="category" stroke="var(--text-secondary)" fontSize={9} width={95} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="registrations" name="Registered" fill={primaryColor} radius={[0, 4, 4, 0]} barSize={12} />
                        <Bar dataKey="selections" name="Selected" fill={successColor} radius={[0, 4, 4, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-4 text-muted small">No branch registrations logged.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">Diagnostics data could not be computed.</div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal Container */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.75)', backdropFilter: 'blur(3px)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content p-4 rounded-4 border-0 shadow-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="modal-header border-0 p-0 mb-3">
                <h5 className="modal-title fw-bold text-primary fs-4">
                  {editingCompany ? '⚙️ Edit Placement Drive' : '🏢 Configure New Placement Drive'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      className="form-control"
                      placeholder="e.g. Google"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Package (LPA)</label>
                    <input
                      type="number"
                      name="packageAmount"
                      step="0.1"
                      className="form-control"
                      placeholder="e.g. 15.0"
                      value={formData.packageAmount}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Profile / Role Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    placeholder="Provide details on profile role expectations, tech stack, and location..."
                    value={formData.description}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Required Technical Skills (comma-separated list/tags)</label>
                  <input
                    type="text"
                    name="requiredSkillsText"
                    className="form-control"
                    placeholder="e.g. Java, Spring Boot, MySQL, React"
                    value={formData.requiredSkillsText}
                    onChange={handleFormChange}
                  />
                  <div className="form-text small text-muted">
                    Evaluated in Stage 2 of the Eligibility Engine (students must match ≥ 60% of these skills).
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Eligibility CGPA Cutoff</label>
                    <input
                      type="number"
                      name="eligibilityCgpa"
                      step="0.01"
                      className="form-control"
                      value={formData.eligibilityCgpa}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Eligible Branches (comma-separated)</label>
                    <input
                      type="text"
                      name="eligibleDepartments"
                      className="form-control"
                      placeholder="e.g. Computer Science, Information Technology"
                      value={formData.eligibleDepartments}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Application Deadline Date</label>
                    <input
                      type="date"
                      name="applicationDeadline"
                      className="form-control"
                      value={formData.applicationDeadline}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label small fw-semibold">Drive Execution Date</label>
                    <input
                      type="date"
                      name="driveDate"
                      className="form-control"
                      value={formData.driveDate}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-check form-switch mb-4 mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    name="active"
                    checked={formData.active}
                    onChange={handleFormChange}
                    id="activeSwitch"
                  />
                  <label className="form-check-label small fw-semibold text-secondary" htmlFor="activeSwitch">Active / Open for Application Submission</label>
                </div>

                <div className="modal-footer border-0 p-0 pt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm">Save Drive</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Two-Stage Eligibility Pipeline Modal */}
      {isPipelineModalOpen && pipelineData && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.8)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom px-4 py-3 bg-light">
                <div>
                  <h5 className="modal-title fw-bold text-dark m-0">
                    🎯 {pipelineData.companyName} - Eligibility Engine Pipeline
                  </h5>
                  <p className="text-secondary small mb-0">
                    Two-Stage Verification: CGPA Cutoff ({pipelineData.requiredCgpa} CGPA) + Skill Match (≥ 60%)
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsPipelineModalOpen(false)} aria-label="Close"></button>
              </div>

              <div className="modal-body p-4">
                {/* 4-Stage Stepper Pipeline */}
                <EligibilityPipeline
                  mode="admin"
                  pipelineData={pipelineData}
                  onNotifyEligible={() => handleNotifyEligible(pipelineData.companyId)}
                  isNotifying={isNotifying}
                />

                {/* Candidate Breakdown Table */}
                <div className="card custom-card border-0 shadow-sm mt-4 p-3 rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">Candidate Verification Breakdown ({pipelineData.candidates?.length || 0} Students)</h6>
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2.5 py-1">
                      {pipelineData.finalEligibleStudents} Fully Eligible
                    </span>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '360px' }}>
                    <table className="table table-sm table-hover align-middle m-0">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Reg No</th>
                          <th>CGPA</th>
                          <th>Stage 1 (CGPA)</th>
                          <th>Stage 2 (Skill Match)</th>
                          <th>Matched Skills</th>
                          <th>Missing Skills</th>
                          <th className="text-center">Final Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pipelineData.candidates && pipelineData.candidates.length > 0 ? (
                          pipelineData.candidates.map((cand) => (
                            <tr key={cand.studentId}>
                              <td className="fw-bold text-dark">{cand.studentName}</td>
                              <td className="small text-secondary">{cand.studentRegNo}</td>
                              <td className="fw-semibold">{cand.studentCgpa?.toFixed(2)}</td>
                              <td>
                                <span className={`badge ${cand.cgpaEligible ? 'bg-success' : 'bg-danger'}`}>
                                  {cand.cgpaEligible ? 'Passed' : 'CGPA Not Eligible'}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-1.5">
                                  <span className={`fw-bold small ${cand.skillEligible ? 'text-success' : 'text-danger'}`}>
                                    {cand.skillMatchPercentage}%
                                  </span>
                                  <span className={`badge ${cand.skillEligible ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-15 text-dark'}`} style={{ fontSize: '0.65rem' }}>
                                    {cand.skillEligible ? '≥60%' : '<60%'}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '180px' }}>
                                  {cand.matchedSkills && cand.matchedSkills.length > 0 ? (
                                    cand.matchedSkills.map(s => (
                                      <span key={s} className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25" style={{ fontSize: '0.65rem' }}>
                                        ✓ {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-muted small">None</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '180px' }}>
                                  {cand.missingSkills && cand.missingSkills.length > 0 ? (
                                    cand.missingSkills.map(s => (
                                      <span key={s} className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25" style={{ fontSize: '0.65rem' }}>
                                        ✕ {s}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-success small fw-semibold">0 missing</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                <span className={`badge ${cand.finalEligible ? 'bg-success text-white' : 'bg-danger text-white'} fw-bold px-2 py-1`}>
                                  {cand.finalEligible ? '✓ ELIGIBLE' : '✕ INELIGIBLE'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-3 text-muted">No student evaluations found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 p-3 bg-light">
                <button type="button" className="btn btn-secondary px-4 fw-semibold" onClick={() => setIsPipelineModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
