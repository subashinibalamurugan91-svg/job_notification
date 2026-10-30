import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light bg-opacity-25 px-3">
      <div className="card custom-card p-4 p-md-5 text-center shadow-lg border-0 rounded-4" style={{ maxWidth: '480px' }}>
        <div className="display-1 fw-bold text-primary mb-2">404</div>
        <h3 className="fw-bold text-dark mb-2">Page Not Found</h3>
        <p className="text-secondary small mb-4">
          Oops! The page you are looking for does not exist or has been moved. Check the URL or return to dashboard.
        </p>
        <div className="d-flex gap-2 justify-content-center">
          <button onClick={() => navigate(-1)} className="btn btn-secondary px-4 fw-semibold">
            Go Back
          </button>
          <Link to="/" className="btn btn-primary px-4 fw-semibold shadow-sm">
            Dashboard Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export const ForbiddenPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light bg-opacity-25 px-3">
      <div className="card custom-card p-4 p-md-5 text-center shadow-lg border-0 rounded-4" style={{ maxWidth: '480px' }}>
        <div className="display-1 fw-bold text-danger mb-2">403</div>
        <h3 className="fw-bold text-dark mb-2">Access Forbidden</h3>
        <p className="text-secondary small mb-4">
          Access Denied! You do not have the required administrative clearance to view this secure panel.
        </p>
        <Link to="/" className="btn btn-primary px-4 fw-semibold shadow-sm">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export const ServerErrorPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light bg-opacity-25 px-3">
      <div className="card custom-card p-4 p-md-5 text-center shadow-lg border-0 rounded-4" style={{ maxWidth: '480px' }}>
        <div className="display-1 fw-bold text-warning mb-2">500</div>
        <h3 className="fw-bold text-dark mb-2">Server Connection Error</h3>
        <p className="text-secondary small mb-4">
          Connection Interrupted! The central placement backend database server is currently unreachable. Please try again.
        </p>
        <button onClick={() => window.location.reload()} className="btn btn-primary px-4 fw-semibold shadow-sm">
          Retry Connection
        </button>
      </div>
    </div>
  );
};
