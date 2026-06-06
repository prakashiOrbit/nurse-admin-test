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
        text1: 'Password reset successful',
        text2: 'Please login again',
        position: 'top',
      });

      // clear session and navigate to login
      await clearAuthSession();
      navigation.reset({
        index: 0,
        routes: [{ name: 'NurseLogin' }],
      });
    } catch (error: any) {
      // console.log("CreateNewPassword handleResetPassword error:", error.response);
      if (
        error.response.data ===
        'New password must be different from current password.'
      ) {
        Toast.show({
          type: 'error',
          text1: 'New password must be different from current password',
          position: 'top',
        });
        return;
      } else if (error.response.data === 'Current password is incorrect.') {
        Toast.show({
          type: 'error',
          text1: 'Current password is incorrect',
          position: 'top',
        });
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while resetting password',
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
          text1: 'OTP sent successfully',
          position: 'top',
        });
        navigation.navigate('ForgotPasswordAuthenticated');
      }

      return true;
      // optionally show toast / start timer / enable OTP inputs
    } catch (err: any) {
      console.error('Failed to send OTP');
      if (err.response?.data?.message.contains('User not found')) {
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
