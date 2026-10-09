const API_BASE = '/api';

const getToken = () => localStorage.getItem('eventease_token');

export const apiFetch = async (endpoint, options = {}, retries = 1) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      // Server might be briefly reloading; wait 500ms and retry once
      await new Promise((r) => setTimeout(r, 500));
      return apiFetch(endpoint, options, retries - 1);
    }
    throw err;
  }
};

export const api = {
  auth: {
    login: (credentials) =>
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    sendRegistrationOtp: (email, name, role) =>
      apiFetch('/auth/send-registration-otp', {
        method: 'POST',
        body: JSON.stringify({ email, name, role }),
      }),
    register: (userData) =>
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    sendForgotPasswordOtp: (email) =>
      apiFetch('/auth/forgot-password-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPasswordOtp: (payload) =>
      apiFetch('/auth/reset-password-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMe: () => apiFetch('/auth/me'),
    getDemoAccounts: () => apiFetch('/auth/demo-accounts'),
    applyOrganizer: (data) =>
      apiFetch('/auth/apply-organizer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resetSeed: () =>
      apiFetch('/auth/reset-seed', {
        method: 'POST',
      }),
  },
  events: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/events${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiFetch(`/events/${id}`),
    create: (eventData) =>
      apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    update: (id, eventData) =>
      apiFetch(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      }),
    delete: (id) =>
      apiFetch(`/events/${id}`, {
        method: 'DELETE',
      }),
  },
  registrations: {
    register: (eventId, data = {}) =>
      apiFetch(`/registrations/register/${eventId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyTickets: () => apiFetch('/registrations/my-tickets'),
    getTicket: (code) => apiFetch(`/registrations/ticket/${code}`),
    checkIn: (payload) =>
      apiFetch('/registrations/check-in', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    toggleManual: (regId) =>
      apiFetch(`/registrations/manual-check-in/${regId}`, {
        method: 'POST',
      }),
    getParticipants: (eventId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiFetch(`/registrations/event/${eventId}/participants${query ? `?${query}` : ''}`);
    },
    getAnalytics: (eventId) =>
      apiFetch(`/registrations/event/${eventId}/analytics`),
    getExportUrl: (eventId) => {
      const token = getToken();
      return `${API_BASE}/registrations/event/${eventId}/export-csv${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    },
    exportCSV: async (eventId, eventTitle = 'attendance') => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/registrations/event/${eventId}/export-csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${(eventTitle || 'event').replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    sendReminders: (eventId, alertTitle) =>
      apiFetch(`/registrations/event/${eventId}/send-reminders`, {
        method: 'POST',
        body: JSON.stringify({ alertTitle }),
      }),
  },
  ai: {
    generateEvent: (prompt, category) =>
      apiFetch('/ai/generate-event', {
        method: 'POST',
        body: JSON.stringify({ prompt, category }),
      }),
    chat: (message, conversationHistory = []) =>
      apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversationHistory }),
      }),
    getReport: (eventId) =>
      apiFetch(`/ai/report/${eventId}`, {
        method: 'POST',
      }),
  },
  certificates: {
    issue: (eventId) =>
      apiFetch(`/certificates/issue/${eventId}`, {
        method: 'POST',
      }),
    getMyCertificates: () => apiFetch('/certificates/my-certificates'),
    verify: (certificateId) => apiFetch(`/certificates/verify/${certificateId}`),
  },
  admin: {
    getStats: () => apiFetch('/admin/stats'),
    getUsers: () => apiFetch('/admin/users'),
    updateRole: (userId, role) =>
      apiFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }),
    getOrganizerRequests: () => apiFetch('/admin/organizer-requests'),
    reviewOrganizerRequest: (userId, action, reviewNotes) =>
      apiFetch(`/admin/organizer-requests/${userId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ action, reviewNotes }),
      }),
    getPendingEvents: () => apiFetch('/admin/pending-events'),
    reviewEvent: (eventId, action, feedback) =>
      apiFetch(`/admin/pending-events/${eventId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ action, feedback }),
      }),
  },
};

export default api;
