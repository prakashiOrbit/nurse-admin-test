import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// GET /api/{orgName}/bed/{hospCode}/{bedCode}/devicesassigned
export const getAssignedDevicesAPI = async (bedCode: string) => {
  const { orgName, hospitalCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/bed/${hospitalCode}/${bedCode}/devicesassigned`,
  );
  const deviceCodes = response.data.map((item: any) => item.deviceCode);
  return deviceCodes;
};

// POST /api/{orgName}/events/{hospCode}/start
export const startMonitoring = async (data: { deviceCode: string }) => {
  const { orgName, hospitalCode } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/events/${hospitalCode}/start`, {
    deviceCode: data.deviceCode,
  });
  return response.data;
};

// POST /api/{orgName}/events/{hospCode}/stop
export const stopMonitoring = async (data: { deviceCode: string }) => {
  const { orgName, hospitalCode } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/events/${hospitalCode}/stop`, {
    deviceCode: data.deviceCode,
  });
  return response.data;
};

// GET /api/{orgName}/events/{hospCode}/{deviceCode}/{patientCode}/status
export const checkMonitoring = async (deviceCode: string, patientCode: string) => {
  const { orgName, hospitalCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/events/${hospitalCode}/${deviceCode}/${patientCode}/status`,
  );
  return response.data;
};

// GET /api/{orgName}/device/{hospCode}/{deviceId}/getParameter
export const getDeviceConfigAPI = async (deviceId: string) => {
  const { orgName, hospitalCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/device/${hospitalCode}/${deviceId}/getParameter`,
  );
  return response.data;
};

// POST /api/{orgName}/device/{hospCode}/patient/{patientId}/config  (backend gap)
export const patientConfig = async (patientId: string, deviceType: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/device/${hospitalCode}/patient/${patientId}/config`,
    { deviceType },
  );
  return response.data;
};

// GET /api/{orgName}/device/{hospCode}/{deviceType}/default-config  (backend gap)
export const patientDefaultConfig = async (deviceType: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/device/${hospitalCode}/${deviceType}/default-config`,
  );
  return response.data;
};

// POST /api/{orgName}/device/{hospCode}/patient/{patientId}/{deviceType}/config/update
export const updatePatientConfig = async (patientId: string, deviceType: string, payload: Record<string, string>) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/device/${hospitalCode}/patient/${patientId}/${deviceType}/config/update`,
    payload,
  );
  return response.data;
};
