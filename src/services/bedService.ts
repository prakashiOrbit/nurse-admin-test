import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCommonData } from './authService';
import { privateApi } from './privateApi';

// GET /api/{orgName}/bed/{careSiteCode}/{bedCode}/devicesassignedForNurse
export const assignedDevices = async (bedCode: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/bed/${careSiteCode}/${bedCode}/devicesassignedForNurse`,
  );
  return response.data;
};

// GET /api/{orgName}/bed/{careSiteCode}/medical-history/{patientCode}
export const getMedicalHistory = async (patientCode: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/bed/${careSiteCode}/medical-history/${patientCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/bed/{careSiteCode}/getAllBeds/{wardCode}
export const getAllEmptyBeds = async (wardCode: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/bed/${careSiteCode}/getAllBeds/${wardCode}`,
  );
  return response.data;
};

// GET /api/{orgName}/instruction/{careSiteCode}/patient/{patientCode}/instructions
export const getPatientInstructions = async (patientCode: string) => {
  const { orgName } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.get(
    `/${orgName}/instruction/${careSiteCode}/patient/${patientCode}/instructions`,
  );
  return response.data;
};

// POST /api/{orgName}/bed/{careSiteCode}/patient/discharge
export const dischargePatient = async (data: { patientCode: string; bedCode: string }) => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/bed/${careSiteCode}/patient/discharge`,
    { patientCode: data.patientCode, bedCode: data.bedCode, wardCode },
  );
  return response.data;
};

// POST /api/{orgName}/bed/{careSiteCode}/patient/wardTransfer
export const wardTransferPatient = async (data: { patientCode: string; bedCode: string }) => {
  const { orgName, wardCode } = await getCommonData();
  const careSiteCode = await AsyncStorage.getItem('careSiteCode');
  const response = await privateApi.post(
    `/${orgName}/bed/${careSiteCode}/patient/wardTransfer`,
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
