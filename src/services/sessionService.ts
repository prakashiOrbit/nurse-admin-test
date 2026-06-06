import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCommonDataCache } from './authService';

export const AUTH_KEYS = [
  'userName',
  'orgName',
  'hospitalCode',
  'wardCode',
  'shiftCode',
  'nurseCode',
  'nurseId',
  'authToken',
  'userId',
  'hospitalId',
  'orgId',
  'firstName',
  'lastName',
  'isAuthenticated',
  'nurseDetails',
  'authFlow',
];

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove(AUTH_KEYS);
  clearCommonDataCache();
};

export const AUTH_FLOW = {
  AUTHENTICATED: 'AUTHENTICATED',
  RESET_PASSWORD: 'RESET_PASSWORD',
} as const;

export type AuthFlow = typeof AUTH_FLOW[keyof typeof AUTH_FLOW];
