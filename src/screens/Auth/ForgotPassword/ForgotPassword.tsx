import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  requestForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from '../../../services/authService';
import SharedForgotPassword from '../../../components/shared/ui/SharedForgotPassword/SharedForgotPassword';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { clearAuthSession } from '../../../services/sessionService';

const ForgotPasswordImg = require('../../../../assets/images/forgotpassword.png');
// const BackButtonImg = require('../../../../assets/icons/black_back-arrow.png');
const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');

const ForgotPassword: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
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
        navigation.navigate('VerfyForgotOTP', { email });
      }

      return true;
      // optionally show toast / start timer / enable OTP inputs
    } catch (err: any) {
      console.error('OTP verification failed:', err?.response?.data?.message);
      if(err?.response?.data?.message === 'User not found') {
        Toast.show({
          type: 'error',
          text1: 'User not found',
          text2: 'Please check your email and try again',
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

  const verifyOTP = async (email: string, otp: string) => {
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
      console.error('OTP verification failed:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Invalid OTP',
        text2: 'Please try again',
        position: 'top',
      });
      return false;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SharedForgotPassword
        title="iTouch Nurse"
        // description="This app is built to streamline ICU tasks for nurses. View real time patient vitals, receive instructions from doctors and manage shift handovers smoothly. Easily access patient details, get critical alerts and stay connected for faster, safer care delivery."
        imageSource={ForgotPasswordImg}
        backButton={BackButtonImg}
        onBackPress={async () => {
          await clearAuthSession();
          navigation.goBack();
        }}
        onGetOtp={handleGetOtp}
        onVerifyOtp={verifyOTP}
      />
    </View>
  );
};

export default ForgotPassword;
