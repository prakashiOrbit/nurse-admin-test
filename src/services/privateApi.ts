import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthSession } from './sessionService';
import { navigateWhenReady } from '../navigation/navigationService';

const BASE_URL = Config.API_BASE_URL;

if (!BASE_URL) {
  throw new Error('API_BASE_URL is not defined. Check your .env file.');
}

export const privateApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

privateApi.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers['X-Auth'] = token;
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

let isLoggingOut = false;

privateApi.interceptors.response.use(
  response => response,
  async error => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    const isVerify2faCall = originalRequest?.url?.includes('verify2fa');

    if ((status === 401 || status === 302) && !isVerify2faCall && !isLoggingOut) {
      isLoggingOut = true;

      await clearAuthSession();
      navigateWhenReady('NurseLogin');

      setTimeout(() => {
        isLoggingOut = false;
      }, 1000);
    }

    return Promise.reject(error);
  },
);
