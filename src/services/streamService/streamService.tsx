import EventSource from 'react-native-sse';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from '../authService';

const BASE_URL = Config.API_BASE_URL;

export const createDashboardStream = async () => {
  const { orgName, careSiteCode, nurseCode, shiftCode, wardCode } =
    await getCommonData();
  const authToken = await AsyncStorage.getItem('authToken');

  if (!orgName || !careSiteCode || !nurseCode || !wardCode || !authToken) {
    throw new Error('Missing session context');
  }

  const url =
    `${BASE_URL}/${orgName}/nurse/${careSiteCode}/dashboard/stream` +
    `?nurseCode=${nurseCode}` +
    `&shiftCode=${shiftCode ?? ''}` +
    `&wardCode=${wardCode}`;

  console.log('[SSE] Connecting:', url);

  return new EventSource(url, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-Auth': authToken,
    },
    pollingInterval: 0,
  });
};