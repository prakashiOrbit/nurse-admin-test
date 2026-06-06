import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// GET /api/{orgName}/svg/{hospCode}/{wardCode}
export const getWardSVG = async () => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/svg/${hospitalCode}/${wardCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{hospCode}/bedpatientinfo/{wardCode}/{bedCode}
export const getBedPatientInfo = async (bedCode: string) => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${hospitalCode}/bedpatientinfo/${wardCode}/${bedCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{hospCode}/getnursecurrentshift/{nurseCode}
export const getCurrentShift = async () => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const nurseCode = await AsyncStorage.getItem('nurseCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${hospitalCode}/getnursecurrentshift/${nurseCode}`,
  );
  if (response.data?.shiftCode) {
    await AsyncStorage.setItem('shiftCode', response.data.shiftCode);
  }
  if (response.data?.wardCode) {
    await AsyncStorage.setItem('wardCode', response.data.wardCode);
  }
  return response.data;
};

// GET /api/{orgName}/nurse/{hospCode}/getcurrentshift/{wardCode}
export const getCurrentShiftForNurse = async () => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${hospitalCode}/getcurrentshift/${wardCode}`,
  );
  if (response.data?.shiftCode) {
    await AsyncStorage.setItem('shiftCode', response.data.shiftCode);
  }
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/assignedbedpatients
export const getAssignedBeds = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${hospitalCode}/assignedbedpatients`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{hospCode}/getcurrentshiftnurses/{shiftCode}/{wardCode}
export const getCurrentShiftNurses = async () => {
  const { orgName, wardCode, shiftCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${hospitalCode}/getcurrentshiftnurses/${shiftCode}/${wardCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/delegatePatient
export const delegatePatient = async (data: {
  shiftCode: string;
  wardCode: string;
  patientCode: string;
  currentNurseCode: string;
  newNurseCode: string;
}) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${hospitalCode}/delegatePatient`,
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

// GET /api/{orgName}/nurse/{hospCode}/getemptybeds/{wardCode}
export const getEmptyBeds = async () => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${hospitalCode}/getemptybeds/${wardCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/getAssignedNursesAndDoctors
export const getAssignedNursesAndDoctors = async (bedCode: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${hospitalCode}/getAssignedNursesAndDoctors`,
    {
      bedCode,
      wardCode: await AsyncStorage.getItem('wardCode'),
      shiftCode: await AsyncStorage.getItem('shiftCode'),
    },
  );
  return response.data;
};

// GET /api/{orgName}/nurse/{hospCode}/allWards
export const getAllWards = async () => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/nurse/${hospitalCode}/allWards`,
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/assignedBedForAdmit  (backend gap)
export const admitPatientForBed = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${hospitalCode}/assignedBedForAdmit`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/admit
export const admitPatient = async (data: { patientCode: string; bedCode: string }) => {
  const { orgName, nurseCode, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(`/${orgName}/nurse/${hospitalCode}/admit`, {
    patientCode: data.patientCode,
    nurseCode,
    wardCode,
    bedCode: data.bedCode,
  });
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/assignedBedForWardTransfer  (backend gap)
export const getWardTransferBeds = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${hospitalCode}/assignedBedForWardTransfer`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// POST /api/{orgName}/nurse/{hospCode}/assignedBedForDischarge  (backend gap)
export const getDischargeBeds = async () => {
  const { orgName, nurseCode, wardCode, shiftCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/nurse/${hospitalCode}/assignedBedForDischarge`,
    { nurseCode, wardCode, shiftCode },
  );
  return response.data;
};

// POST /api/{orgName}/device/{hospCode}/patient/{patientId}/assign-default-alarm/{deviceCode}
export const assignDefaultAlarm = async (data: { deviceCode: string; patientId: string }) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/device/${hospitalCode}/patient/${data.patientId}/assign-default-alarm/${data.deviceCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/ward-dashboard/{hospCode}/{wardCode}
export const getDashboardData = async () => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/ward-dashboard/${hospitalCode}/${wardCode}`,
  );
  return response.data;
};

// POST /api/{orgName}/notifications/{hospCode}/acknowledge
export const acknowledgeNotification = async (notificationId: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/notifications/${hospitalCode}/acknowledge`,
    { notificationId },
  );
  return response.data;
};
