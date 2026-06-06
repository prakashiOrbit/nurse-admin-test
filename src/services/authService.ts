import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicApi } from './publicApi';
import { privateApi } from './privateApi';

export const itouchServer = privateApi;

let commonDataCache: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 30000;

export const getCommonData = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && commonDataCache && now - lastCacheTime < CACHE_TTL) {
    return commonDataCache;
  }

  const orgName = await AsyncStorage.getItem('orgName');
  const userName = await AsyncStorage.getItem('userName');
  const hospitalCode = await AsyncStorage.getItem('hospitalCode');
  const nurseCode = await AsyncStorage.getItem('nurseCode');
  const wardCode = await AsyncStorage.getItem('wardCode');
  const shiftCode = await AsyncStorage.getItem('shiftCode');

  commonDataCache = { orgName, userName, hospitalCode, nurseCode, wardCode, shiftCode };
  lastCacheTime = now;
  return commonDataCache;
};

export const clearCommonDataCache = () => {
  commonDataCache = null;
  lastCacheTime = 0;
};

// POST /api/login  (username + password)
export const loginNurse = async (data: { userName: string; password: string }) => {
  try {
    const response = await publicApi.post('/login', data, {
      validateStatus: status => status < 500,
    });
    if (response.status === 401 || response.status === 400) {
      throw Object.assign(new Error(response.data?.message || 'Login failed'), { response });
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/login/phone
export const mobileNumberLoginAPI = async (data: { phone: string }) => {
  try {
    const response = await publicApi.post('/login/phone', data, {
      validateStatus: status => status < 500,
    });
    if (response.status === 401 || response.status === 400) {
      throw Object.assign(new Error(response.data?.message || 'Login failed'), { response });
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/login/google
export const loginNurseWithGoogle = async (idToken: string) => {
  try {
    const response = await publicApi.post('/login/google', { idToken });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/{orgName}/{hospitalCode}/user/{userName}/verify2fa  (issues JWT)
export const verify2faAPI = async (otp: string) => {
  try {
    const { orgName, userName, hospitalCode } = await getCommonData();
    const url = hospitalCode
      ? `/${orgName}/${hospitalCode}/user/${userName}/verify2fa`
      : `/${orgName}/user/${userName}/verify2fa`;
    const response = await publicApi.post(url, { otpCode: otp });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/{orgName}/user/{userName}/verification  (1FA email OTP)
export const verifyFirstFactorAPI = async (otp: string) => {
  try {
    const { orgName, userName, hospitalCode } = await getCommonData();
    const url = hospitalCode
      ? `/${orgName}/${hospitalCode}/user/${userName}/verification`
      : `/${orgName}/user/${userName}/verification`;
    const response = await publicApi.post(url, { otpCode: otp });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/{orgName}/user/{userName}/resend2fa
export const resend2faAPI = async () => {
  const { orgName, userName } = await getCommonData();
  if (!orgName || !userName) throw new Error('Missing orgName or userName');
  const response = await publicApi.post(`/${orgName}/user/${userName}/resend2fa`);
  return response.data;
};

// POST /api/logout
export const logoutAPI = async () => {
  try {
    const response = await privateApi.post('/logout');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/user/forgot-password/request-pin
export const requestForgotPasswordOTP = async (userName: string) => {
  try {
    const response = await publicApi.post('/user/forgot-password/request-pin', { userName });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/user/forgot-password/validate-pin
export const verifyForgotPasswordOTP = async (userName: string, pin: string) => {
  try {
    const response = await publicApi.post('/user/forgot-password/validate-pin', { userName, pin });
    const orgNameFromBackend = response.data?.orgName;
    if (!orgNameFromBackend) {
      throw new Error('Organization not found for this user');
    }
    await AsyncStorage.setItem('userName', userName);
    await AsyncStorage.setItem('orgName', orgNameFromBackend);
    if (response.data?.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/{orgName}/change-password
export const resetPasswordAPI = async (payload: {
  userName: string;
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  try {
    const { orgName } = await getCommonData();
    const response = await privateApi.post(`/${orgName}/change-password`, payload);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// GET /api/{orgName}/nurse/{hospitalCode}/nursedetail/{userName}
export const getNurseDetails = async () => {
  try {
    const { orgName, userName } = await getCommonData();
    const hospitalCode = await AsyncStorage.getItem('hospitalCode');
    const response = await privateApi.get(
      `/${orgName}/nurse/${hospitalCode}/nursedetail/${userName}`,
    );
    if (response.data?.nurseCode) {
      await AsyncStorage.setItem('nurseCode', response.data.nurseCode);
    }
    if (response.data?.nurseId) {
      await AsyncStorage.setItem('nurseId', response.data.nurseId);
    }
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/{orgName}/nurse/{hospitalCode}/{userName}/createfcmtoken
export const getAndCreateFcmTokenAPI = async (data: any) => {
  try {
    const { orgName, userName } = await getCommonData();
    const hospitalCode = await AsyncStorage.getItem('hospitalCode');
    const response = await privateApi.post(
      `/${orgName}/nurse/${hospitalCode}/${userName}/createfcmtoken`,
      data,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// POST /api/{orgName}/nurse/{hospitalCode}/{userName}/createnote
export const createNurseNoteAPI = async (noteText: {
  objectId: string;
  objectType: string;
  noteType: string;
  note: string;
}) => {
  try {
    const { orgName, userName } = await getCommonData();
    const hospitalCode = await AsyncStorage.getItem('hospitalCode');
    const response = await privateApi.post(
      `/${orgName}/nurse/${hospitalCode}/${userName}/createnote`,
      {
        objectId: noteText.objectId,
        objectType: noteText.objectType,
        noteType: noteText.noteType,
        note: noteText.note,
      },
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
