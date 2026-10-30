import React, { useState, useEffect, useMemo } from 'react';
import { referenceService, companyService } from '../../services/api';

const CATEGORIES = [
  'All',
  'PDF Materials',
  'Aptitude Questions',
  'Coding Practice Sheets',
  'Interview Questions',
  'Previous Placement Papers',
  'Aptitude',
  'Technical',
  'HR Interview',
  'Resume',
  'Group Discussion',
  'Programming',
  'Placement Preparation'
];

const CATEGORY_COLORS = {
  'PDF Materials': { bg: 'bg-primary-subtle', text: 'text-primary', border: 'border-primary' },
  'Aptitude Questions': { bg: 'bg-primary-subtle', text: 'text-primary', border: 'border-primary' },
  'Coding Practice Sheets': { bg: 'bg-success-subtle', text: 'text-success', border: 'border-success' },
  'Interview Questions': { bg: 'bg-danger-subtle', text: 'text-danger', border: 'border-danger' },
  'Previous Placement Papers': { bg: 'bg-warning-subtle', text: 'text-warning-emphasis', border: 'border-warning' },
  'Aptitude': { bg: 'bg-primary-subtle', text: 'text-primary', border: 'border-primary' },
  'Technical': { bg: 'bg-purple-subtle', text: 'text-purple', border: 'border-purple' },
  'Programming': { bg: 'bg-success-subtle', text: 'text-success', border: 'border-success' },
  'Resume': { bg: 'bg-warning-subtle', text: 'text-warning-emphasis', border: 'border-warning' },
  'Group Discussion': { bg: 'bg-info-subtle', text: 'text-info-emphasis', border: 'border-info' },
  'HR Interview': { bg: 'bg-danger-subtle', text: 'text-danger', border: 'border-danger' },
  'Placement Preparation': { bg: 'bg-indigo-subtle', text: 'text-indigo', border: 'border-indigo' }
};

const ReferenceManagement = () => {
  const [references, setReferences] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ totalReferences: 0, totalDownloads: 0, categoryBreakdown: {} });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRef, setEditingRef] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Placement Preparation');
  const [description, setDescription] = useState('');
  const [uploadedBy, setUploadedBy] = useState('Placement Cell');
  const [companyId, setCompanyId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUploadedBy, setEditUploadedBy] = useState('');
  const [editCompanyId, setEditCompanyId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [refsData, companiesData, statsData] = await Promise.all([
        referenceService.getReferences(),
        companyService.getCompanies(),
        referenceService.getReferenceStats()
      ]);
      setReferences(refsData || []);
      setCompanies(companiesData || []);
      setStats(statsData || { totalReferences: 0, totalDownloads: 0, categoryBreakdown: {} });
    } catch (err) {
      console.error('Error fetching reference details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUpload = () => {
    setTitle('');
    setCategory('Placement Preparation');
    setDescription('');
    setUploadedBy('Placement Cell');
    setCompanyId('');
    setFile(null);
    setError('');
    setSuccess('');
    setIsUploadModalOpen(true);
  };

  const handleOpenEdit = (ref) => {
    setEditingRef(ref);
    setEditTitle(ref.title || '');
    setEditCategory(ref.category || 'Placement Preparation');
    setEditDescription(ref.description || '');
    setEditUploadedBy(ref.uploadedBy || 'Placement Cell');
    setEditCompanyId(ref.companyId ? String(ref.companyId) : '');
    setError('');
    setSuccess('');
    setIsEditModalOpen(true);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF documents are allowed.');
        setFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a PDF document to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('uploadedBy', uploadedBy);
    formData.append('file', file);
    if (companyId) {
      formData.append('companyId', companyId);
    }

    try {
      await referenceService.uploadReference(formData);
      setSuccess('Reference PDF document uploaded and cataloged successfully!');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        fetchData();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed. Ensure the file is a valid PDF under 5MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingRef) return;
    setSavingEdit(true);
    setError('');
    setSuccess('');

    const payload = {
      title: editTitle,
      category: editCategory,
      description: editDescription,
      uploadedBy: editUploadedBy,
      companyId: editCompanyId ? parseInt(editCompanyId, 10) : null
    };

    try {
      const refId = editingRef.referenceId || editingRef.resourceId;
      await referenceService.updateReference(refId, payload);
      setSuccess('Reference details updated successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        fetchData();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reference details.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (ref) => {
    const refId = ref.referenceId || ref.resourceId;
    if (!window.confirm(`Are you sure you want to delete "${ref.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await referenceService.deleteReference(refId);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Could not delete preparation reference.');
    }
  };

  const handleDownload = (ref) => {
    const id = ref.referenceId || ref.resourceId;
    const downloadUrl = referenceService.downloadReferenceUrl(id, true);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', ref.fileName || `${ref.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Update count locally
    setReferences((prev) =>
      prev.map((r) =>
        (r.referenceId || r.resourceId) === id
          ? { ...r, downloadCount: (r.downloadCount || 0) + 1 }
          : r
      )
    );
  };

  // Filtered references
  const filteredReferences = useMemo(() => {
    return references.filter((ref) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (ref.category && ref.category.toLowerCase() === selectedCategory.toLowerCase());

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (ref.title && ref.title.toLowerCase().includes(q)) ||
        (ref.description && ref.description.toLowerCase().includes(q)) ||
        (ref.fileName && ref.fileName.toLowerCase().includes(q)) ||
        (ref.uploadedBy && ref.uploadedBy.toLowerCase().includes(q)) ||
        (ref.category && ref.category.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [references, selectedCategory, search]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search]);

  const totalPages = Math.ceil(filteredReferences.length / itemsPerPage) || 1;
  const paginatedReferences = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReferences.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReferences, currentPage, itemsPerPage]);

  const totalDownloadsSum = useMemo(() => {
    return references.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
  }, [references]);

  const topDownloadedDoc = useMemo(() => {
    if (!references.length) return null;
    return [...references].sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))[0];
  }, [references]);

  const getBadgeStyle = (cat) => {
    const style = CATEGORY_COLORS[cat] || {
      bg: 'bg-secondary-subtle',
      text: 'text-secondary',
      border: 'border-secondary'
    };
    return `badge ${style.bg} ${style.text} border ${style.border} px-2.5 py-1 rounded-pill fw-semibold`;
  };

  return (
    <div className="py-2">
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 bg-white p-4 rounded-4 shadow-sm border">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1.5 rounded-pill">
              ⚙️ Administrator Panel
            </span>
            <span className="badge bg-indigo-subtle text-indigo border border-indigo px-3 py-1.5 rounded-pill fw-semibold">
              Reference Management & Metrics
            </span>
          </div>
          <h2 className="fw-bold m-0 text-dark">Manage References & Library</h2>
          <p className="text-muted small mb-0 mt-1">
            Publish study materials, monitor student download analytics, edit guide details, and maintain the campus placement repository.
          </p>
        </div>
        <button
          className="btn btn-primary fw-semibold py-2.5 px-4 shadow-sm rounded-3 d-flex align-items-center gap-2"
          onClick={handleOpenUpload}
        >
          ➕ Upload PDF Reference
        </button>
      </div>

      {/* KPI Cards: Download Statistics & Overview (Requirement #4 & #9) */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card custom-card p-3 border-0 shadow-sm rounded-4 border-start border-4 border-primary h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold text-uppercase">Total References</span>
                <h3 className="fw-bold text-dark mb-0 mt-1">{references.length}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3 fs-4">
                📚
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">Cataloged placement guides</span>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card custom-card p-3 border-0 shadow-sm rounded-4 border-start border-4 border-success h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold text-uppercase">Total Downloads</span>
                <h3 className="fw-bold text-success mb-0 mt-1">{totalDownloadsSum.toLocaleString()}</h3>
              </div>
              <div className="bg-success bg-opacity-10 text-success p-3 rounded-3 fs-4">
                📥
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">Across all candidate study sessions</span>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card custom-card p-3 border-0 shadow-sm rounded-4 border-start border-4 border-info h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold text-uppercase">Categories</span>
                <h3 className="fw-bold text-info-emphasis mb-0 mt-1">{CATEGORIES.length - 1}</h3>
              </div>
              <div className="bg-info bg-opacity-10 text-info-emphasis p-3 rounded-3 fs-4">
                🏷️
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">Aptitude, Tech, HR & Coding</span>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="card custom-card p-3 border-0 shadow-sm rounded-4 border-start border-4 border-warning h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-secondary small fw-semibold text-uppercase">Most Downloaded</span>
                <h6 className="fw-bold text-dark mb-0 mt-1 text-truncate" style={{ maxWidth: '170px' }}>
                  {topDownloadedDoc ? topDownloadedDoc.title : 'None yet'}
                </h6>
              </div>
              <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-3 fs-4">
                ⭐
              </div>
            </div>
            <span className="text-muted small mt-2 d-block">
              {topDownloadedDoc ? `${topDownloadedDoc.downloadCount} downloads` : 'Tracked live'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card custom-card shadow-sm mb-4 border-0 rounded-4 p-3 bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-lg-5 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-secondary">
                🔍
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search reference by title, category, author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary border-start-0 bg-light"
                  type="button"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-lg-7 col-md-6 text-md-end text-start">
            <div className="d-flex flex-wrap gap-1.5 justify-content-md-end">
              {CATEGORIES.map((cat) => {
                const count = cat === 'All'
                  ? references.length
                  : references.filter(r => r.category && r.category.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${
                      selectedCategory === cat
                        ? 'btn-primary shadow-sm'
                        : 'btn-outline-secondary border-light-subtle bg-light text-secondary'
                    }`}
                  >
                    {cat} <span className="opacity-75 ms-1" style={{ fontSize: '0.75rem' }}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* References Table */}
      {loading ? (
        <div className="card custom-card p-5 text-center border-0 shadow-sm rounded-4">
          <div className="spinner-border text-primary mx-auto mb-2" role="status"></div>
          <span className="text-muted small">Loading Reference Management portal...</span>
        </div>
      ) : filteredReferences.length > 0 ? (
        <>
          <div className="card custom-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-secondary small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  <tr>
                    <th style={{ width: '70px' }} className="ps-4">ID</th>
                    <th style={{ minWidth: '240px' }}>Reference Title</th>
                    <th style={{ minWidth: '130px' }}>Category</th>
                    <th style={{ minWidth: '170px' }}>File Name</th>
                    <th style={{ minWidth: '140px' }}>Uploaded By</th>
                    <th style={{ minWidth: '110px' }}>Date</th>
                    <th style={{ width: '100px' }} className="text-center">Downloads</th>
                    <th style={{ width: '190px' }} className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReferences.map((ref) => {
                    const refId = ref.referenceId || ref.resourceId;
                    return (
                      <tr key={refId}>
                        <td className="ps-4 fw-bold text-secondary">
                          #{String(refId).padStart(2, '0')}
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-bold text-dark fs-6">{ref.title}</span>
                            {ref.description && (
                              <span className="small text-muted text-truncate" style={{ maxWidth: '300px' }}>
                                {ref.description}
                              </span>
                            )}
                            {ref.companyName && (
                              <span className="badge bg-light text-primary border border-primary-subtle rounded-1 mt-1 align-self-start" style={{ fontSize: '0.65rem' }}>
                                💼 {ref.companyName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={getBadgeStyle(ref.category)}>
                            {ref.category || 'General'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-5 text-danger">📄</span>
                            <span className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                              {ref.fileName || `${ref.title}.pdf`}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="small text-secondary fw-medium">
                            {ref.uploadedBy || 'Placement Cell'}
                          </span>
                        </td>
                        <td>
                          <span className="small text-muted">
                            {ref.uploadedAt ? new Date(ref.uploadedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2.5 py-1 rounded-pill fw-bold">
                            📥 {ref.downloadCount || 0}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setPreviewDoc(ref)}
                              title="Preview PDF"
                            >
                              👁️
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => handleDownload(ref)}
                              title="Download PDF"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => handleOpenEdit(ref)}
                              title="Edit Reference Details"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(ref)}
                              title="Delete Reference"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 bg-white p-3 rounded-4 shadow-sm border mb-4">
              <span className="small text-muted">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * itemsPerPage, filteredReferences.length)}</strong> of{' '}
                <strong>{filteredReferences.length}</strong> references
              </span>
              <ul className="pagination pagination-sm m-0 gap-1">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link rounded-2 fw-semibold" onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link rounded-2" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                    Next
                  </button>
                </li>
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-5 border border-dashed rounded-4 bg-light bg-opacity-25 my-4 p-5">
          <span className="fs-1 d-block mb-3">📁</span>
          <h4 className="fw-bold text-dark">No References Found</h4>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '380px' }}>
            No references matching your search criteria. Try modifying your filter or upload a new reference manual.
          </p>
          <button
            className="btn btn-primary btn-sm px-4 fw-bold rounded-3"
            onClick={handleOpenUpload}
          >
            ➕ Upload First Reference
          </button>
        </div>
      )}

      {/* Upload Modal (Requirement #4 & #5) */}
      {isUploadModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.75)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content p-4 rounded-4 border-0 shadow-2xl">
              <div className="modal-header border-0 p-0 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">📚</span>
                  <h5 className="modal-title fw-bold text-dark fs-4">Upload New PDF Reference</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsUploadModalOpen(false)}></button>
              </div>

              {error && <div className="alert alert-danger py-2 small rounded-3">{error}</div>}
              {success && <div className="alert alert-success py-2 small rounded-3">{success}</div>}

              <form onSubmit={handleUploadSubmit}>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Reference Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Java Interview Questions & Solutions"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Category *</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      {CATEGORIES.filter(c => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Uploaded By / Department</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TPO Placement Cell"
                      value={uploadedBy}
                      onChange={(e) => setUploadedBy(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Associated Company (Optional)</label>
                    <select
                      className="form-select"
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                    >
                      <option value="">General / All Companies</option>
                      {companies.map((c) => (
                        <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Description / Topic Outline</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Provide a concise summary of what this document covers..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Select PDF Document (Max 5MB) *</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="form-control"
                      onChange={handleFileChange}
                      required
                    />
                    <span className="small text-muted d-block mt-1">
                      File will be securely cataloged into <code>/uploads/references/</code>.
                    </span>
                  </div>
                </div>

                <div className="modal-footer border-0 p-0 pt-4 mt-3">
                  <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setIsUploadModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4 fw-semibold shadow-sm" disabled={uploading}>
                    {uploading ? 'Uploading PDF Document...' : 'Upload & Catalog Reference'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reference Details Modal (Requirement #4) */}
      {isEditModalOpen && editingRef && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.75)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content p-4 rounded-4 border-0 shadow-2xl">
              <div className="modal-header border-0 p-0 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-4">✏️</span>
                  <h5 className="modal-title fw-bold text-dark fs-4">Edit Reference Details</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsEditModalOpen(false)}></button>
              </div>

              {error && <div className="alert alert-danger py-2 small rounded-3">{error}</div>}
              {success && <div className="alert alert-success py-2 small rounded-3">{success}</div>}

              <form onSubmit={handleEditSubmit}>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-semibold">Reference Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold">Category *</label>
                    <select
                      className="form-select"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      required
                    >
                      {CATEGORIES.filter(c => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Uploaded By / Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editUploadedBy}
                      onChange={(e) => setEditUploadedBy(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Associated Company</label>
                    <select
                      className="form-select"
                      value={editCompanyId}
                      onChange={(e) => setEditCompanyId(e.target.value)}
                    >
                      <option value="">General / All Companies</option>
                      {companies.map((c) => (
                        <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <div className="p-3 bg-light rounded-3 border small">
                      <span className="text-secondary fw-semibold">Attached File: </span>
                      <span className="font-monospace text-dark">{editingRef.fileName || 'PDF Document'}</span>
                      <span className="ms-2 badge bg-success-subtle text-success">
                        {editingRef.downloadCount || 0} downloads recorded
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 p-0 pt-4 mt-3">
                  <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-warning px-4 fw-semibold shadow-sm text-dark" disabled={savingEdit}>
                    {savingEdit ? 'Saving Changes...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PDF Document Preview Modal */}
      {previewDoc && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(36, 21, 47, 0.8)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ height: '90vh' }}>
            <div className="modal-content h-100 rounded-4 border-0 shadow-2xl overflow-hidden d-flex flex-column">
              <div className="modal-header py-3 px-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#24152F', borderBottom: '2px solid #D6AD60' }}>
                <div className="d-flex align-items-center gap-2 text-truncate">
                  <span className="fs-5">📄</span>
                  <div className="text-truncate">
                    <h5 className="modal-title fw-bold text-white mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                      {previewDoc.title}
                    </h5>
                    <span className="small text-secondary" style={{ fontSize: '0.75rem' }}>
                      {previewDoc.fileName} • {previewDoc.category}
                    </span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary fw-semibold px-3 py-1.5 d-flex align-items-center gap-1.5"
                    onClick={() => handleDownload(previewDoc)}
                  >
                    ⬇️ Download PDF
                  </button>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setPreviewDoc(null)}
                    aria-label="Close"
                  ></button>
                </div>
              </div>
              <div className="modal-body p-0 flex-grow-1 bg-secondary bg-opacity-10 d-flex flex-column">
                <iframe
                  src={referenceService.previewReferenceUrl(previewDoc.referenceId || previewDoc.resourceId)}
                  title={previewDoc.title}
                  className="w-100 h-100 border-0"
                  style={{ minHeight: '600px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceManagement;
