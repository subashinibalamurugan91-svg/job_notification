import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './layouts/Layout';

// Loading Indicator Spinner for Suspense boundaries
const SuspenseLoader = () => (
  <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light bg-opacity-10">
    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
    <span className="mt-3 text-secondary fw-semibold">Loading Portal Component...</span>
  </div>
);

// Public Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ProjectShowcase = lazy(() => import('./pages/ProjectShowcase'));

// Student Pages (Lazy Loaded)
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const StudentEligibility = lazy(() => import('./pages/student/StudentEligibility'));
const EligibleCompanies = lazy(() => import('./pages/student/EligibleCompanies'));
const MyApplications = lazy(() => import('./pages/student/MyApplications'));
const StudentInterviews = lazy(() => import('./pages/student/StudentInterviews'));
const PreparationReferences = lazy(() => import('./pages/student/PreparationReferences'));
const PreparationResources = PreparationReferences;
const Notifications = lazy(() => import('./pages/student/Notifications'));
const RecruitmentCalendar = lazy(() => import('./pages/student/RecruitmentCalendar'));
const ReadinessDashboard = lazy(() => import('./pages/student/ReadinessDashboard'));
const DriveDetails = lazy(() => import('./pages/student/DriveDetails'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentManagement = lazy(() => import('./pages/admin/StudentManagement'));
const AdminEligibility = lazy(() => import('./pages/admin/AdminEligibility'));
const AdminReadiness = lazy(() => import('./pages/admin/AdminReadiness'));
const CompanyManagement = lazy(() => import('./pages/admin/CompanyManagement'));
const ApplicationManagement = lazy(() => import('./pages/admin/ApplicationManagement'));
const InterviewManagement = lazy(() => import('./pages/admin/InterviewManagement'));
const ReferenceManagement = lazy(() => import('./pages/admin/ReferenceManagement'));
const ResourceManagement = ReferenceManagement;
const PlacedStudents = lazy(() => import('./pages/admin/PlacedStudents'));
const ReportsModule = lazy(() => import('./pages/admin/ReportsModule'));
const Announcements = lazy(() => import('./pages/admin/Announcements'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// System Pages (Lazy Loaded)
const Settings = lazy(() => import('./pages/Settings'));

// Lazy load named exports from ErrorPages
const NotFoundPage = lazy(() => import('./pages/ErrorPages').then(m => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('./pages/ErrorPages').then(m => ({ default: m.ForbiddenPage })));
const ServerErrorPage = lazy(() => import('./pages/ErrorPages').then(m => ({ default: m.ServerErrorPage })));

// Helper component to check authentication and roles
const RouteGuard = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SuspenseLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/403" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Root index redirector
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SuspenseLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'ADMIN' 
    ? <Navigate to="/admin/dashboard" replace /> 
    : <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<SuspenseLoader />}>
            <Routes>
              {/* Root Redirect Route */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/showcase" element={<ProjectShowcase />} />

              {/* Student Routes */}
              <Route path="/student/dashboard" element={<RouteGuard allowedRole="STUDENT"><StudentDashboard /></RouteGuard>} />
              <Route path="/student/profile" element={<RouteGuard allowedRole="STUDENT"><StudentProfile /></RouteGuard>} />
              <Route path="/student/eligibility" element={<RouteGuard allowedRole="STUDENT"><StudentEligibility /></RouteGuard>} />
              <Route path="/student/readiness" element={<RouteGuard allowedRole="STUDENT"><ReadinessDashboard /></RouteGuard>} />
              <Route path="/student/companies" element={<RouteGuard allowedRole="STUDENT"><EligibleCompanies /></RouteGuard>} />
              <Route path="/student/companies/:id" element={<RouteGuard allowedRole="STUDENT"><DriveDetails /></RouteGuard>} />
              <Route path="/student/applications" element={<RouteGuard allowedRole="STUDENT"><MyApplications /></RouteGuard>} />
              <Route path="/student/interviews" element={<RouteGuard allowedRole="STUDENT"><StudentInterviews /></RouteGuard>} />
              <Route path="/student/calendar" element={<RouteGuard allowedRole="STUDENT"><RecruitmentCalendar /></RouteGuard>} />
              <Route path="/student/references" element={<RouteGuard allowedRole="STUDENT"><PreparationReferences /></RouteGuard>} />
              <Route path="/student/resources" element={<RouteGuard allowedRole="STUDENT"><PreparationReferences /></RouteGuard>} />
              <Route path="/student/notifications" element={<RouteGuard allowedRole="STUDENT"><Notifications /></RouteGuard>} />
              <Route path="/student/settings" element={<RouteGuard allowedRole="STUDENT"><Settings /></RouteGuard>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<RouteGuard allowedRole="ADMIN"><AdminDashboard /></RouteGuard>} />
              <Route path="/admin/students" element={<RouteGuard allowedRole="ADMIN"><StudentManagement /></RouteGuard>} />
              <Route path="/admin/companies" element={<RouteGuard allowedRole="ADMIN"><CompanyManagement /></RouteGuard>} />
              <Route path="/admin/eligibility" element={<RouteGuard allowedRole="ADMIN"><AdminEligibility /></RouteGuard>} />
              <Route path="/admin/placed-students" element={<RouteGuard allowedRole="ADMIN"><PlacedStudents /></RouteGuard>} />
              <Route path="/admin/readiness" element={<RouteGuard allowedRole="ADMIN"><AdminReadiness /></RouteGuard>} />
              <Route path="/admin/reports" element={<RouteGuard allowedRole="ADMIN"><ReportsModule /></RouteGuard>} />
              <Route path="/admin/applications" element={<RouteGuard allowedRole="ADMIN"><ApplicationManagement /></RouteGuard>} />
              <Route path="/admin/interviews" element={<RouteGuard allowedRole="ADMIN"><InterviewManagement /></RouteGuard>} />
              <Route path="/admin/calendar" element={<RouteGuard allowedRole="ADMIN"><RecruitmentCalendar /></RouteGuard>} />
              <Route path="/admin/references" element={<RouteGuard allowedRole="ADMIN"><ReferenceManagement /></RouteGuard>} />
              <Route path="/admin/resources" element={<RouteGuard allowedRole="ADMIN"><ReferenceManagement /></RouteGuard>} />
              <Route path="/admin/announcements" element={<RouteGuard allowedRole="ADMIN"><Announcements /></RouteGuard>} />
              <Route path="/admin/audit-logs" element={<RouteGuard allowedRole="ADMIN"><AuditLogs /></RouteGuard>} />
              <Route path="/admin/settings" element={<RouteGuard allowedRole="ADMIN"><Settings /></RouteGuard>} />

              {/* Error Boundary Routes */}
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="/500" element={<ServerErrorPage />} />
              <Route path="/404" element={<NotFoundPage />} />

              {/* Default Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
