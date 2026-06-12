import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// GET /api/{orgName}/svg/{careSiteCode}/{wardCode}
export const getWardSVG = async () => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/svg/${careSiteCode}/${wardCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{careSiteCode}/bedpatientinfo/{wardCode}/{bedCode}
export const getBedPatientInfo = async (bedCode: string) => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${careSiteCode}/bedpatientinfo/${wardCode}/${bedCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{careSiteCode}/getnursecurrentshift/{nurseCode}
export const getCurrentShift = async () => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const nurseCode = await AsyncStorage.getItem('nurseCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${careSiteCode}/getnursecurrentshift/${nurseCode}`,
  );
  if (response.data?.shiftCode) {
    await AsyncStorage.setItem('shiftCode', response.data.shiftCode);
  }
  if (response.data?.wardCode) {
    await AsyncStorage.setItem('wardCode', response.data.wardCode);
  }
  return response.data;
};

// GET /api/{orgName}/nurse/{careSiteCode}/getcurrentshift/{wardCode}
export const getCurrentShiftForNurse = async () => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${careSiteCode}/getcurrentshift/${wardCode}`,
  );
  if (response.data?.shiftCode) {
    await AsyncStorage.setItem('shiftCode', response.data.shiftCode);
  }
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/assignedbedpatients
export const getAssignedBeds = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${careSiteCode}/assignedbedpatients`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{careSiteCode}/getcurrentshiftnurses/{shiftCode}/{wardCode}
export const getCurrentShiftNurses = async () => {
  const { orgName, wardCode, shiftCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${careSiteCode}/getcurrentshiftnurses/${shiftCode}/${wardCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/delegatePatient
export const delegatePatient = async (data: {
  shiftCode: string;
  wardCode: string;
  patientCode: string;
  currentNurseCode: string;
  newNurseCode: string;
}) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${careSiteCode}/delegatePatient`,
    {
      shiftCode: data.shiftCode,
      wardCode: data.wardCode,
      patientCode: data.patientCode,
      currentNurseCode: data.currentNurseCode,
      newNurseCode: data.newNurseCode,
    },
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{careSiteCode}/getemptybeds/{wardCode}
export const getEmptyBeds = async () => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${careSiteCode}/getemptybeds/${wardCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/getAssignedNursesAndDoctors
export const getAssignedNursesAndDoctors = async (bedCode: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${careSiteCode}/getAssignedNursesAndDoctors`,
    {
      bedCode,
      wardCode: await AsyncStorage.getItem('wardCode'),
      shiftCode: await AsyncStorage.getItem('shiftCode'),
    },
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{careSiteCode}/allWards
export const getAllWards = async () => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${careSiteCode}/allWards`,
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/assignedBedForAdmit  (backend gap)
export const admitPatientForBed = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${careSiteCode}/assignedBedForAdmit`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/admit
export const admitPatient = async (data: { patientCode: string; bedCode: string }) => {
  const { orgName, nurseCode, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(`/${orgName}/nurse/${careSiteCode}/admit`, {
    patientCode: data.patientCode,
    nurseCode,
    wardCode,
    bedCode: data.bedCode,
  });
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/assignedBedForWardTransfer  (backend gap)
export const getWardTransferBeds = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${careSiteCode}/assignedBedForWardTransfer`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{careSiteCode}/assignedBedForDischarge  (backend gap)
export const getDischargeBeds = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${careSiteCode}/assignedBedForDischarge`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// POST /api/{orgName}/device/{careSiteCode}/patient/{patientId}/assign-default-alarm/{deviceCode}
export const assignDefaultAlarm = async (data: { deviceCode: string; patientId: string }) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/device/${careSiteCode}/patient/${data.patientId}/assign-default-alarm/${data.deviceCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/ward-dashboard/{careSiteCode}/{wardCode}
export const getDashboardData = async () => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/ward-dashboard/${careSiteCode}/${wardCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/notifications/{careSiteCode}/acknowledge
export const acknowledgeNotification = async (notificationId: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/notifications/${careSiteCode}/acknowledge`,
    { notificationId },
  );
  return response.data;
};
