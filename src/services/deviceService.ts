import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// GET /api/{orgName}/bed/{careSiteCode}/{bedCode}/devicesassigned
export const getAssignedDevicesAPI = async (bedCode: string) => {
  const { orgName, careSiteCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/bed/${careSiteCode}/${bedCode}/devicesassigned`,
  );
  const deviceCodes = response.data.map((item: any) => item.deviceCode);
  return deviceCodes;
};

// POST /api/{orgName}/events/{careSiteCode}/start
export const startMonitoring = async (data: { deviceCode: string }) => {
  const { orgName, careSiteCode } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/events/${careSiteCode}/start`, {
    deviceCode: data.deviceCode,
  });
  return response.data;
};

// POST /api/{orgName}/events/{careSiteCode}/stop
export const stopMonitoring = async (data: { deviceCode: string }) => {
  const { orgName, careSiteCode } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/events/${careSiteCode}/stop`, {
    deviceCode: data.deviceCode,
  });
  return response.data;
};

// GET /api/{orgName}/events/{careSiteCode}/{deviceCode}/{patientCode}/status
export const checkMonitoring = async (deviceCode: string, patientCode: string) => {
  const { orgName, careSiteCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/events/${careSiteCode}/${deviceCode}/${patientCode}/status`,
  );
  return response.data;
};

// GET /api/{orgName}/device/{careSiteCode}/{deviceId}/getParameter
export const getDeviceConfigAPI = async (deviceId: string) => {
  const { orgName, careSiteCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/device/${careSiteCode}/${deviceId}/getParameter`,
  );
  return response.data;
};

// POST /api/{orgName}/device/{careSiteCode}/patient/{patientId}/config  (backend gap)
export const patientConfig = async (patientId: string, deviceType: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/device/${careSiteCode}/patient/${patientId}/config`,
    { deviceType },
  );
  return response.data;
};

// GET /api/{orgName}/device/{careSiteCode}/{deviceType}/default-config  (backend gap)
export const patientDefaultConfig = async (deviceType: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/device/${careSiteCode}/${deviceType}/default-config`,
  );
  return response.data;
};

// POST /api/{orgName}/device/{careSiteCode}/patient/{patientId}/{deviceType}/config/update
export const updatePatientConfig = async (patientId: string, deviceType: string, payload: Record<string, string>) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/device/${careSiteCode}/patient/${patientId}/${deviceType}/config/update`,
    payload,
  );
  return response.data;
};
