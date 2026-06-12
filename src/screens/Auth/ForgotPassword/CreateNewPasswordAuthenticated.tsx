import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import SharedChangePasswordAuthenticated from '../../../components/shared/ui/SharedChangePassword/SharedChangePasswordAuthenticated';
import Toast from 'react-native-toast-message';
import {
  requestForgotPasswordOTP,
  resetPasswordAPI,
} from '../../../services/authService';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { clearAuthSession } from '../../../services/sessionService';
import { navigate } from '../../../navigation/navigationService';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../../../components/Loader';
import { set } from 'lodash';

const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');
const eyeIcon = require('../../../../assets/icons/eye-line.png');
const eyeOffIcon = require('../../../../assets/icons/eye-off-line.png');

type CreateNewPasswordRouteProp = RouteProp<
  RootStackParamList,
  'CreateNewPasswordAuthenticated'
>;

const CreateNewPasswordAuthenticated: React.FC = () => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CreateNewPasswordRouteProp>();
  const { email } = route.params;
  const [emailAddress, setEmailAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const getEmail = async () => {
      const email = await AsyncStorage.getItem('userName');
      setEmailAddress(email);
    };
    getEmail();
  }, []);

  const handleResetPassword = async (
    currentPassword: string,
    password: string,
    confirmPassword: string,
  ) => {
    try {
      setLoading(true);
      console.log('Resetting password for email:', email);
      await resetPasswordAPI({
        userName: email,
        currentPassword: currentPassword,
        newPassword: password,
        confirmPassword: confirmPassword,
      });
      Toast.show({
        type: 'success',
        text1: t('forgot_password.reset_successful'),
        text2: t('forgot_password.reset_successful_msg'),
        position: 'top',
      });

      await clearAuthSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'NurseLogin' }],
      });
    } catch (error: any) {
      if (
        error.response.data ===
        'New password must be different from current password.'
      ) {
        Toast.show({
          type: 'error',
          text1: t('forgot_password.password_reused_msg'),
          position: 'top',
        });
        return;
      } else if (error.response.data === 'Current password is incorrect.') {
        Toast.show({
          type: 'error',
          text1: t('change_password_auth.current_password_incorrect'),
          position: 'top',
        });
        return;
      }
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('change_password.error_msg'),
      });
    }finally {
    setLoading(false);
  }
  };

  const handleGetOtp = async (email: string) => {
    try {
      setLoading(true);
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
        navigation.navigate('ForgotPasswordAuthenticated');
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
    }finally {
      setLoading(false);
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <SharedChangePasswordAuthenticated
        BackButton={BackButtonImg}
        eyeImage={eyeIcon}
        eyeOffImage={eyeOffIcon}
        onBackPress={async () => {
          navigation.replace('Dashboard');
        }}
        onSavePassword={handleResetPassword}
        onForgotPasswordPress={async () => {
          const emailToUse = emailAddress || email;
          console.log('Email to use for OTP:', emailToUse);

          await handleGetOtp(emailToUse);
        }}
      />
      <Loader visible={loading} />
    </View>
  );
};

export default CreateNewPasswordAuthenticated;
