import axios from 'axios';
import { supabase } from '../auth/supabase';
import { API_BASE_URL } from '../config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Surface error messages cleanly
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    const message = error.response?.data?.detail ?? error.message ?? 'Unknown error';
    return Promise.reject(new Error(message));
  },
);
