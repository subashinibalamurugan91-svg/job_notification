import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for API calls to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      // Only purge credentials and redirect if this was an expired/invalid token request on a protected route,
      // NOT during login / registration attempts
      if (!requestUrl.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// API Services Export
export const authService = {
  login: async (email, password, role) => {
    const response = await api.post('/auth/login', { email, password, role });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  register: async (studentData) => {
    const response = await api.post('/auth/register', studentData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const studentService = {
  getProfile: async () => {
    const response = await api.get('/students/me');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/students/me', profileData);
    return response.data;
  },
  updateSkills: async (skills) => {
    const response = await api.put('/students/me/skills', skills);
    return response.data;
  },
  getEligibilityOverview: async () => {
    const response = await api.get('/students/me/eligibility-overview');
    return response.data;
  },
  getAllStudents: async () => {
    const response = await api.get('/admin/students');
    return response.data;
  },
  uploadResume: async (formData) => {
    const response = await api.post('/students/me/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  deleteResume: async () => {
    const response = await api.delete('/students/me/resume');
    return response.data;
  },
  downloadResumeUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/students/resume/download/${id}?token=${token}`;
  }
};

export const companyService = {
  getCompanies: async () => {
    const response = await api.get('/companies');
    return response.data;
  },
  getCompany: async (id) => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },
  createCompany: async (companyData) => {
    const response = await api.post('/admin/companies', companyData);
    return response.data;
  },
  updateCompany: async (id, companyData) => {
    const response = await api.put(`/admin/companies/${id}`, companyData);
    return response.data;
  },
  deleteCompany: async (id) => {
    const response = await api.delete(`/admin/companies/${id}`);
    return response.data;
  },
  getEligibilityPipeline: async (id) => {
    const response = await api.get(`/companies/${id}/eligibility-pipeline`);
    return response.data;
  },
  notifyEligible: async (id) => {
    const response = await api.post(`/admin/companies/${id}/notify-eligible`);
    return response.data;
  }
};

export const applicationService = {
  apply: async (companyId) => {
    const response = await api.post('/applications', { companyId });
    return response.data;
  },
  checkEligibility: async (companyId) => {
    const response = await api.get(`/applications/check-eligibility/${companyId}`);
    return response.data;
  },
  getMyApplications: async () => {
    const response = await api.get('/applications/me');
    return response.data;
  },
  getAllApplications: async () => {
    const response = await api.get('/admin/applications');
    return response.data;
  },
  updateStatus: async (id, status, remarks) => {
    const response = await api.put(`/admin/applications/${id}/status`, { status, remarks });
    return response.data;
  },
  getHistory: async (id) => {
    const response = await api.get(`/applications/${id}/history`);
    return response.data;
  }
};


export const interviewService = {
  getInterviews: async () => {
    const response = await api.get('/interviews');
    return response.data;
  },
  getUpcomingInterviews: async () => {
    const response = await api.get('/interviews/upcoming');
    return response.data;
  },
  getStudentInterviews: async () => {
    const response = await api.get('/interviews/student');
    return response.data;
  },
  createInterview: async (interviewData) => {
    const response = await api.post('/interviews', interviewData);
    return response.data;
  },
  updateInterview: async (id, interviewData) => {
    const response = await api.put(`/interviews/${id}`, interviewData);
    return response.data;
  },
  deleteInterview: async (id) => {
    const response = await api.delete(`/interviews/${id}`);
    return response.data;
  }
};

export const referenceService = {
  getReferences: async (params = {}) => {
    const response = await api.get('/references', { params });
    return response.data;
  },
  getRecentReferences: async (limit = 5) => {
    const response = await api.get('/references/recent', { params: { limit } });
    return response.data;
  },
  getReferenceStats: async () => {
    const response = await api.get('/references/stats');
    return response.data;
  },
  getReferenceById: async (id) => {
    const response = await api.get(`/references/${id}`);
    return response.data;
  },
  uploadReference: async (formData) => {
    // Requires multipart config
    const response = await api.post('/admin/references', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  updateReference: async (id, data) => {
    const response = await api.put(`/admin/references/${id}`, data);
    return response.data;
  },
  deleteReference: async (id) => {
    const response = await api.delete(`/admin/references/${id}`);
    return response.data;
  },
  downloadReference: async (id) => {
    const response = await api.get(`/references/download/${id}?download=true`, { responseType: 'blob' });
    return response.data;
  },
  downloadReferenceUrl: (id, forceDownload = true) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/references/download/${id}?token=${token}&download=${forceDownload}`;
  },
  previewReferenceUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/references/preview/${id}?token=${token}`;
  },
  // Backward compatibility aliases
  getResources: async (params) => referenceService.getReferences(params),
  uploadResource: async (formData) => referenceService.uploadReference(formData),
  deleteResource: async (id) => referenceService.deleteReference(id),
  downloadResource: async (id) => referenceService.downloadReference(id),
  downloadResourceUrl: (id, forceDownload = false) => referenceService.downloadReferenceUrl(id, forceDownload)
};

export const resourceService = referenceService;

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  broadcastAnnouncement: async (title, message) => {
    const response = await api.post('/admin/notifications/announcement', { title, message });
    return response.data;
  }
};

export const analyticsService = {
  getSummary: async () => {
    const response = await api.get('/admin/analytics/summary');
    return response.data;
  },
  getIntelligence: async () => {
    const response = await api.get('/admin/analytics/intelligence');
    return response.data;
  },
  getCompanyStats: async () => {
    const response = await api.get('/admin/analytics/company-wise');
    return response.data;
  },
  getDeptStats: async () => {
    const response = await api.get('/admin/analytics/department-wise');
    return response.data;
  },
  getMonthlyTrends: async () => {
    const response = await api.get('/admin/analytics/monthly-trends');
    return response.data;
  },
  getApplicationsCsvUrl: () => `${API_BASE_URL}/admin/reports/applications.csv`,
  getSelectedCsvUrl: () => `${API_BASE_URL}/admin/reports/selected.csv`,
};

export const adminService = {
  getAuditLogs: async () => {
    const response = await api.get('/admin/audit-logs');
    return response.data;
  }
};

export const readinessService = {
  getMyReadiness: async () => {
    const response = await api.get('/readiness/me');
    return response.data;
  },
  getAdminSummary: async () => {
    const response = await api.get('/admin/readiness/summary');
    return response.data;
  }
};

export const driveService = {
  getDriveAnalytics: async (companyId) => {
    const response = await api.get(`/admin/drives/${companyId}/analytics`);
    return response.data;
  }
};

export const placementService = {
  getPlacedStudents: async (params = {}) => {
    const response = await api.get('/admin/placed-students', { params });
    return response.data;
  },
  getPlacementAnalytics: async (params = {}) => {
    const response = await api.get('/admin/placed-students/analytics', { params });
    return response.data;
  },
  getDepartmentStats: async (params = {}) => {
    const response = await api.get('/admin/placed-students/department-stats', { params });
    return response.data;
  },
  updatePlacementStatus: async (id, data) => {
    const response = await api.put(`/admin/placed-students/${id}/status`, data);
    return response.data;
  },
  getExportCsvUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/admin/placed-students/export/csv?${query}&token=${token}`;
  },
  getExportExcelUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/admin/placed-students/export/excel?${query}&token=${token}`;
  },
  getExportDeptExcelUrl: (academicYear) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/admin/placed-students/export/department-stats/excel?academicYear=${academicYear || 'ALL'}&token=${token}`;
  },
  getExportDeptPdfUrl: (academicYear) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/admin/placed-students/export/department-stats/pdf?academicYear=${academicYear || 'ALL'}&token=${token}`;
  },
  downloadDeptExcel: async (academicYear) => {
    const response = await api.get('/admin/placed-students/export/department-stats/excel', {
      params: { academicYear: academicYear || 'ALL' },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'department_placement_statistics.xls');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadPlacedExcel: async (params = {}) => {
    const response = await api.get('/admin/placed-students/export/excel', {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'placed_students.xls');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default api;

