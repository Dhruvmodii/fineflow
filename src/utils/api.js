import axios from 'axios';

const BASE = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('finflow_token');
      localStorage.removeItem('finflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
