import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// POST /api/{orgName}/telemetry/vitaldata
export const getVitalRecordsAPI = async (payload: {
  patientCode: string;
  deviceCode: string;
  vitalParams: string[];
  startTime: string;
  endTime: string;
}) => {
  const { orgName, userName, careSiteCode } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/telemetry/vitaldata`, {
    ...payload,
    orgName,
    userName,
    careSiteCode,
  });
  return response.data;
};

// POST /api/{orgName}/telemetry/vitaldata  (real-time, no time range)
export const getVitalRecordsAPIForMonitoring = async (payload: {
  patientCode: string;
  deviceCode: string;
  vitalParams: string[];
}) => {
  const { orgName, userName, careSiteCode } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/telemetry/vitaldata`, {
    ...payload,
    orgName,
    userName,
    careSiteCode,
  });
  return response.data;
};

// GET /api/{orgName}/data/{careSiteCode}/{userName}/{deviceCode}/{bedCode}/vitaldata
// NOTE: no matching endpoint in current backend — kept for backward compat
export const getVitalDataAPI = async (deviceCode: string, bedCode: string) => {
  const { orgName, careSiteCode, userName } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/data/${careSiteCode}/${userName}/${deviceCode}/${bedCode}/vitaldata`,
  );
  return response.data;
};

// POST /api/{orgName}/metadata/query
export const getMonitorDataAPI = async (
  context: string,
  param: string,
  patientId: string,
): Promise<any> => {
  const { orgName } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/metadata/query`, {
    context,
    param,
    patientId,
  });
  return response.data;
};

// POST /api/{orgName}/metadata/alarmconfig
export const fetchAlarmConfig = async (deviceId: string) => {
  const { orgName } = await getCommonData();
  const response = await privateApi.post(`/${orgName}/metadata/alarmconfig`, {
    context: 'ALARM_CONFIG',
    deviceId,
  });
  return response.data;
};
