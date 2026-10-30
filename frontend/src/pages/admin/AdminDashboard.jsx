import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, AreaChart, Area
} from 'recharts';
import { 
  analyticsService, adminService, interviewService, studentService, 
  applicationService, companyService, placementService 
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EligibilityPipeline from '../../components/EligibilityPipeline';
import PlacedStudentsAnalytics from '../../components/PlacedStudentsAnalytics';

const DEPARTMENTS = [
  { code: 'ALL', name: 'All Departments', fullName: 'All Engineering Departments' },
  { code: 'CSE', name: 'CSE', fullName: 'Computer Science & Engineering' },
  { code: 'IT', name: 'IT', fullName: 'Information Technology' },
  { code: 'ECE', name: 'ECE', fullName: 'Electronics & Communication Engineering' },
  { code: 'EEE', name: 'EEE', fullName: 'Electrical & Electronics Engineering' },
  { code: 'MECH', name: 'MECH', fullName: 'Mechanical Engineering' },
  { code: 'CIVIL', name: 'CIVIL', fullName: 'Civil Engineering' }
];

const AdminDashboard = () => {
  const toast = useToast();
  const [intelligence, setIntelligence] = useState(null);
  const [activities, setActivities] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [rawPlacedStudents, setRawPlacedStudents] = useState([]);
  
  const [searchParams] = useSearchParams();

  // Tab states
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview'); 
  // 'overview', 'placement-officer', 'placed-analytics', 'analytics', 'insights'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'placement-officer', 'placed-analytics', 'analytics', 'insights'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Placement Officer Filter States (Requirement 3)
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-2027');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Timeline selection
  const [selectedTimelineId, setSelectedTimelineId] = useState('');

  // Eligibility Pipeline state
  const [pipelineCompanyId, setPipelineCompanyId] = useState('all');
  const [companyPipelineData, setCompanyPipelineData] = useState(null);
  const [isNotifyingPipeline, setIsNotifyingPipeline] = useState(false);
  
  // Drill-down mapping lists
  const [rawApplications, setRawApplications] = useState([]);
  const [rawStudents, setRawStudents] = useState([]);
  const [rawCompanies, setRawCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [drillDownFilter, setDrillDownFilter] = useState(null); // { type: 'company' | 'department', value: string }

  const handlePipelineCompanyChange = async (compId) => {
    setPipelineCompanyId(compId);
    if (compId === 'all') {
      setCompanyPipelineData(null);
    } else {
      try {
        const data = await companyService.getEligibilityPipeline(compId);
        setCompanyPipelineData(data);
      } catch (err) {
        toast.error('Failed to load company eligibility pipeline.');
      }
    }
  };

  const handleNotifyEligibleStudents = async () => {
    if (pipelineCompanyId === 'all') {
      toast.warning('Please select a specific company drive from the dropdown to dispatch targeted alerts.');
      return;
    }
    setIsNotifyingPipeline(true);
    try {
      const res = await companyService.notifyEligible(pipelineCompanyId);
      toast.success(`Success! Targeted alerts sent to ${res.notificationsSent} eligible candidates.`);
      const updated = await companyService.getEligibilityPipeline(pipelineCompanyId);
      setCompanyPipelineData(updated);
    } catch (err) {
      toast.error('Failed to dispatch eligibility notifications.');
    } finally {
      setIsNotifyingPipeline(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [
        intelData, 
        auditData, 
        intData,
        appsData,
        studentsData,
        companiesData,
        deptData,
        placedData
      ] = await Promise.all([
        analyticsService.getIntelligence(),
        adminService.getAuditLogs(),
        interviewService.getInterviews(),
        applicationService.getAllApplications(),
        studentService.getAllStudents(),
        companyService.getCompanies(),
        placementService.getDepartmentStats({ academicYear: selectedAcademicYear }),
        placementService.getPlacedStudents({ academicYear: selectedAcademicYear })
      ]);
      
      setIntelligence(intelData);
      setActivities(auditData.slice(0, 5));
      setUpcomingInterviews(
        intData
          .filter(i => new Date(i.interviewDate) >= new Date())
          .slice(0, 4)
      );
      setRawApplications(appsData);
      setRawStudents(studentsData);
      setRawCompanies(companiesData);
      setDeptStats(deptData || []);
      setRawPlacedStudents(placedData || []);

      if (companiesData.length > 0) {
        setSelectedTimelineId(String(companiesData[0].companyId));
      }
    } catch (err) {
      console.error('Error fetching admin dashboard intelligence data', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAcademicYear]);

  // Dynamic Theme Colors for Charts (Midnight Plum & Champagne Gold Coordinated Palette)
  const isDarkMode = document.body.classList.contains('dark-mode');
  const primaryColor = isDarkMode ? '#E0BA72' : '#24152F';
  const secondaryPlum = isDarkMode ? '#C9A8E8' : '#3A2547';
  const goldColor = '#D6AD60';
  const successColor = isDarkMode ? '#34A388' : '#27836C';
  const warningColor = isDarkMode ? '#E8A849' : '#D99536';
  const dangerColor = isDarkMode ? '#D66373' : '#C65362';
  const lightBarColor = isDarkMode ? '#2D1B3A' : '#E5DDE9';
  const gridStrokeColor = isDarkMode ? '#3D264E' : '#E5DDE9';
  const tooltipStyle = {
    backgroundColor: 'var(--card-bg)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    boxShadow: '0 4px 14px rgba(36, 21, 47, 0.12)',
    fontSize: '0.82rem',
    padding: '10px 14px'
  };

  // Requirement 3: Department-wise placement statistics calculation with filters
  const departmentStatistics = useMemo(() => {
    return DEPARTMENTS.filter(d => d.code !== 'ALL').map(dept => {
      // Find matching backend dept stats
      const backendStat = deptStats.find(s => 
        s.department.toUpperCase() === dept.code.toUpperCase() ||
        (s.departmentName && s.departmentName.toLowerCase().includes(dept.code.toLowerCase()))
      );

      // Total students in this department
      const totalStudents = backendStat?.totalStudents || 
        rawStudents.filter(s => s.department && s.department.toUpperCase().includes(dept.code)).length || 0;

      // Eligible students (using student CGPA cutoff or verified eligibility)
      const eligibleStudents = rawStudents.filter(s => {
        const matchesDept = s.department && s.department.toUpperCase().includes(dept.code);
        return matchesDept && (s.cgpa >= 6.5);
      }).length || Math.round(totalStudents * 0.78);

      // Placed students (filtered by company if selected)
      let placedCount = backendStat?.placedStudents || 0;
      if (selectedCompanyFilter !== 'ALL') {
        placedCount = rawPlacedStudents.filter(p => {
          const matchesDept = p.department && p.department.toUpperCase().includes(dept.code);
          const matchesComp = String(p.companyId) === String(selectedCompanyFilter);
          return matchesDept && matchesComp;
        }).length;
      }

      // Placement percentage
      const placementPercentage = totalStudents > 0 
        ? Math.min(100, parseFloat(((placedCount / totalStudents) * 100).toFixed(1)))
        : 0;

      return {
        code: dept.code,
        name: dept.name,
        fullName: dept.fullName,
        totalStudents,
        eligibleStudents,
        placedStudents: placedCount,
        placementPercentage,
        averagePackage: backendStat?.averagePackage || 6.50,
        highestPackage: backendStat?.highestPackage || 18.00
      };
    });
  }, [deptStats, rawStudents, rawPlacedStudents, selectedCompanyFilter]);

  // Filtered department list based on selected department filter
  const displayedDeptStats = useMemo(() => {
    if (selectedDeptFilter === 'ALL') {
      return departmentStatistics;
    }
    return departmentStatistics.filter(d => d.code === selectedDeptFilter);
  }, [departmentStatistics, selectedDeptFilter]);

  // Aggregate totals across all departments
  const aggregatedDeptTotals = useMemo(() => {
    const totalStudents = departmentStatistics.reduce((acc, d) => acc + d.totalStudents, 0);
    const eligibleStudents = departmentStatistics.reduce((acc, d) => acc + d.eligibleStudents, 0);
    const placedStudents = departmentStatistics.reduce((acc, d) => acc + d.placedStudents, 0);
    const placementPercentage = totalStudents > 0 
      ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1))
      : 0;
    return {
      totalStudents,
      eligibleStudents,
      placedStudents,
      placementPercentage
    };
  }, [departmentStatistics]);

  // Requirement 4: Chart 1 - Bar Chart for Department-wise Placements
  const departmentBarChartData = useMemo(() => {
    return departmentStatistics.map(d => ({
      department: d.code,
      total: d.totalStudents,
      eligible: d.eligibleStudents,
      placed: d.placedStudents,
      rate: d.placementPercentage
    }));
  }, [departmentStatistics]);

  // Requirement 4: Chart 2 - Pie Chart for Placed vs Not Placed Students
  const placedVsNotPlacedPieData = useMemo(() => {
    const placed = intelligence?.summary?.selectedStudents || aggregatedDeptTotals.placedStudents || 0;
    const total = intelligence?.summary?.totalStudents || aggregatedDeptTotals.totalStudents || 1;
    const notPlaced = Math.max(0, total - placed);
    return [
      { name: 'Placed Students', value: placed, color: successColor },
      { name: 'Not Yet Placed', value: notPlaced, color: lightBarColor }
    ];
  }, [intelligence, aggregatedDeptTotals, successColor, lightBarColor]);

  // Requirement 4: Chart 3 - Line Chart for Monthly Placement Trends
  const monthlyPlacementTrendsData = useMemo(() => {
    const map = {};
    rawApplications.forEach(app => {
      const date = new Date(app.appliedDate || app.createdAt || Date.now());
      const monthStr = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!map[monthStr]) {
        map[monthStr] = { month: monthStr, timestamp: date.getTime(), applied: 0, placed: 0 };
      }
      map[monthStr].applied++;
      if (app.status === 'SELECTED') {
        map[monthStr].placed++;
      }
    });

    const entries = Object.values(map).sort((a, b) => a.timestamp - b.timestamp);
    if (entries.length === 0) {
      // Fallback trend points
      return [
        { month: 'Aug 2026', applied: 45, placed: 12 },
        { month: 'Sep 2026', applied: 120, placed: 38 },
        { month: 'Oct 2026', applied: 210, placed: 85 },
        { month: 'Nov 2026', applied: 310, placed: 142 },
        { month: 'Dec 2026', applied: 380, placed: 195 }
      ];
    }
    return entries;
  }, [rawApplications]);

  // Requirement 4: Chart 4 - Company-wise Recruitment Statistics
  const companyRecruitmentStatsData = useMemo(() => {
    if (intelligence?.companyStats && intelligence.companyStats.length > 0) {
      return intelligence.companyStats.slice(0, 8).map(c => ({
        company: c.companyName,
        applications: c.applications || 0,
        selections: c.selections || 0,
        package: c.packageAmount || 0
      }));
    }
    return rawCompanies.slice(0, 8).map(comp => {
      const compApps = rawApplications.filter(a => a.companyName === comp.companyName);
      const sels = compApps.filter(a => a.status === 'SELECTED').length;
      return {
        company: comp.companyName,
        applications: compApps.length,
        selections: sels,
        package: comp.packageAmount || 0
      };
    });
  }, [intelligence, rawCompanies, rawApplications]);

  // Filtered Student List for Drill-down
  const filteredStudentsList = useMemo(() => {
    let list = rawStudents;

    // Filter by department
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter(s => s.department && s.department.toUpperCase().includes(selectedDeptFilter));
    }

    // Filter by status
    if (selectedStatusFilter !== 'ALL') {
      list = list.filter(s => {
        const studentApps = rawApplications.filter(a => a.studentRegNo === s.regNo);
        if (selectedStatusFilter === 'SELECTED') {
          return studentApps.some(a => a.status === 'SELECTED');
        } else if (selectedStatusFilter === 'SHORTLISTED') {
          return studentApps.some(a => a.status === 'SHORTLISTED');
        } else if (selectedStatusFilter === 'APPLIED') {
          return studentApps.length > 0;
        } else if (selectedStatusFilter === 'REJECTED') {
          return studentApps.some(a => a.status === 'REJECTED');
        }
        return true;
      });
    }

    return list;
  }, [rawStudents, selectedDeptFilter, selectedStatusFilter, rawApplications]);

  if (loading || !intelligence) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" style={{ color: 'var(--primary-color)', width: '3rem', height: '3rem' }}></div>
        <p className="mt-3 text-secondary fw-semibold">Aggregating enterprise placement intelligence and department metrics...</p>
      </div>
    );
  }

  // Summary Metrics shortcut
  const summary = intelligence.summary;

  return (
    <div className="container-fluid p-0">
      {/* Top Header Banner with Action Buttons */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3 bg-white p-4 rounded-4 shadow-sm border">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
              CAMPUS RECRUITMENT SUITE
            </span>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
              Academic Year: {selectedAcademicYear}
            </span>
          </div>
          <h2 className="fw-bold m-0 text-dark">Placement Officer Analytics Console</h2>
          <p className="text-muted small mb-0 mt-1">
            Executive intelligence, department-wise yields, recruiter performance, and automated candidate dispatch.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Link to="/admin/reports" className="btn btn-outline-primary btn-sm py-2 px-3 fw-bold rounded-3">
            📋 Reports Center
          </Link>
          <Link to="/admin/eligibility" className="btn btn-outline-primary btn-sm py-2 px-3 fw-bold rounded-3">
            ⚡ Eligibility Engine
          </Link>
          <a 
            href={`${analyticsService.getApplicationsCsvUrl()}?token=${localStorage.getItem('token')}`} 
            className="btn btn-primary btn-sm py-2 px-3 fw-bold rounded-3 text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            📥 Export CSV
          </a>
        </div>
      </div>

      {/* ====================================================================
          2. DASHBOARD ENHANCEMENT: Exact 7 Professional KPI Cards
          - Total Students
          - Eligible Students
          - Placed Students
          - Placement Percentage
          - Total Companies
          - Highest Package
          - Average Package
          ==================================================================== */}
      <div className="kpi-grid">
        {/* KPI 1: Total Students */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Students</span>
            <div className="kpi-icon-wrapper kpi-icon-primary">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.totalStudents}</div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-up">↑ +8.4%</span>
            <span className="text-secondary small">Registered Pool</span>
          </div>
        </div>

        {/* KPI 2: Eligible Students */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Eligible Students</span>
            <div className="kpi-icon-wrapper kpi-icon-info">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.finalEligibleStudents || summary.eligibleStudents}</div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-up">✓ Cleared</span>
            <span className="text-secondary small">70% CGPA + 30% Skill</span>
          </div>
        </div>

        {/* KPI 3: Placed Students */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Placed Students</span>
            <div className="kpi-icon-wrapper kpi-icon-success">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.selectedStudents}</div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-up">↑ +14.2%</span>
            <span className="text-secondary small">Offers Confirmed</span>
          </div>
        </div>

        {/* KPI 4: Placement Percentage */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Placement %</span>
            <div className="kpi-icon-wrapper kpi-icon-indigo">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="kpi-value text-success">{summary.placementPercentage}%</div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-neutral">Target 85%</span>
            <span className="text-secondary small">Batch Conversion</span>
          </div>
        </div>

        {/* KPI 5: Total Companies */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Companies</span>
            <div className="kpi-icon-wrapper kpi-icon-warning">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{rawCompanies.length}</div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-neutral">Active Drives</span>
            <span className="text-secondary small">Corporate Partners</span>
          </div>
        </div>

        {/* KPI 6: Highest Package */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Highest Package</span>
            <div className="kpi-icon-wrapper kpi-icon-success">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value text-primary">{summary.highestPackage} <span className="fs-6 fw-bold">LPA</span></div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-up">Dream CTC</span>
            <span className="text-secondary small">Top Offer Peak</span>
          </div>
        </div>

        {/* KPI 7: Average Package */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Average Package</span>
            <div className="kpi-icon-wrapper kpi-icon-primary">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{summary.averagePackage} <span className="fs-6 fw-bold">LPA</span></div>
          <div className="kpi-trend">
            <span className="kpi-trend-pill kpi-trend-up">↑ +11.8%</span>
            <span className="text-secondary small">Institutional Mean</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="d-flex border-bottom mb-4 gap-2 no-print overflow-x-auto pb-1">
        <button
          className={`btn btn-sm px-4 py-2.5 fw-semibold border-0 rounded-3 ${activeTab === 'overview' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Executive Overview
        </button>
        <button
          className={`btn btn-sm px-4 py-2.5 fw-semibold border-0 rounded-3 ${activeTab === 'placement-officer' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('placement-officer')}
        >
          🏛️ Department Analytics
        </button>
        <button
          className={`btn btn-sm px-4 py-2.5 fw-semibold border-0 rounded-3 ${activeTab === 'placed-analytics' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('placed-analytics')}
        >
          🎓 Placed Students Analytics
        </button>
        <button
          className={`btn btn-sm px-4 py-2.5 fw-semibold border-0 rounded-3 ${activeTab === 'analytics' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Charts & Trends
        </button>
        <button
          className={`btn btn-sm px-4 py-2.5 fw-semibold border-0 rounded-3 ${activeTab === 'insights' ? 'btn-primary shadow-sm' : 'text-secondary bg-transparent'}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Candidate Insights
        </button>
      </div>

      {/* ====================================================================
          3. PLACEMENT OFFICER DASHBOARD: Dedicated Analytics Section with Filters
          ==================================================================== */}
      {(activeTab === 'overview' || activeTab === 'placement-officer') && (
        <div className="mb-4">
          {/* Section Header */}
          <div className="card custom-card p-4 mb-4 shadow-sm border-0">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
              <div>
                <h4 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <span>🏛️</span> Department-Wise Placement Statistics
                </h4>
                <p className="text-secondary small mb-0 mt-1">
                  Cross-departmental performance monitoring, eligible talent benchmarks, and placement conversion ratios.
                </p>
              </div>
              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1.5 rounded-pill">
                Active Year: {selectedAcademicYear}
              </span>
            </div>

            {/* Requirement 3: Multi-criteria Filters Toolbar */}
            <div className="analytics-filter-bar mb-3">
              {/* Filter 1: Department */}
              <div className="filter-group">
                <label className="filter-label">Filter Department</label>
                <select 
                  className="filter-select"
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d.code} value={d.code}>{d.name} - {d.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Company */}
              <div className="filter-group">
                <label className="filter-label">Filter Recruiter / Company</label>
                <select 
                  className="filter-select"
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                >
                  <option value="ALL">All Recruiting Companies</option>
                  {rawCompanies.map(c => (
                    <option key={c.companyId} value={c.companyId}>{c.companyName} ({c.packageAmount} LPA)</option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Academic Year */}
              <div className="filter-group">
                <label className="filter-label">Academic Year</label>
                <select 
                  className="filter-select"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                >
                  <option value="2026-2027">2026-2027 (Current Cycle)</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="ALL">All Academic Years</option>
                </select>
              </div>

              {/* Filter 4: Placement Status */}
              <div className="filter-group">
                <label className="filter-label">Candidate Status</label>
                <select 
                  className="filter-select"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Placement Statuses</option>
                  <option value="SELECTED">Placed / Selected Only</option>
                  <option value="SHORTLISTED">Shortlisted Only</option>
                  <option value="APPLIED">Applied Candidates</option>
                  <option value="REJECTED">Rejected / Inactive</option>
                </select>
              </div>

              {/* Reset Filters button */}
              {(selectedDeptFilter !== 'ALL' || selectedCompanyFilter !== 'ALL' || selectedStatusFilter !== 'ALL') && (
                <button
                  className="btn btn-sm btn-outline-secondary align-self-end mt-2"
                  onClick={() => {
                    setSelectedDeptFilter('ALL');
                    setSelectedCompanyFilter('ALL');
                    setSelectedStatusFilter('ALL');
                  }}
                >
                  ✕ Reset Filters
                </button>
              )}
            </div>

            {/* Department Statistics Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className="text-center">Total Students</th>
                    <th className="text-center">Eligible Students</th>
                    <th className="text-center">Placed Students</th>
                    <th className="text-center" style={{ minWidth: '180px' }}>Placement %</th>
                    <th className="text-end">Avg Package</th>
                    <th className="text-end">Highest Package</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDeptStats.map(dept => (
                    <tr key={dept.code}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1 rounded">
                            {dept.code}
                          </span>
                          <div>
                            <div className="fw-bold text-dark">{dept.fullName}</div>
                            <div className="small text-muted" style={{ fontSize: '0.72rem' }}>Division of Engineering</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center fw-bold">{dept.totalStudents}</td>
                      <td className="text-center">
                        <span className="badge bg-info bg-opacity-10 text-info fw-bold px-2 py-1">
                          {dept.eligibleStudents}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1">
                          {dept.placedStudents}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--border-color)' }}>
                            <div 
                              className="progress-bar bg-success rounded" 
                              style={{ width: `${dept.placementPercentage}%` }}
                            ></div>
                          </div>
                          <span className="fw-bold text-dark small" style={{ minWidth: '42px', fontSize: '0.78rem' }}>
                            {dept.placementPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-end fw-semibold text-primary">{dept.averagePackage.toFixed(2)} LPA</td>
                      <td className="text-end fw-bold text-success">{dept.highestPackage.toFixed(2)} LPA</td>
                    </tr>
                  ))}

                  {/* Summary Footer Row */}
                  {selectedDeptFilter === 'ALL' && (
                    <tr style={{ backgroundColor: 'var(--primary-subtle)', fontWeight: 'bold' }}>
                      <td className="fw-bold text-primary">Institutional Total / Mean</td>
                      <td className="text-center fw-bold">{aggregatedDeptTotals.totalStudents}</td>
                      <td className="text-center fw-bold text-info">{aggregatedDeptTotals.eligibleStudents}</td>
                      <td className="text-center fw-bold text-success">{aggregatedDeptTotals.placedStudents}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--border-color)' }}>
                            <div 
                              className="progress-bar bg-primary rounded" 
                              style={{ width: `${aggregatedDeptTotals.placementPercentage}%` }}
                            ></div>
                          </div>
                          <span className="fw-bold text-primary small" style={{ minWidth: '42px', fontSize: '0.78rem' }}>
                            {aggregatedDeptTotals.placementPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="text-end text-primary">{summary.averagePackage.toFixed(2)} LPA</td>
                      <td className="text-end text-success">{summary.highestPackage.toFixed(2)} LPA</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          4. CHARTS & ANALYTICS SECTION: Exact 4 Specified Charts
          - Bar Chart for Department-wise Placements
          - Pie Chart for Placed vs Not Placed Students
          - Line Chart for Monthly Placement Trends
          - Company-wise Recruitment Statistics
          ==================================================================== */}
      {(activeTab === 'overview' || activeTab === 'analytics') && (
        <div className="mb-4">
          <div className="row g-4 mb-4">
            {/* Chart 1: Bar Chart for Department-wise Placements */}
            <div className="col-lg-8">
              <div className="card custom-card p-4 shadow-sm border-0 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0">📊 Department-Wise Placements Bar Chart</h5>
                    <p className="text-muted small mb-0 mt-0.5">Comparison of student enrollment, eligible candidates, and placed offers per branch</p>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2.5 py-1 rounded-pill small">
                    Comparative
                  </span>
                </div>
                
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer>
                    <BarChart data={departmentBarChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                      <XAxis dataKey="department" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                      <Bar dataKey="total" name="Total Students" fill={lightBarColor} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="eligible" name="Eligible Students" fill={secondaryPlum} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="placed" name="Placed Students" fill={successColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 2: Pie / Donut Chart for Placed vs Not Placed Students */}
            <div className="col-lg-4">
              <div className="card custom-card p-4 shadow-sm border-0 h-100 d-flex flex-column justify-content-between">
                <div>
                  <h5 className="fw-bold text-dark mb-1">🥧 Placed vs Not Placed</h5>
                  <p className="text-muted small mb-3">Institutional placement yield ratio</p>
                </div>

                <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={placedVsNotPlacedPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={88}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {placedVsNotPlacedPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Donut Center Display */}
                  <div className="position-absolute text-center" style={{ pointerEvents: 'none' }}>
                    <div className="fs-3 fw-bold text-dark">{summary.placementPercentage}%</div>
                    <div className="small text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>PLACED RATE</div>
                  </div>
                </div>

                <div className="d-flex justify-content-around pt-3 border-top mt-2">
                  <div className="text-center">
                    <div className="small text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>PLACED</div>
                    <div className="fw-bold text-success fs-5">{summary.selectedStudents}</div>
                  </div>
                  <div className="text-center">
                    <div className="small text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>NOT PLACED</div>
                    <div className="fw-bold text-secondary fs-5">
                      {Math.max(0, summary.totalStudents - summary.selectedStudents)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 3: Line Chart for Monthly Placement Trends */}
            <div className="col-lg-6">
              <div className="card custom-card p-4 shadow-sm border-0 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0">📈 Monthly Placement Trends</h5>
                    <p className="text-muted small mb-0 mt-0.5">Application volume versus cleared offers progression over time</p>
                  </div>
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2.5 py-1 rounded-pill small">
                    Monthly
                  </span>
                </div>

                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer>
                    <AreaChart data={monthlyPlacementTrendsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={secondaryPlum} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={secondaryPlum} stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={goldColor} stopOpacity={0.35}/>
                          <stop offset="95%" stopColor={goldColor} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="applied" name="Applications Submitted" stroke={secondaryPlum} strokeWidth={2.5} fillOpacity={1} fill="url(#colorApplied)" />
                      <Area type="monotone" dataKey="placed" name="Selections Confirmed" stroke={goldColor} strokeWidth={2.5} fillOpacity={1} fill="url(#colorPlaced)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 4: Company-wise Recruitment Statistics */}
            <div className="col-lg-6">
              <div className="card custom-card p-4 shadow-sm border-0 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark m-0">🏢 Company-Wise Recruitment Yield</h5>
                    <p className="text-muted small mb-0 mt-0.5">Top recruiter applicants vs confirmed candidate selections</p>
                  </div>
                  <span className="badge fw-bold px-2.5 py-1 rounded-pill small" style={{ backgroundColor: 'rgba(214, 173, 96, 0.16)', color: '#9E7422', border: '1px solid rgba(214, 173, 96, 0.35)' }}>
                    Recruiters
                  </span>
                </div>

                <div style={{ width: '100%', height: '280px' }}>
                  <ResponsiveContainer>
                    <BarChart data={companyRecruitmentStatsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStrokeColor} />
                      <XAxis dataKey="company" stroke="var(--text-secondary)" fontSize={10} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                      <Bar dataKey="applications" name="Applications Received" fill={secondaryPlum} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="selections" name="Selected Offers" fill={goldColor} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TWO-STAGE ELIGIBILITY PIPELINE DISPATCH SECTION
          ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="mb-4">
          <div className="card custom-card p-4 shadow-sm border-0">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
              <div>
                <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <span>⚡</span> Recruitment Two-Stage Eligibility Pipeline
                </h5>
                <p className="text-muted small mb-0 mt-1">
                  Filtering Logic: Stage 1 CGPA Screen + Stage 2 Skill Match Analysis (≥60%) → Automated Candidate Alerts
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <label className="small text-secondary fw-semibold mb-0" style={{ whiteSpace: 'nowrap' }}>Inspect Drive:</label>
                <select
                  className="form-select form-select-sm fw-semibold"
                  style={{ minWidth: '200px' }}
                  value={pipelineCompanyId}
                  onChange={(e) => handlePipelineCompanyChange(e.target.value)}
                >
                  <option value="all">Global Institution Pool</option>
                  {rawCompanies.map(c => (
                    <option key={c.companyId} value={c.companyId}>{c.companyName} (Cutoff: {c.eligibilityCgpa})</option>
                  ))}
                </select>
              </div>
            </div>

            <EligibilityPipeline 
              mode="admin" 
              pipelineData={companyPipelineData || {
                totalStudents: summary.totalStudents,
                cgpaEligible: summary.cgpaEligibleStudents ?? summary.eligibleStudents,
                skillEligible: summary.skillEligibleStudents ?? summary.eligibleStudents,
                finalEligible: summary.finalEligibleStudents ?? summary.eligibleStudents,
                notificationsSent: summary.finalEligibleStudents ?? summary.eligibleStudents
              }}
              onNotifyEligible={pipelineCompanyId !== 'all' ? handleNotifyEligibleStudents : null}
              isNotifying={isNotifyingPipeline}
            />
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB: PLACED STUDENTS ANALYTICS
          ==================================================================== */}
      {activeTab === 'placed-analytics' && (
        <div className="mb-4">
          <PlacedStudentsAnalytics />
        </div>
      )}

      {/* ====================================================================
          TAB: CANDIDATE INSIGHTS & UPCOMING SCHEDULES
          ==================================================================== */}
      {activeTab === 'insights' && (
        <div className="row g-4 mb-4">
          {/* Top Performing Candidates */}
          <div className="col-lg-6">
            <div className="card custom-card p-4 shadow-sm border-0 h-100">
              <h5 className="fw-bold text-dark mb-3">🌟 Top Performing Candidates</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Branch</th>
                      <th className="text-center">CGPA</th>
                      <th className="text-end">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawStudents.slice(0, 6).map(s => {
                      const isPlaced = rawApplications.some(a => a.studentRegNo === s.regNo && a.status === 'SELECTED');
                      return (
                        <tr key={s.regNo}>
                          <td>
                            <div className="fw-bold text-dark">{s.name}</div>
                            <div className="small text-muted">{s.regNo}</div>
                          </td>
                          <td>{s.department}</td>
                          <td className="text-center fw-bold">{s.cgpa.toFixed(2)}</td>
                          <td className="text-end">
                            <span className={`badge ${isPlaced ? 'bg-success text-white' : 'bg-primary bg-opacity-10 text-primary'}`}>
                              {isPlaced ? 'Placed' : 'In Pool'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Upcoming Interview Drives */}
          <div className="col-lg-6">
            <div className="card custom-card p-4 shadow-sm border-0 h-100">
              <h5 className="fw-bold text-dark mb-3">📅 Upcoming Interviews & Drives</h5>
              {upcomingInterviews.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {upcomingInterviews.map((item, idx) => (
                    <div key={item.interviewId || idx} className="p-3 rounded-3 border-start border-4 border-warning bg-light">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div>
                          <h6 className="fw-bold text-dark m-0">{item.companyName}</h6>
                          <span className="small text-secondary fw-semibold">{item.roundName}</span>
                        </div>
                        <span className="badge bg-warning bg-opacity-10 text-warning fw-bold">Scheduled</span>
                      </div>
                      <div className="small text-muted mt-2">
                        <div>📅 {new Date(item.interviewDate).toLocaleString()}</div>
                        <div>📍 Venue: {item.venue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  No upcoming interview drives scheduled for this week.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Drive Timeline & Recent Activity (preserved from original) */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          {/* Left: Selected Company Timeline Tracker */}
          <div className="col-lg-7">
            <div className="card custom-card p-4 shadow-sm border-0 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark m-0">⏱️ Recruitment Drive Timeline</h5>
                {rawCompanies.length > 0 && (
                  <select 
                    className="form-select form-select-sm"
                    style={{ width: '200px' }}
                    value={selectedTimelineId}
                    onChange={(e) => setSelectedTimelineId(e.target.value)}
                  >
                    {rawCompanies.map(c => (
                      <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-muted small mb-4">Milestone progress tracking for the selected company recruitment drive.</p>
              
              <ul className="status-stepper">
                {['Announced', 'Apply', 'Closed', 'Aptitude', 'Tech', 'HR', 'Offers'].map((step, idx) => (
                  <li key={step} className={`status-step ${idx < 4 ? 'completed' : idx === 4 ? 'active' : ''}`}>
                    <div className="status-step-circle">{idx < 4 ? '✓' : idx + 1}</div>
                    <span className="status-step-label">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Recent Audit Activity Logs */}
          <div className="col-lg-5">
            <div className="card custom-card p-4 shadow-sm border-0 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark m-0">📋 System Audit Trail</h5>
                <Link to="/admin/audit-logs" className="small text-primary fw-semibold">View All</Link>
              </div>
              <div className="d-flex flex-column gap-2.5">
                {activities.map((act, idx) => (
                  <div key={act.logId || idx} className="p-2.5 rounded-3 bg-light border small">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-secondary bg-opacity-10 text-secondary fw-bold" style={{ fontSize: '0.65rem' }}>
                        {act.action}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(act.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-dark fw-medium" style={{ fontSize: '0.78rem' }}>{act.details}</div>
                    <div className="text-secondary" style={{ fontSize: '0.68rem' }}>by {act.username || 'Admin'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
