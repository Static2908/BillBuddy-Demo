
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the stored JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('billbuddy_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Handle expired or invalid authentication tokens.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''

    const isLoginRequest = requestUrl.includes('/api/auth/login')
    const isRegisterRequest = requestUrl.includes('/api/auth/register')

    // These endpoints can return 401 when the supplied current password
    // is incorrect. Preserve the session so the form can display the error.
    const isPasswordChangeRequest = requestUrl.includes(
      '/api/users/me/password',
    )
    const isAccountDeletionRequest =
      requestUrl.includes('/api/users/me') &&
      error.config?.method?.toLowerCase() === 'delete'

    const isCredentialVerificationRequest =
      isPasswordChangeRequest || isAccountDeletionRequest

    if (
      status === 401 &&
      !isLoginRequest &&
      !isRegisterRequest &&
      !isCredentialVerificationRequest
    ) {
      localStorage.removeItem('billbuddy_token')
      localStorage.removeItem('billbuddy_user')

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)

// Authentication APIs.
export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
}

// Current-user and account-management APIs.
export const usersApi = {
  getMe: () => api.get('/api/users/me'),

  updateMe: (payload) => api.patch('/api/users/me', payload),

  changePassword: (payload) =>
    api.patch('/api/users/me/password', payload),

  deleteMe: (payload) =>
    api.delete('/api/users/me', { data: payload }),
}

// Bill management APIs.
export const billsApi = {
  list: (params) => api.get('/api/bills', { params }),

  get: (id) => api.get(`/api/bills/${id}`),

  // AI-generated explanation, detected anomalies, and RAG sources.
  getExplanation: (id) =>
    api.get(`/api/bills/${id}/explanation`),

  create: (payload) => api.post('/api/bills', payload),

  update: (id, payload) =>
    api.put(`/api/bills/${id}`, payload),

  remove: (id) => api.delete(`/api/bills/${id}`),

  updateStatus: (id, status) =>
    api.patch(`/api/bills/${id}/status`, { status }),

  addLineItem: (billId, payload) =>
    api.post(`/api/bills/${billId}/line-items`, payload),

  updateLineItem: (billId, itemId, payload) =>
    api.put(`/api/bills/${billId}/line-items/${itemId}`, payload),

  removeLineItem: (billId, itemId) =>
    api.delete(`/api/bills/${billId}/line-items/${itemId}`),
}

// Dashboard and analytics APIs.
export const analyticsApi = {
  summary: (params) =>
    api.get('/api/analytics/summary', { params }),

  compare: (id, previousBillId) =>
    api.get(`/api/bills/${id}/comparison`, {
      params: { previousBillId },
    }),
}

export default api
