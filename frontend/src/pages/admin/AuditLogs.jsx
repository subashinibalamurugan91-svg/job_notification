import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  // Filter logs
  const filtered = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === '' || log.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">Security Audit Records</h2>
        <p className="text-muted small mb-0">Monitor placement drive configuration edits, coordinator updates, and authentication logs</p>
      </div>

      {/* Filter options */}
      <div className="filter-card shadow-sm mb-4">
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label small fw-bold text-secondary">Search Logs</label>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Search actions, editor emails, detail text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small fw-bold text-secondary">Role Filter</label>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="STUDENT">STUDENT</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card custom-card shadow-sm">
        <div className="table-responsive" style={{ maxHeight: '550px' }}>
          <table className="table table-hover align-middle m-0">
            <thead>
              <tr>
                <th className="sticky-top bg-light">Timestamp</th>
                <th className="sticky-top bg-light">Action</th>
                <th className="sticky-top bg-light">Performed By</th>
                <th className="sticky-top bg-light">Role</th>
                <th className="sticky-top bg-light">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.logId}>
                    <td className="small text-secondary text-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge-status ${
                        log.action.includes('DELETE') ? 'rejected' :
                        log.action.includes('CREATE') ? 'selected' :
                        log.action.includes('UPDATE') ? 'shortlisted' : 'applied'
                      }`} style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="fw-semibold text-secondary small">{log.performedBy}</td>
                    <td>
                      <span className={`badge badge-status ${log.role === 'ADMIN' ? 'eligible' : 'applied'} fw-bold`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="text-secondary small">{log.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted small">No audit logs matching search filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
