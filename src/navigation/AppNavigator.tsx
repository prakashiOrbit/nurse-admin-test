import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/Auth/LoginScreen';
import Dashboard from '../screens/Dashboard/Dashboard';
import TwoFactorAuth from '../screens/Auth/TwoFactorAuth';
import BedPatientInfoCard from '../screens/BedPatientInfo/BedPatientInfoCard';
import NurseLogin from '../screens/Auth/NurseLogin';
import ForgotPassword from '../screens/Auth/ForgotPassword/ForgotPassword';
import CreateNewPassword from '../screens/Auth/ForgotPassword/CreateNewPassword';
import CreateNewPasswordAuthenticated from '../screens/Auth/ForgotPassword/CreateNewPasswordAuthenticated';
import ForgotPasswordOTPVerify from '../screens/Auth/ForgotPassword/ForgotPasswordOTPVerify';
import EmailLoginScreen from '../screens/Auth/EmailLoginScreen';
import ForgotPasswordAuthenticated from '../screens/Auth/ForgotPassword/ForgotPasswordAuthenticated';
import SetNewPasswordAuthenticated from '../screens/Auth/ForgotPassword/SetNewPasswordAuthenticated';
import ActivateMonitoringScreen from '../screens/AlarmConfig/ActivateMonitoringScreen';
import CalloutModal from '../components/CallOutModal/CalloutModal';
import UpdateAlarmConfig from '../screens/PatientsComponents/UpdateAlarmConfig';
import SplashScreen from '../screens/splash/SplashScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  TwoFactorAuth: {
    email: string;
    loginType: 'email' | 'mobile';
    phoneNumber?: string;
    countryCode?: string;
    verificationType: 'FIRST_FACTOR' | 'SECOND_FACTOR';
  };

  BedPatientInfo: undefined;

  NurseLogin: undefined;
  ForgotPassword: undefined;
  VerfyForgotOTP: {
    email: string;
  };
  CreateNewPassword: {
    email: string;
  };
  CreateNewPasswordAuthenticated: {
    email: string;
  };
  EmailLogin: undefined;
  ForgotPasswordAuthenticated: undefined;
  SetNewPasswordAuthenticated: {
    email: string;
  };
  ActivateMonitoring: {
    patientInfo: {
      firstName: string;
      lastName: string;
      mrNumber: string;
      age: string;
      patientCode: string;
      bedCode: string;
      gender: string;
      patientId?: string;
    };
    assignedDevices: Array<{
      deviceCode: string;
      deviceId: string;
      deviceName?: string;
      deviceType: string;
    }>;
    updatedAlarmConfig?: {
      deviceCode: string;
      updatedConfig: Record<string, string>;
    };
  };
  CalloutModal: {
    bedPatientInfo: {
      bedCode: string;
      patientCode: string;
      patientId: string;
      firstName?: string;
      lastName?: string;
      age?: number;
      gender?: string;
      admissionDate?: string;
      mrNumber?: string;
      auditMe?: { createdtime?: string };
    };
    assignedDevices: any[];
    updatedAlarmConfig?: {
      deviceCode: string;
      updatedConfig: Record<string, string>;
    };
  };
  UpdateAlarmConfig: {
    deviceCode: string;
    deviceType: string;
    paramName: string;
    patientConfig: Record<string, string>;
    patientId: string;
    // callerScreen is used so UpdateAlarmConfig knows where to navigate back
    callerScreen: 'BedPatientInfo' | 'ActivateMonitoring' | 'CalloutModal';
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="TwoFactorAuth" component={TwoFactorAuth} />
      <Stack.Screen name="BedPatientInfo" component={BedPatientInfoCard} />

      <Stack.Screen name="NurseLogin" component={NurseLogin} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="VerfyForgotOTP" component={ForgotPasswordOTPVerify} />
      <Stack.Screen name="CreateNewPassword" component={CreateNewPassword} />
      <Stack.Screen
        name="CreateNewPasswordAuthenticated"
        component={CreateNewPasswordAuthenticated}
      />
      <Stack.Screen
        name="EmailLogin"
        component={EmailLoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPasswordAuthenticated"
        component={ForgotPasswordAuthenticated}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SetNewPasswordAuthenticated"
        component={SetNewPasswordAuthenticated}
      />
      <Stack.Screen
        name="ActivateMonitoring"
        component={ActivateMonitoringScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="CalloutModal"
        component={CalloutModal}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="UpdateAlarmConfig"
        component={UpdateAlarmConfig}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
