import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [minCgpa, setMinCgpa] = useState('');

  // Sorting states
  const [sortField, setSortField] = useState('regNo'); // 'regNo', 'name', 'cgpa', 'createdAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students list', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, branchFilter, minCgpa]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort and Filter student records
  const filtered = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                          student.regNo.toLowerCase().includes(search.toLowerCase()) ||
                          student.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === '' || student.department === branchFilter;
    const matchesCgpa = minCgpa === '' || student.cgpa >= parseFloat(minCgpa);
    return matchesSearch && matchesBranch && matchesCgpa;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'cgpa') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (sortField === 'createdAt') {
      return sortOrder === 'asc' 
        ? new Date(aVal) - new Date(bVal) 
        : new Date(bVal) - new Date(aVal);
    }
    
    // String compare
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();
    return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  // Pagination slicing
  const totalRecords = sorted.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentRecords = sorted.slice(indexOfFirstRecord, indexOfLastRecord);

  const branches = Array.from(new Set(students.map(s => s.department)));

  // Client-side CSV Export helper
  const handleExportCSV = () => {
    const headers = ['Roll Number', 'Name', 'Email', 'Department', 'CGPA', 'Phone', 'Registered At'];
    const rows = filtered.map(s => [
      s.regNo,
      s.name,
      s.email,
      s.department,
      s.cgpa.toFixed(2),
      s.phone,
      new Date(s.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '🔼' : '🔽';
  };

  if (loading) {
    return (
      <div className="py-2">
        <div className="skeleton skeleton-title" style={{ height: '32px', width: '300px' }}></div>
        <div className="skeleton skeleton-text medium mb-4"></div>
        <div className="card custom-card p-4 mb-4 border-0">
          <div className="skeleton skeleton-text"></div>
        </div>
        <div className="card custom-card p-3 border-0 shadow-sm">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton skeleton-table-row"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0 text-dark">Student Records Directory</h2>
          <p className="text-muted small mb-0">View student academic profiles, contact details, and uploaded resumes</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="btn btn-success btn-sm py-2 px-3 fw-bold text-white border-0 rounded-3"
          disabled={filtered.length === 0}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filter Options */}
      <div className="filter-card shadow-sm mb-4 border rounded-3 p-3 bg-card text-start">
        <div className="row g-3">
          <div className="col-md-5">
            <label className="form-label small fw-bold text-secondary">Search Query</label>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search name, roll number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-bold text-secondary">Filter by Branch</label>
            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              aria-label="Filter by department branch"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold text-secondary">Min CGPA Threshold</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="form-control"
              placeholder="e.g. 8.00"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              aria-label="Minimum CGPA filter"
            />
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="card custom-card shadow-sm border-0 rounded-3">
        <div className="table-responsive">
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr>
                <th onClick={() => handleSort('regNo')} style={{ cursor: 'pointer' }} aria-label="Sort by roll number">
                  Roll Number {getSortIcon('regNo')}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }} aria-label="Sort by name">
                  Name {getSortIcon('name')}
                </th>
                <th>Email</th>
                <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }} aria-label="Sort by department">
                  Department {getSortIcon('department')}
                </th>
                <th onClick={() => handleSort('cgpa')} style={{ cursor: 'pointer' }} className="text-center" aria-label="Sort by CGPA">
                  CGPA {getSortIcon('cgpa')}
                </th>
                <th>Phone</th>
                <th className="text-center">Resume</th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }} aria-label="Sort by registration date">
                  Registered At {getSortIcon('createdAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length > 0 ? (
                currentRecords.map((s) => (
                  <tr key={s.studentId}>
                    <td className="fw-bold text-dark">{s.regNo}</td>
                    <td className="fw-semibold text-secondary">{s.name}</td>
                    <td className="small text-muted">{s.email}</td>
                    <td className="small">{s.department}</td>
                    <td className="text-center fw-bold text-primary">{s.cgpa.toFixed(2)}</td>
                    <td className="small text-secondary">{s.phone}</td>
                    <td className="text-center">
                      {s.resumeUrl ? (
                        <a 
                          href={studentService.downloadResumeUrl(s.studentId)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary py-1 px-3 fw-semibold border-0 bg-primary bg-opacity-10 text-primary rounded-3"
                          style={{ fontSize: '0.8rem' }}
                        >
                          📥 Download PDF
                        </a>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td className="small text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted small">No student records match search criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        {totalRecords > 0 && (
          <div className="card-footer bg-transparent border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 text-start">
            <div className="small text-secondary">
              Showing <strong>{indexOfFirstRecord + 1}</strong> to <strong>{Math.min(indexOfLastRecord, totalRecords)}</strong> of <strong>{totalRecords}</strong> student logs
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
    </div>
  );
};

export default StudentManagement;
