import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { referenceService } from '../../services/api';

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

const PreparationReferences = () => {
  const [references, setReferences] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    try {
      setLoading(true);
      const data = await referenceService.getReferences();
      setReferences(data || []);
    } catch (err) {
      console.error('Error loading references', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter references based on category and search query
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

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, search]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredReferences.length / itemsPerPage) || 1;
  const paginatedReferences = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReferences.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReferences, currentPage, itemsPerPage]);

  const handlePreview = (ref) => {
    setPreviewDoc(ref);
  };

  const handleDownload = (ref) => {
    const id = ref.referenceId || ref.resourceId;
    const downloadUrl = referenceService.downloadReferenceUrl(id, true);
    
    // Create an invisible anchor tag to trigger browser download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', ref.fileName || `${ref.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Increment download count locally for instant UI update
    setReferences((prev) =>
      prev.map((r) =>
        (r.referenceId || r.resourceId) === id
          ? { ...r, downloadCount: (r.downloadCount || 0) + 1 }
          : r
      )
    );
  };

  const getBadgeStyle = (category) => {
    const style = CATEGORY_COLORS[category] || {
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
              📚 Placement Prep Hub
            </span>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1.5 rounded-pill">
              {references.length} Documents Available
            </span>
          </div>
          <h2 className="fw-bold m-0 text-dark">Reference Library</h2>
          <p className="text-muted small mb-0 mt-1">
            Downloadable syllabus guides, aptitude practice papers, interview blueprints, and placement preparation manuals.
          </p>
        </div>

        {/* View Switcher */}
        <div className="btn-group p-1 bg-light rounded-3 border" role="group">
          <button
            type="button"
            className={`btn btn-sm px-3 fw-semibold ${viewMode === 'table' ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}
            onClick={() => setViewMode('table')}
          >
            📋 Table View
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 fw-semibold ${viewMode === 'grid' ? 'btn-primary shadow-sm' : 'btn-light text-secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            🗂️ Card Grid
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card custom-card shadow-sm mb-4 border-0 rounded-4 p-3 bg-white">
        <div className="row g-3 align-items-center">
          {/* Search Box */}
          <div className="col-lg-5 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-secondary">
                🔍
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search reference by title, topic, file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search references"
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

          {/* Category Dropdown (Mobile/Tablet) & Quick Counts */}
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

      {/* Loading State */}
      {loading ? (
        <div className="py-4">
          <div className="card custom-card p-4 border-0 shadow-sm">
            <div className="skeleton skeleton-title mb-3" style={{ width: '40%' }}></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
          </div>
        </div>
      ) : filteredReferences.length > 0 ? (
        <>
          {/* 1. Table View (Requirement #2) */}
          {viewMode === 'table' ? (
            <div className="card custom-card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-secondary small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    <tr>
                      <th style={{ width: '70px' }} className="ps-4">ID</th>
                      <th style={{ minWidth: '260px' }}>Reference Details</th>
                      <th style={{ minWidth: '140px' }}>Category</th>
                      <th style={{ minWidth: '180px' }}>File Name</th>
                      <th style={{ minWidth: '150px' }}>Uploaded By</th>
                      <th style={{ minWidth: '110px' }}>Upload Date</th>
                      <th style={{ width: '100px' }} className="text-center">Downloads</th>
                      <th style={{ width: '180px' }} className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReferences.map((ref) => {
                      const refId = ref.referenceId || ref.resourceId;
                      return (
                        <tr key={refId} className="transition-all">
                          <td className="ps-4 fw-bold text-secondary">
                            #{String(refId).padStart(2, '0')}
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-dark fs-6">{ref.title}</span>
                              {ref.description && (
                                <span className="small text-muted text-truncate" style={{ maxWidth: '340px' }}>
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
                              <span className="fs-5 text-danger" title="PDF Document">📄</span>
                              <span className="small fw-semibold text-dark text-truncate" style={{ maxWidth: '170px' }}>
                                {ref.fileName || `${ref.title}.pdf`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="small text-secondary fw-medium">
                              👤 {ref.uploadedBy || 'Placement Cell'}
                            </span>
                          </td>
                          <td>
                            <span className="small text-muted">
                              {ref.uploadedAt ? new Date(ref.uploadedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border px-2 py-1 rounded-pill small">
                              📥 {ref.downloadCount || 0}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-primary fw-semibold px-2.5 py-1.5 rounded-start-2 d-inline-flex align-items-center gap-1"
                                onClick={() => handlePreview(ref)}
                                title="Preview PDF in browser"
                              >
                                👁️ Preview
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary fw-semibold px-2.5 py-1.5 rounded-end-2 d-inline-flex align-items-center gap-1"
                                onClick={() => handleDownload(ref)}
                                title="Download PDF to device"
                              >
                                ⬇️ Download
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
          ) : (
            /* 2. Grid Card View */
            <div className="row g-4 mb-4">
              {paginatedReferences.map((ref) => {
                const refId = ref.referenceId || ref.resourceId;
                return (
                  <div className="col-lg-4 col-md-6" key={refId}>
                    <div className="card custom-card p-4 h-100 d-flex flex-column justify-content-between shadow-sm border-0 rounded-4 hover-shadow transition-all">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className={getBadgeStyle(ref.category)}>
                            {ref.category || 'General'}
                          </span>
                          <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill small">
                            📥 {ref.downloadCount || 0}
                          </span>
                        </div>

                        <div className="d-flex gap-3 align-items-start mb-2">
                          <div className="bg-danger bg-opacity-10 text-danger p-2.5 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                            <span className="fs-4">📄</span>
                          </div>
                          <div>
                            <h5 className="fw-bold text-dark mb-1 fs-6">{ref.title}</h5>
                            <span className="small text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                              {ref.fileName || `${ref.title}.pdf`}
                            </span>
                          </div>
                        </div>

                        <p className="text-secondary small mb-3 text-start" style={{ minHeight: '40px', lineHeight: '1.4' }}>
                          {ref.description || 'Essential placement preparation blueprint and technical review manual.'}
                        </p>

                        <div className="small text-muted mb-3 d-flex justify-content-between border-top pt-2">
                          <span>👤 {ref.uploadedBy || 'Placement Cell'}</span>
                          <span>📅 {ref.uploadedAt ? new Date(ref.uploadedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="d-flex gap-2 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm flex-fill fw-semibold py-1.5 rounded-3"
                          onClick={() => handlePreview(ref)}
                        >
                          👁️ Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm flex-fill fw-semibold py-1.5 rounded-3"
                          onClick={() => handleDownload(ref)}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 bg-white p-3 rounded-4 shadow-sm border mb-4">
              <span className="small text-muted">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * itemsPerPage, filteredReferences.length)}</strong> of{' '}
                <strong>{filteredReferences.length}</strong> reference guides
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
        /* Empty State */
        <div className="text-center py-5 border border-dashed rounded-4 bg-light bg-opacity-25 my-4 p-5">
          <span className="fs-1 d-block mb-3">📁</span>
          <h4 className="fw-bold text-dark">No Reference Documents Found</h4>
          <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '420px' }}>
            We could not find any placement references matching your search query &quot;<strong>{search}</strong>&quot; under category &quot;<strong>{selectedCategory}</strong>&quot;.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button
              className="btn btn-primary btn-sm px-4 fw-bold rounded-3"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
            >
              Reset Filters
            </button>
            <Link to="/student/dashboard" className="btn btn-outline-secondary btn-sm px-4 fw-semibold rounded-3">
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* In-Modal PDF Document Preview */}
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

export default PreparationReferences;
