import React, { useState, useEffect, useMemo } from 'react';
import { placementService } from '../services/api';
import { useToast } from '../context/ToastContext';

const DEPARTMENTS = [
  { code: 'ALL', name: 'All Departments', fullName: 'All Engineering Departments' },
  { code: 'CSE', name: 'CSE', fullName: 'Computer Science & Engineering' },
  { code: 'IT', name: 'IT', fullName: 'Information Technology' },
  { code: 'ECE', name: 'ECE', fullName: 'Electronics & Communication Engineering' },
  { code: 'EEE', name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
  { code: 'MECH', name: 'MECH', fullName: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'CIVIL', fullName: 'Civil Engineering' }
];

const PlacedStudentsAnalytics = () => {
  const toast = useToast();

  // State
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [placedStudents, setPlacedStudents] = useState([]);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [academicYears, setAcademicYears] = useState(['2026-2027', '2025-2026']);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Load initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, studentsRes] = await Promise.all([
        placementService.getDepartmentStats({ academicYear }),
        placementService.getPlacedStudents({ academicYear })
      ]);
      setDepartmentStats(statsRes || []);
      setPlacedStudents(studentsRes || []);
    } catch (err) {
      console.error('Error fetching placed students analytics:', err);
      toast.error('Failed to load placement analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [academicYear]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, searchTerm]);

  // Aggregate totals across all departments
  const allDeptTotals = useMemo(() => {
    const totalStudents = departmentStats.reduce((sum, d) => sum + (d.totalStudents || 0), 0);
    const totalPlaced = departmentStats.reduce((sum, d) => sum + (d.placedStudents || 0), 0);
    const pct = totalStudents > 0 ? ((totalPlaced / totalStudents) * 100).toFixed(2) : '0.00';
    return {
      totalStudents,
      totalPlaced,
      pct,
      deptName: 'All Engineering Departments'
    };
  }, [departmentStats]);

  // Dynamic Selected Department Summary
  const currentSummary = useMemo(() => {
    if (selectedDept === 'ALL') {
      return {
        departmentCode: 'ALL',
        departmentName: 'All Departments Combined',
        fullName: 'All Academic Departments',
        totalStudents: allDeptTotals.totalStudents,
        placedStudents: allDeptTotals.totalPlaced,
        placementPercentage: parseFloat(allDeptTotals.pct),
        averagePackage: placedStudents.length > 0
          ? (placedStudents.reduce((sum, s) => sum + (s.packageAmount || 0), 0) / placedStudents.length).toFixed(2)
          : '0.00',
        highestPackage: placedStudents.length > 0
          ? Math.max(...placedStudents.map(s => s.packageAmount || 0)).toFixed(2)
          : '0.00'
      };
    }

    const stat = departmentStats.find(d => d.department.toUpperCase() === selectedDept.toUpperCase());
    const deptObj = DEPARTMENTS.find(d => d.code === selectedDept);

    if (stat) {
      return {
        departmentCode: stat.department,
        departmentName: stat.departmentName || deptObj?.fullName,
        fullName: deptObj?.fullName || stat.departmentName,
        totalStudents: stat.totalStudents,
        placedStudents: stat.placedStudents,
        placementPercentage: stat.placementPercentage,
        averagePackage: (stat.averagePackage || 0).toFixed(2),
        highestPackage: (stat.highestPackage || 0).toFixed(2)
      };
    }

    // Fallback if not found yet
    return {
      departmentCode: selectedDept,
      departmentName: deptObj?.fullName || selectedDept,
      fullName: deptObj?.fullName || selectedDept,
      totalStudents: 0,
      placedStudents: 0,
      placementPercentage: 0,
      averagePackage: '0.00',
      highestPackage: '0.00'
    };
  }, [selectedDept, departmentStats, allDeptTotals, placedStudents]);

  // Filter students by selected department & search term
  const filteredStudents = useMemo(() => {
    let result = placedStudents;

    // 1. Department filter
    if (selectedDept !== 'ALL') {
      const target = selectedDept.toLowerCase();
      result = result.filter(s => {
        const d = (s.department || '').toLowerCase();
        if (target === 'cse') return d.includes('computer');
        if (target === 'it') return d.includes('information');
        if (target === 'ece') return d.includes('electronic');
        if (target === 'eee') return d.includes('electrical');
        if (target === 'mech') return d.includes('mech');
        if (target === 'civil') return d.includes('civil');
        return d.includes(target);
      });
    }

    // 2. Search box filter (Student Name, Register Number, Company Name)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(s => {
        const nameMatch = (s.studentName || '').toLowerCase().includes(q);
        const regMatch = (s.regNo || '').toLowerCase().includes(q);
        const compMatch = (s.companyName || '').toLowerCase().includes(q);
        return nameMatch || regMatch || compMatch;
      });
    }

    return result;
  }, [placedStudents, selectedDept, searchTerm]);

  // Paginated students
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Export handlers
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await placementService.downloadDeptExcel(academicYear);
      toast.success('Department-wise Placement Statistics Excel report downloaded!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export Excel report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPlacedExcel = async () => {
    try {
      setIsExporting(true);
      await placementService.downloadPlacedExcel({
        department: selectedDept !== 'ALL' ? selectedDept : undefined,
        search: searchTerm || undefined,
        academicYear
      });
      toast.success('Placed Students list Excel exported successfully!');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export placed students Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export the PDF report.');
      return;
    }

    const dateStr = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const rowsHtml = departmentStats.map(d => `
      <tr>
        <td style="font-weight:bold; color:#24152F; text-align:center;">${d.department}</td>
        <td><b>${d.departmentName}</b></td>
        <td style="text-align:right;">${d.totalStudents}</td>
        <td style="text-align:right; font-weight:bold; color:#27836C;">${d.placedStudents}</td>
        <td style="text-align:right; font-weight:bold; color:#D6AD60;">${d.placementPercentage.toFixed(2)}%</td>
        <td style="text-align:right;">₹${(d.averagePackage || 0).toFixed(2)} LPA</td>
        <td style="text-align:right;">₹${(d.highestPackage || 0).toFixed(2)} LPA</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Department-wise Placement Statistics Report</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #292431; line-height: 1.4; padding: 20px; background: #ffffff; }
          .header { border-bottom: 3px solid #D6AD60; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: bold; color: #24152F; margin: 0; }
          .subtitle { font-size: 13px; color: #827887; margin-top: 4px; }
          .meta { font-size: 11px; color: #827887; text-align: right; }
          .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { background: #F7F3F8; border: 1px solid #E5DDE9; border-radius: 8px; padding: 12px; }
          .card-title { font-size: 10px; font-weight: 700; color: #827887; text-transform: uppercase; }
          .card-val { font-size: 20px; font-weight: 800; color: #292431; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background-color: #F2ECF5; color: #292431; padding: 10px; text-align: left; font-weight: 700; border: 1px solid #E5DDE9; }
          td { padding: 9px 10px; border: 1px solid #E5DDE9; color: #292431; }
          tr:nth-child(even) { background-color: #FAF7FB; }
          .total-row { background-color: #F2ECF5; font-weight: bold; color: #292431; }
          .footer { margin-top: 40px; font-size: 11px; color: #827887; border-top: 1px solid #E5DDE9; padding-top: 15px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Campus Recruitment Progress & Analytics</div>
            <div class="subtitle">Official Department-wise Placement Statistics Report</div>
          </div>
          <div class="meta">
            Academic Year: <b>${academicYear}</b><br>
            Generated: ${dateStr}
          </div>
        </div>

        <div class="cards">
          <div class="card">
            <div class="card-title">Total Registered</div>
            <div class="card-val">${allDeptTotals.totalStudents}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Placed</div>
            <div class="card-val" style="color:#27836C;">${allDeptTotals.totalPlaced}</div>
          </div>
          <div class="card">
            <div class="card-title">Overall Placement Rate</div>
            <div class="card-val" style="color:#D6AD60;">${allDeptTotals.pct}%</div>
          </div>
          <div class="card">
            <div class="card-title">Tracked Departments</div>
            <div class="card-val">${departmentStats.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 10%; text-align:center;">Department</th>
              <th style="width: 32%;">Department Full Name</th>
              <th style="width: 12%; text-align:right;">Total Students</th>
              <th style="width: 12%; text-align:right;">Placed Students</th>
              <th style="width: 12%; text-align:right;">Placement %</th>
              <th style="width: 11%; text-align:right;">Avg Package</th>
              <th style="width: 11%; text-align:right;">Max Package</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td style="text-align:center; font-weight:bold;">TOTAL</td>
              <td>All Departments Combined</td>
              <td style="text-align:right;">${allDeptTotals.totalStudents}</td>
              <td style="text-align:right; color:#27836C; font-weight:bold;">${allDeptTotals.placedStudents}</td>
              <td style="text-align:right; color:#D6AD60; font-weight:bold;">${allDeptTotals.pct}%</td>
              <td style="text-align:right;">-</td>
              <td style="text-align:right;">-</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>Verified by: Placement & Career Guidance Cell</div>
          <div>Report Classification: Official Institutional Document</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Print / PDF preview window launched!');
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm rounded-4 p-5 text-center my-4">
        <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
        <h5 className="fw-bold text-dark">Loading Placed Students Analytics...</h5>
        <p className="text-muted small mb-0">Computing department quotas, student records, and placement rates</p>
      </div>
    );
  }

  return (
    <div className="placed-students-analytics-module mb-5">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1.5 rounded-pill fw-semibold">
                🎓 Placement Officer Portal
              </span>
              <span className="badge bg-success bg-opacity-10 text-success px-3 py-1.5 rounded-pill fw-semibold">
                Batch {academicYear}
              </span>
            </div>
            <h3 className="fw-bold text-dark mb-1">Placed Students Analytics</h3>
            <p className="text-muted small mb-0">
              Department-filtered placement monitoring, performance metrics, candidate rosters, and executive reports
            </p>
          </div>

          {/* Export & Year Switcher Controls */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Academic Year Dropdown */}
            <select
              className="form-select form-select-sm fw-semibold rounded-3 border-secondary-subtle"
              style={{ width: 'auto' }}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option value="2026-2027">AY 2026-2027</option>
              <option value="2025-2026">AY 2025-2026</option>
            </select>

            {/* Export Department-wise Report as Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="btn btn-outline-success btn-sm px-3 py-2 rounded-3 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
              title="Export Department-wise Placement Statistics as Excel (.xls)"
            >
              <span>📊</span> Export Dept Excel
            </button>

            {/* Export Department-wise Report as PDF */}
            <button
              onClick={handleExportPdf}
              className="btn btn-primary btn-sm px-3 py-2 rounded-3 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
              title="Export Department-wise Placement Report as PDF"
            >
              <span>📄</span> Export Dept PDF
            </button>
          </div>
        </div>

        {/* 1. DEPARTMENT FILTER DROPDOWN AT TOP */}
        <div className="mt-4 pt-3 border-top">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              <label htmlFor="dept-filter-select" className="form-label fw-bold text-secondary mb-0 text-nowrap">
                🏢 Department Filter:
              </label>
              <select
                id="dept-filter-select"
                className="form-select rounded-3 fw-bold border-primary text-primary"
                style={{ maxWidth: '340px' }}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.code === 'ALL' ? 'All Departments' : `${d.code} - ${d.fullName}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Pill Filter Buttons */}
            <div className="d-flex flex-wrap gap-1.5 align-items-center">
              {DEPARTMENTS.map(d => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => setSelectedDept(d.code)}
                  className={`btn btn-sm px-2.5 py-1 rounded-pill fw-semibold transition-all ${
                    selectedDept === d.code
                      ? 'btn-primary shadow-sm'
                      : 'btn-outline-secondary bg-light border-0 text-dark'
                  }`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card custom-card shadow-sm p-4 mb-4" style={{
        background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--primary-subtle) 100%)',
        borderLeft: '6px solid var(--primary-color)'
      }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary px-3 py-1 rounded-pill fw-bold fs-6">
                {currentSummary.departmentCode}
              </span>
              <span className="text-secondary small fw-bold text-uppercase">
                Department Placement Performance Summary
              </span>
            </div>
            <h4 className="fw-bold text-dark mb-0">
              {currentSummary.departmentName}
            </h4>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-3 fw-bold">
              ⚡ Status: Active Verification
            </span>
          </div>
        </div>

        {/* 4 Metrics in Department Summary Card */}
        <div className="row g-3">
          {/* Department Name */}
          <div className="col-lg-3 col-sm-6">
            <div className="bg-white p-3.5 rounded-3 border border-slate-200 shadow-xs h-100">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Department Name
              </div>
              <div className="fs-5 fw-bold text-dark mt-1 text-truncate" title={currentSummary.departmentName}>
                {currentSummary.departmentCode === 'ALL' ? 'All Departments' : currentSummary.departmentCode}
              </div>
              <div className="text-muted small mt-1 text-truncate" style={{ fontSize: '0.75rem' }}>
                {currentSummary.fullName}
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="col-lg-3 col-sm-6">
            <div className="bg-white p-3.5 rounded-3 border border-slate-200 shadow-xs h-100">
              <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Total Students
              </div>
              <div className="fs-2 fw-bold text-dark mt-1">
                {currentSummary.totalStudents}
              </div>
              <div className="text-muted small mt-1 d-flex justify-content-between">
                <span>Registered Students</span>
                <span className="badge bg-secondary bg-opacity-10 text-secondary">Batch Pool</span>
              </div>
            </div>
          </div>

          {/* Total Placed Students */}
          <div className="col-lg-3 col-sm-6">
            <div className="bg-white p-3.5 rounded-3 border border-slate-200 shadow-xs h-100 border-start border-4 border-success">
              <div className="text-success small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Total Placed Students
              </div>
              <div className="fs-2 fw-bold text-success mt-1">
                {currentSummary.placedStudents}
              </div>
              <div className="text-muted small mt-1 d-flex justify-content-between">
                <span>Offers Confirmed</span>
                <span className="badge bg-success bg-opacity-10 text-success">Selected</span>
              </div>
            </div>
          </div>

          {/* Placement Percentage */}
          <div className="col-lg-3 col-sm-6">
            <div className="bg-white p-3.5 rounded-3 border border-slate-200 shadow-xs h-100 border-start border-4 border-primary">
              <div className="text-primary small fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Placement Percentage
              </div>
              <div className="fs-2 fw-bold text-primary mt-1">
                {currentSummary.placementPercentage.toFixed(2)}%
              </div>
              {/* Visual dynamic progress bar */}
              <div className="progress mt-2" style={{ height: '6px' }}>
                <div
                  className="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${Math.min(currentSummary.placementPercentage, 100)}%` }}
                  aria-valuenow={currentSummary.placementPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional package indicators */}
        <div className="d-flex flex-wrap gap-3 mt-3 pt-3 border-top border-slate-200 text-muted small">
          <div className="d-flex align-items-center gap-1.5">
            <span className="fw-semibold text-dark">Average Package:</span>
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">₹{currentSummary.averagePackage} LPA</span>
          </div>
          <div className="d-flex align-items-center gap-1.5">
            <span className="fw-semibold text-dark">Highest Package:</span>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold">₹{currentSummary.highestPackage} LPA</span>
          </div>
          <div className="ms-auto text-muted fst-italic" style={{ fontSize: '0.78rem' }}>
            * Dynamically updated based on selected department filter
          </div>
        </div>
      </div>

      {/* 5. DEPARTMENT-WISE PLACEMENT STATISTICS SECTION */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div>
            <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <span>📈</span> Department-wise Placement Statistics
            </h5>
            <p className="text-muted small mb-0">
              Comparative cohort breakdown across engineering disciplines
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="btn btn-sm btn-outline-secondary rounded-3 fw-semibold"
            >
              📥 Export Table (Excel)
            </button>
            <button
              onClick={handleExportPdf}
              className="btn btn-sm btn-outline-primary rounded-3 fw-semibold"
            >
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 border">
            <thead className="table-light">
              <tr className="text-secondary small fw-bold">
                <th style={{ width: '15%' }}>Department</th>
                <th style={{ width: '25%' }}>Department Name</th>
                <th className="text-end" style={{ width: '15%' }}>Total Students</th>
                <th className="text-end" style={{ width: '15%' }}>Placed Students</th>
                <th className="text-end" style={{ width: '15%' }}>Placement %</th>
                <th className="text-center" style={{ width: '15%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((d) => {
                const isSelected = selectedDept.toUpperCase() === d.department.toUpperCase();
                return (
                  <tr
                    key={d.department}
                    className={`cursor-pointer ${isSelected ? 'table-primary bg-opacity-25' : ''}`}
                    onClick={() => setSelectedDept(d.department)}
                    title={`Click to filter placed students for ${d.department}`}
                  >
                    <td>
                      <span className={`badge ${isSelected ? 'bg-primary text-white' : 'bg-primary bg-opacity-10 text-primary'} px-2.5 py-1 rounded-pill fw-bold`}>
                        {d.department}
                      </span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{d.departmentName}</span>
                    </td>
                    <td className="text-end fw-semibold text-secondary">
                      {d.totalStudents}
                    </td>
                    <td className="text-end fw-bold text-success">
                      {d.placedStudents}
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '80px' }}>
                          <div
                            className={`progress-bar ${
                              d.placementPercentage >= 75
                                ? 'bg-success'
                                : d.placementPercentage >= 65
                                ? 'bg-primary'
                                : 'bg-warning'
                            }`}
                            style={{ width: `${Math.min(d.placementPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className="fw-bold text-dark" style={{ minWidth: '55px' }}>
                          {d.placementPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDept(d.department);
                        }}
                        className={`btn btn-xs ${isSelected ? 'btn-primary text-white' : 'btn-outline-primary'} py-1 px-2.5 rounded-pill fw-semibold`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {isSelected ? '✓ Selected' : 'Filter Roster'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              <tr className="table-light fw-bold border-top border-2">
                <td className="text-primary">TOTAL</td>
                <td className="text-dark">All Departments Combined</td>
                <td className="text-end text-dark">{allDeptTotals.totalStudents}</td>
                <td className="text-end text-success">{allDeptTotals.totalPlaced}</td>
                <td className="text-end">
                  <span className="badge bg-primary px-3 py-1.5 rounded-pill fs-7">
                    {allDeptTotals.pct}%
                  </span>
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedDept('ALL')}
                    className="btn btn-xs btn-outline-secondary py-1 px-2.5 rounded-pill fw-semibold"
                    style={{ fontSize: '0.75rem' }}
                  >
                    Reset All
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. & 6. PLACED STUDENTS TABLE WITH SEARCH BOX */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold text-dark mb-0">
                🎓 Placed Students Roster
              </h5>
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2.5 py-1 fw-bold">
                {filteredStudents.length} Students
              </span>
            </div>
            <p className="text-muted small mb-0 mt-0.5">
              Showing placed students {selectedDept !== 'ALL' ? `for Department: ${selectedDept}` : 'across all departments'}
            </p>
          </div>

          {/* Search Box & Export */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* 6. SEARCH BOX */}
            <div className="input-group input-group-sm" style={{ width: '280px' }}>
              <span className="input-group-text bg-light border-secondary-subtle">🔍</span>
              <input
                type="text"
                className="form-control border-secondary-subtle rounded-end-3"
                placeholder="Search Name, Reg No, Company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary border-secondary-subtle"
                  type="button"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Export Placed Students Excel */}
            <button
              onClick={handleExportPlacedExcel}
              disabled={isExporting}
              className="btn btn-sm btn-outline-success fw-semibold rounded-3 px-3 py-1.5 shadow-xs"
              title="Download filtered placed students table as Excel"
            >
              📥 Export List
            </button>
          </div>
        </div>

        {/* Filter tags feedback */}
        {(selectedDept !== 'ALL' || searchTerm) && (
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3 p-2 bg-light rounded-3">
            <span className="small text-muted fw-semibold">Active Filters:</span>
            {selectedDept !== 'ALL' && (
              <span className="badge bg-primary text-white rounded-pill px-2.5 py-1">
                Dept: {selectedDept}
                <button
                  onClick={() => setSelectedDept('ALL')}
                  className="btn-close btn-close-white ms-1.5"
                  style={{ width: '0.45rem', height: '0.45rem', verticalAlign: 'middle' }}
                ></button>
              </span>
            )}
            {searchTerm && (
              <span className="badge bg-dark text-white rounded-pill px-2.5 py-1">
                Query: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="btn-close btn-close-white ms-1.5"
                  style={{ width: '0.45rem', height: '0.45rem', verticalAlign: 'middle' }}
                ></button>
              </span>
            )}
            <button
              onClick={() => { setSelectedDept('ALL'); setSearchTerm(''); }}
              className="btn btn-link btn-sm text-secondary p-0 ms-auto text-decoration-none"
              style={{ fontSize: '0.78rem' }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* 3. PLACED STUDENTS TABLE */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="text-secondary small fw-bold">
                <th>Student Name</th>
                <th>Register Number</th>
                <th>Department</th>
                <th>Company Name</th>
                <th>Package (LPA)</th>
                <th>Placement Date</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="text-muted mb-2 fs-3">🔍</div>
                    <div className="fw-bold text-dark">No Placed Students Found</div>
                    <p className="text-muted small mb-0">
                      Try resetting your search query or selecting another department filter.
                    </p>
                    <button
                      onClick={() => { setSelectedDept('ALL'); setSearchTerm(''); }}
                      className="btn btn-sm btn-outline-primary mt-3 rounded-pill px-3"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s) => {
                  const dateStr = s.offerDate ? new Date(s.offerDate).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A';

                  return (
                    <tr key={s.placementId}>
                      {/* Student Name */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-xs"
                            style={{
                              width: '32px',
                              height: '32px',
                              fontSize: '0.8rem',
                              backgroundColor: `hsl(${(s.studentId * 57) % 360}, 65%, 45%)`
                            }}
                          >
                            {s.studentName ? s.studentName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="fw-bold text-dark text-nowrap">{s.studentName}</div>
                            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                              CGPA: {s.cgpa?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Register Number */}
                      <td>
                        <span className="badge bg-light text-dark border font-monospace px-2 py-1">
                          {s.regNo}
                        </span>
                      </td>

                      {/* Department */}
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill fw-semibold">
                          {s.department}
                        </span>
                      </td>

                      {/* Company Name */}
                      <td>
                        <div className="fw-semibold text-dark d-flex align-items-center gap-1.5">
                          <span className="text-muted">🏢</span> {s.companyName}
                        </div>
                      </td>

                      {/* Package (LPA) */}
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2.5 py-1 fs-7">
                          ₹{s.packageAmount?.toFixed(2)} LPA
                        </span>
                      </td>

                      {/* Placement Date */}
                      <td className="text-secondary small font-monospace">
                        {dateStr}
                      </td>

                      {/* Status (Placed) */}
                      <td className="text-center">
                        <span className="badge bg-success text-white px-2.5 py-1 rounded-pill fw-semibold shadow-xs">
                          ✓ Placed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer summary */}
        {filteredStudents.length > pageSize && (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 mt-4 pt-3 border-top">
            <div className="text-muted small">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} placed students
            </div>

            <nav aria-label="Placement table pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link rounded-start-3"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                </li>

                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Show current page and neighbors
                  if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                    return (
                      <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(p)}>
                          {p}
                        </button>
                      </li>
                    );
                  } else if (p === currentPage - 2 || p === currentPage + 2) {
                    return <li key={p} className="page-item disabled"><span className="page-link">...</span></li>;
                  }
                  return null;
                })}

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link rounded-end-3"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacedStudentsAnalytics;
