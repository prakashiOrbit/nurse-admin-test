import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// GET /api/{orgName}/bed/{hospCode}/{bedCode}/devicesassignedForNurse
export const assignedDevices = async (bedCode: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/bed/${hospitalCode}/${bedCode}/devicesassignedForNurse`,
  );
  return response.data;
};

// GET /api/{orgName}/bed/{hospCode}/medical-history/{patientCode}
export const getMedicalHistory = async (patientCode: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/bed/${hospitalCode}/medical-history/${patientCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/bed/{hospCode}/getAllBeds/{wardCode}
export const getAllEmptyBeds = async (wardCode: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/bed/${hospitalCode}/getAllBeds/${wardCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/instruction/{hospCode}/patient/{patientCode}/instructions
export const getPatientInstructions = async (patientCode: string) => {
  const { orgName } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.get(
    `/${orgName}/instruction/${hospitalCode}/patient/${patientCode}/instructions`,
  );
  return response.data;
};

// POST /api/{orgName}/bed/{hospCode}/patient/discharge
export const dischargePatient = async (data: { patientCode: string; bedCode: string }) => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/bed/${hospitalCode}/patient/discharge`,
    { patientCode: data.patientCode, bedCode: data.bedCode, wardCode },
  );
  return response.data;
};

// POST /api/{orgName}/bed/{hospCode}/patient/wardTransfer
export const wardTransferPatient = async (data: { patientCode: string; bedCode: string }) => {
  const { orgName, wardCode } = await getCommonData();
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const response = await privateApi.post(
    `/${orgName}/bed/${hospitalCode}/patient/wardTransfer`,
    { patientCode: data.patientCode, bedCode: data.bedCode, wardCode },
  );
  return response.data;
};

// Legacy two-step wrapper → single wardTransferPatient call
export const wardtransfer = async (data: {
  patientCode: string;
  bedCode: string;
  currentBedCode?: string;
}) => wardTransferPatient({ patientCode: data.patientCode, bedCode: data.bedCode });
