import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach access token
api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('rhinenix_tokens') || 'null');
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Response interceptor - auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const tokens = JSON.parse(localStorage.getItem('rhinenix_tokens') || 'null');
        if (tokens?.refreshToken) {
          const { data } = await axios.post('/api/v1/auth/refresh-token', {
            refreshToken: tokens.refreshToken,
          });
          localStorage.setItem('rhinenix_tokens', JSON.stringify(data.data.tokens));
          original.headers.Authorization = `Bearer ${data.data.tokens.accessToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('rhinenix_tokens');
        localStorage.removeItem('rhinenix_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
