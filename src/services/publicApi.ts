import axios from "axios";
import Config from 'react-native-config';

const BASE_URL=Config.API_BASE_URL;

if (!BASE_URL) {
  throw new Error('API_BASE_URL is not defined. Check your .env file.');
}

export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
  withCredentials: false,
});