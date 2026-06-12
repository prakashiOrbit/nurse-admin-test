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
import { useTranslation } from 'react-i18next';

const ForgotPasswordImg = require('../../../../assets/images/forgotpassword.png');
// const BackButtonImg = require('../../../../assets/icons/black_back-arrow.png');
const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
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
          text1: t('forgot_password.otp_sent'),
          position: 'top',
        });
        navigation.navigate('VerfyForgotOTP', { email });
      }

      return true;
    } catch (err: any) {
      console.error('OTP verification failed:', err?.response?.data?.message);
      if(err?.response?.data?.message === 'User not found') {
        Toast.show({
          type: 'error',
          text1: t('forgot_password.user_not_found'),
          text2: t('forgot_password.user_not_found_msg'),
          position: 'top',
        });
        return false;
      }
      Toast.show({
        type: 'error',
        text1: t('forgot_password.otp_send_failed'),
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
          text1: t('forgot_password.otp_verified'),
          text2: t('forgot_password.otp_verified_msg'),
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
        text1: t('forgot_password.invalid_otp'),
        text2: t('forgot_password.invalid_otp_msg'),
        position: 'top',
      });
      return false;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SharedForgotPassword
        title={t('auth.app_title')}
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
