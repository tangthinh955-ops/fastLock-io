import axios from 'axios';
import { API_URL } from '../config/env';

// Tạo Axios instance kết nối tới Backend NestJS
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm Token vào Header nếu đã đăng nhập
apiClient.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý khi Token hết hạn (Lỗi 401)
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    const requestUrl = String(error?.config?.url ?? '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


export default apiClient;
