import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// Projects
export const projectsApi = {
  list: (workspaceId: string) =>
    api.get(`/projects?workspaceId=${workspaceId}`).then((r) => r.data),
  get: (id: string) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (workspaceId: string, name: string) =>
    api.post('/projects', { workspaceId, name }).then((r) => r.data),
};

// Workspaces
export const workspacesApi = {
  list: () => api.get('/workspaces').then((r) => r.data),
};

// Clips
export const clipsApi = {
  create: (projectId: string, data: object) =>
    api.post(`/projects/${projectId}/clips`, data).then((r) => r.data),
  update: (projectId: string, clipId: string, data: object) =>
    api.patch(`/projects/${projectId}/clips/${clipId}`, data).then((r) => r.data),
  delete: (projectId: string, clipId: string) =>
    api.delete(`/projects/${projectId}/clips/${clipId}`).then((r) => r.data),
  split: (projectId: string, clipId: string, atTimeMs: number) =>
    api.post(`/projects/${projectId}/clips/${clipId}/split`, { atTimeMs }).then((r) => r.data),
};

// Effects
export const effectsApi = {
  create: (projectId: string, clipId: string, data: object) =>
    api.post(`/projects/${projectId}/clips/${clipId}/effects`, data).then((r) => r.data),
  update: (projectId: string, clipId: string, effectId: string, data: object) =>
    api.patch(`/projects/${projectId}/clips/${clipId}/effects/${effectId}`, data).then((r) => r.data),
  delete: (projectId: string, clipId: string, effectId: string) =>
    api.delete(`/projects/${projectId}/clips/${clipId}/effects/${effectId}`).then((r) => r.data),
};

// Assets
export const assetsApi = {
  getPresignedUrl: (projectId: string, filename: string, type: string, contentType: string) =>
    api.post('/assets/presigned-url', { projectId, filename, type, contentType }).then((r) => r.data),
  confirmUpload: (projectId: string, type: string, originalUrl: string, filename: string) =>
    api.post('/assets/confirm-upload', { projectId, type, originalUrl, filename }).then((r) => r.data),
  list: (projectId: string) =>
    api.get(`/assets?projectId=${projectId}`).then((r) => r.data),
};

// Exports
export const exportsApi = {
  create: (projectId: string, format = 'MP4', resolution = '1080p') =>
    api.post(`/projects/${projectId}/exports`, { format, resolution }).then((r) => r.data),
  list: (projectId: string) =>
    api.get(`/projects/${projectId}/exports`).then((r) => r.data),
};

export default api;
