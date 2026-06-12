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
import { useTranslation } from 'react-i18next';

const ForgotPasswordImg = require('../../../../assets/images/verifyOTP.png');
// const BackButtonImg = require('../../../../assets/icons/black_back-arrow.png');
const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');

type VerfyForgotOTPRouteProp = RouteProp<RootStackParamList, 'VerfyForgotOTP'>;
const ForgotPasswordOTPVerify: React.FC = () => {
  const { t } = useTranslation();
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
          text1: t('forgot_password.otp_verified'),
          text2: t('forgot_password.otp_verified_msg'),
          position: 'top',
        });
        navigation.replace('CreateNewPassword', { email });
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (message?.toLowerCase().includes('invalid')) {
        Toast.show({
          type: 'error',
          text1: t('forgot_password.invalid_otp'),
          text2: t('forgot_password.invalid_otp_msg'),
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
          text1: t('forgot_password.otp_sent'),
          position: 'top',
        });
      }

      return true;
    } catch (err: any) {
      console.error('Failed to send OTP');
      if (err.response?.data?.message?.includes('User not found')) {
        Toast.show({
          type: 'error',
          text1: t('forgot_password.user_not_found'),
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
  return (
    <View style={{ flex: 1 }}>
      <SharedForgotPasswordOTP
        title={t('auth.app_title')}
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
