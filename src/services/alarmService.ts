import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlarmDetailDTO } from '../types/Types';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';
import { getCurrentShiftNurses } from './nurseService';

// POST /api/{orgName}/alarmsummary/{hospCode}/raised/global  (nurse-scoped)
export const getRaisedAlarm = async () => {
  const nurseIdString = await AsyncStorage.getItem('nurseId');
  const nurseId: string[] = nurseIdString ? [nurseIdString] : [];
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/alarmsummary/${hospitalCode}/raised/global`,
    {
      nurseIds: nurseId,
      shiftCode: await AsyncStorage.getItem('shiftCode'),
      wardCode: await AsyncStorage.getItem('wardCode'),
    },
  );
  return response.data;
};

// POST /api/{orgName}/alarmsummary/{hospCode}/raised/global  (all-nurses-in-shift scope)
export const getGlobalRaisedAlarm = async () => {
  const shiftNurses = await getCurrentShiftNurses();
  if (!shiftNurses) throw new Error('No current shift nurses found');
  const nurseIds: string[] = shiftNurses.map((n: any) => n.nurseId);
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/alarmsummary/${hospitalCode}/raised/global`,
    {
      nurseIds,
      shiftCode: await AsyncStorage.getItem('shiftCode'),
      wardCode: await AsyncStorage.getItem('wardCode'),
    },
  );
  return response.data;
};

// GET /api/{orgName}/alarmsummary/{hospCode}/detail/{alarmId}/{bedCode}
export const getAlarmDetailByIdAPI = async (
  alarmId: string,
  bedCode: string,
): Promise<AlarmDetailDTO> => {
  const { orgName, hospitalCode } = await getCommonData();
  const response = await privateApi.get(
    `/${orgName}/alarmsummary/${hospitalCode}/detail/${alarmId}/${bedCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/alarms/{hospCode}/close-without-action
export const handleAlarmIgnore = async (alarmId: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/alarms/${hospitalCode}/close-without-action`,
    { alarmId },
  );
  return response.data;
};

// POST /api/{orgName}/alarms/{hospCode}/close-with-action
export const handleAlarmWithAction = async (data: { alarmId: string; note: string }) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/alarms/${hospitalCode}/close-with-action`,
    { alarmId: data.alarmId, note: data.note },
  );
  return response.data;
};
