import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { IApplication, ApplicationFormData, GeminiParsedJD } from '../types/application';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor for adding the bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Applications
export const getApplications = () => api.get<IApplication[]>('/applications');
export const createApplication = (data: ApplicationFormData) => api.post<IApplication>('/applications', data);
export const updateApplication = (id: string, data: Partial<ApplicationFormData>) => api.put<IApplication>(`/applications/${id}`, data);
export const deleteApplication = (id: string) => api.delete(`/applications/${id}`);

// AI
export const parseJobDescription = (jdText: string) => api.post<{ parsedData: GeminiParsedJD }>('/applications/parse', { jdText });

export default api;
