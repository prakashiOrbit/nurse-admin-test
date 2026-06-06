import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  requestForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from '../../../services/authService';
import SharedForgotPassword from '../../../components/shared/ui/SharedForgotPassword/SharedForgotPassword';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { clearAuthSession } from '../../../services/sessionService';
import SharedForgotPasswordOTP from '../../../components/shared/ui/SharedForgotPassword/SharedForgotPasswordOTP';

const ForgotPasswordImg = require('../../../../assets/images/verifyOTP.png');
// const BackButtonImg = require('../../../../assets/icons/black_back-arrow.png');
const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');

type VerfyForgotOTPRouteProp = RouteProp<RootStackParamList, 'VerfyForgotOTP'>;
const ForgotPasswordOTPVerify: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<VerfyForgotOTPRouteProp>();
  const { email } = route.params;

  const verifyOTP = async (otp: string) => {
    try {
      const response = await verifyForgotPasswordOTP(email, otp);
      console.log('OTP verification response:', response);
      if (response?.code === '555') {
        Toast.show({
          type: 'success',
          text1: 'OTP verified successfully',
          text2: 'You can now reset your password',
          position: 'top',
        });
        navigation.replace('CreateNewPassword', { email });
        return true;
      }
      return false;
    } catch (error: any) {
      // console.log('OTP verification failed:', error.message);
      const message = error.response?.data?.message;
      if (message?.toLowerCase().includes('invalid')) {
        Toast.show({
          type: 'error',
          text1: 'Invalid OTP',
          text2: 'Please try again',
          position: 'top',
        });
      }

      throw error;
    }
  };

  const handleGetOtp = async (email: string) => {
    try {
      console.log('Requesting OTP for email:', email);
      const response = await requestForgotPasswordOTP(email);
      console.log('OTP sent successfully');
      if (
        response === 'OTP has been sent to your email, please validate your PIN'
      ) {
        Toast.show({
          type: 'success',
          text1: 'OTP sent successfully',
          position: 'top',
        });
        // navigation.replace('VerfyForgotOTP', { email });
      }

      return true;
      // optionally show toast / start timer / enable OTP inputs
    } catch (err: any) {
      console.error('Failed to send OTP');
      if (err.response?.data?.message?.includes('User not found')) {
        Toast.show({
          type: 'error',
          text1: 'User not found.',
          position: 'top',
        });
        return false;
      }
      Toast.show({
        type: 'error',
        text1: 'Failed to send OTP. Please try again.',
        position: 'top',
      });
      return false;
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <SharedForgotPasswordOTP
        title="iTouch Nurse"
        imageSource={ForgotPasswordImg}
        backButton={BackButtonImg}
        onBackPress={async () => {
          await clearAuthSession();
          navigation.goBack();
        }}
        onEditPress={async () => {
          await clearAuthSession();
          navigation.goBack();
        }}
        onVerifyOtp={verifyOTP}
        onResendOtp={handleGetOtp}
        emailAddress={email}
      />
    </View>
  );
};

export default ForgotPasswordOTPVerify;
