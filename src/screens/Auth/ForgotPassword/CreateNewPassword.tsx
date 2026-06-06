import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resetPasswordAPI } from '../../../services/authService';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import SharedChangePassword from '../../../components/shared/ui/SharedChangePassword/SharedChangePassword';
import type { RouteProp } from '@react-navigation/native';
import { navigate } from '../../../navigation/navigationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthSession } from '../../../services/sessionService';

const ChangePasswordIMG = require('../../../../assets/images/resetPassword.png');
const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');
const eyeIcon = require('../../../../assets/icons/eye-line.png');
const eyeOffIcon = require('../../../../assets/icons/eye-off-line.png');

type CreateNewPasswordRouteProp = RouteProp<
  RootStackParamList,
  'CreateNewPassword'
>;

const CreateNewPassword: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CreateNewPasswordRouteProp>();
  const { email } = route.params;

  const handleResetPassword = async (
    password: string,
    confirmPassword: string,
  ) => {
    try {
      console.log('Resetting password for email:', email);
      await resetPasswordAPI({
        userName: email,
        newPassword: password,
        confirmPassword: confirmPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Password reset successful.',
        text2: 'Please login again.',
        position: 'top',
      });
      
      // clear session and navigate to login
      await clearAuthSession();
      navigation.pop(2);
    } catch (error: any) {
      // console.log("CreateNewPassword handleResetPassword error:", error.response);
      if (
        error.response.data ===
        'New password must be different from current password.'
      ) {
        Toast.show({
          type: 'error',
          text1: 'Password Reused',
          text2: 'New password must be different from current password',
          position: 'top',
        });
        return;
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred while resetting password',
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SharedChangePassword
        title="iTouch Nurse"
        description="This app is built to streamline ICU tasks for nurses. View real time patient vitals, receive instructions from doctors and manage shift handovers smoothly. Easily access patient details, get critical alerts and stay connected for faster, safer care delivery."
        imageSource={ChangePasswordIMG}
        eyeImage={eyeIcon}
        eyeOffImage={eyeOffIcon}
        backButton={BackButtonImg}
        onBackPress={async () => {
          await clearAuthSession();
          navigation.pop(2);
        }}
        onSavePassword={handleResetPassword}
      />
    </View>
  );
};

export default CreateNewPassword;
