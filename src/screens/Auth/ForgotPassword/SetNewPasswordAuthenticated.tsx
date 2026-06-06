import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { fontScale, scale, verticalScale } from '../../../utils/scaling';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useResponsive } from '../../../utils/responsive';
import { clearAuthSession } from '../../../services/sessionService';
import { resetPasswordAPI } from '../../../services/authService';
import { RFValue } from 'react-native-responsive-fontsize';

const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');
const eyeImage = require('../../../../assets/icons/eye-line.png');
const eyeOffImage = require('../../../../assets/icons/eye-off-line.png');

type SetNewPasswordAuthenticatedProps = RouteProp<
  RootStackParamList,
  'SetNewPasswordAuthenticated'
>;

const SetNewPasswordAuthenticated: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const route = useRoute<SetNewPasswordAuthenticatedProps>();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] =
    useState(true);
  const [rightIconColor] = useState('#000000');
  const { wp, hp, isTablet, width, height } = useResponsive();
  
  // const isFormValid = password.length > 0 && confirmPassword.length > 0;

  const handlePasswordVisibility = () => {
    setPasswordVisibility(prev => !prev);
  };

  const handleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisibility(prev => !prev);
  };

  const rightpanelStyle = useMemo(
    () => ({
      flex: 1,
      flexDirection: 'column',
      paddingHorizontal: scale(35),
      paddingVertical: isTablet ? verticalScale(20) : verticalScale(10),
      backgroundColor: '#fff',
    }),
    [isTablet],
  );

  const forgotpasswordtextStyle = useMemo(
    () => ({
      fontSize: fontScale(20),
      fontWeight: '600',
      marginBottom: isTablet ? verticalScale(18) : verticalScale(6),
      textAlign: 'center',
    }),
    [isTablet],
  );

  const forgotpasswordsubtextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16) : RFValue(14),
      fontWeight: '500',
      marginBottom: isTablet ? scale(16) : verticalScale(12),
      textAlign: 'center',
    }),
    [isTablet],
  );

  const scrollContentStyle = useMemo(() => ({
  flexGrow: 1,
  justifyContent: 'space-evenly',
  // paddingHorizontal: scale(35),
  // paddingVertical: isTablet ? verticalScale(20) : verticalScale(10),
}), [isTablet]);

const placeholderStyle = useMemo(() => ({
  color: '#000000',
  fontSize: isTablet ? RFValue(14) : RFValue(12),
}), [isTablet]);

const loginButtonStyle = useMemo(() => ({
  backgroundColor: '#4CAE51',
  paddingVertical: isTablet ? verticalScale(12) : verticalScale(10),
  borderRadius: 10,
  marginTop: isTablet ? verticalScale(16) : verticalScale(12),
  paddingHorizontal: scale(12),
  alignItems: 'center' as const,
}), [isTablet]);

const loginTextStyle = useMemo(() => ({
  textAlign: 'center' as const,
  color: 'white',
  fontWeight: 'bold' as const,
  fontSize: isTablet ? RFValue(16) : RFValue(14),
}), [isTablet]);

const headerTitleStyle = useMemo(() => ({
  fontSize: isTablet ? RFValue(22) : RFValue(16),
  fontWeight: '600' as const,
  color: '#000',
}), [isTablet]);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={styles.backButton}
          onTouchEnd={() => {
            navigation.pop(2);
          }}
        >
          <Image source={BackButtonImg} style={styles.backButtonImage} />
        </View>

        <Text style={headerTitleStyle}>Set New Password</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.rightContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={rightpanelStyle}>
          <ScrollView
            contentContainerStyle={scrollContentStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={false}
          >
            <View>
              <Text style={forgotpasswordsubtextStyle}>
                Enter a New Password to secure your Account
              </Text>
            </View>
            <View style={styles.formSection}>
              <View style={styles.passwordContainer}>
                <TextInput
                    style={[styles.passwordInput, { fontSize: placeholderStyle.fontSize }]}
                  placeholder="Enter New Password"
                  placeholderTextColor={'#000000'}
                  value={password}
                  disableFullscreenUI={true}
                  onChangeText={setPassword}
                  secureTextEntry={passwordVisibility}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={handlePasswordVisibility}
                >
                  <Image
                    source={passwordVisibility ? eyeOffImage : eyeImage}
                    style={[styles.eyeImage, { tintColor: rightIconColor }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { fontSize: placeholderStyle.fontSize }]}
                  placeholder="Confirm New Password"
                  placeholderTextColor={'#000000'}
                  value={confirmPassword}
                  disableFullscreenUI={true}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={confirmPasswordVisibility}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={handleConfirmPasswordVisibility}
                >
                  <Image
                    source={confirmPasswordVisibility ? eyeOffImage : eyeImage}
                    style={[styles.eyeImage, { tintColor: rightIconColor }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View>
              <View>
                <Pressable
                  style={loginButtonStyle}
                  onPress={async () => {
                    if (!password) {
                      Toast.show({
                        type: 'error',
                        text1: 'Password is required',
                        position: 'top',
                      });
                      return;
                    }
                    if (!confirmPassword) {
                      Toast.show({
                        type: 'error',
                        text1: 'Confirm Password is required',
                        position: 'top',
                      });
                      return;
                    }

                    if (password.length < 9) {
                      Toast.show({
                        type: 'error',
                        text1: 'Password must be at least 9 characters',
                        position: 'top',
                      });
                      return;
                    }

                    if (password !== confirmPassword) {
                      Toast.show({
                        type: 'error',
                        text1: 'Passwords do not match',
                        text2: 'Both passwords must be the same',
                        position: 'top',
                      });
                      return;
                    }
                    // Handle password reset logic here
                    await handleResetPassword(password, confirmPassword);
                  }}
                >
                  <Text style={loginTextStyle}>Save Password</Text>
                </Pressable>
              </View>
              {/* <View style={styles.cancelButton} onTouchEnd={onBackPress}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </View> */}
              {/* <View style={styles.backButton} onTouchEnd={onBackPress}>
                      <Image source={backButton} style={styles.backButtonImage} />
                      <Text style={styles.backToLoginText}>Back to login</Text>
                    </View> */}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SetNewPasswordAuthenticated;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  rightContainer: {
    flex: 1,
    width: '45%',
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(32),
    paddingHorizontal: scale(28),
  },

  backButton: {
    marginRight: scale(12),
    padding: scale(6),
  },

  backButtonImage: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },

  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    // paddingBottom: 20,
  },
  formSection: {
    gap: verticalScale(12), //
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    height: verticalScale(40),
    paddingRight: scale(6), // space from right edge
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    color: '#000',
  },

  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  eyeImage: {
    width: scale(22),
    height: verticalScale(22),
  },

  loginButton: {
    backgroundColor: '#4CAE51',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: verticalScale(12),
    paddingHorizontal: scale(12),
    alignItems: 'center',
  },
  loginText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: fontScale(14),
  },
});
