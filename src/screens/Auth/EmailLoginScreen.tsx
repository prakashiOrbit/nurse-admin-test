import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  // ScrollView removed
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale, verticalScale } from '../../utils/scaling';
import { loginNurse } from '../../services/authService';
import { useResponsive } from '../../utils/responsive';
import { Icon, Images } from '../../../assets';
import { RootStackParamList } from '../../navigation/AppNavigator';

const eyeIcon = require('../../../assets/icons/eye-line.png');
const eyeOffIcon = require('../../../assets/icons/eye-off-line.png');

// type RootStackParamList = {
//   nurseLogin: undefined;
//   EmailLogin: undefined;
//   TwoFactorAuth: undefined;
//   Dashboard: undefined;
//   ForgotPassword: undefined;
// };

const EmailLoginScreen = () => {
  const { wp, hp, isTablet, width, height } = useResponsive();
  const isLandscape = width > height;

  const leftpanelStyle = useMemo(
    () => ({
      paddingLeft: isTablet ? scale(28) : scale(65),
      paddingRight: isTablet ? scale(18) : scale(35),
      maxWidth: isTablet ? wp(50) : '100%',
      paddingTop: isTablet ? 30 : verticalScale(20),
    }),
    [isTablet, wp],
  );
 
  const rightPanelStyle = useMemo(
    () => ({
     paddingRight: isTablet ? scale(28) : scale(65),
     paddingLeft: isTablet ? scale(18) : scale(35),
      maxWidth: isTablet ? wp(45) : '100%',
      paddingTop: isTablet ? 30 : verticalScale(20),
    }),
    [isTablet, wp],
  );

  const imageStyles = useMemo(
    () => ({
      width: isTablet ? wp(35) : scale(200),
      maxWidth: 380,
      height: undefined,
      aspectRatio: 1536 / 1024,
      marginBottom: isTablet ? verticalScale(12) : verticalScale(16),
      objectFit: 'cover',
      marginTop: isTablet ? undefined : verticalScale(18),
    }),
    [isTablet, wp],
  );

  const orgLogoStyle = useMemo(
    () => ({
      width: isTablet ? wp(20) : scale(130),
      maxWidth: 300,
      height: undefined,
      aspectRatio: 216 / 94,
      objectFit: 'cover',
    }),
    [isTablet, wp],
  );

  const leftBottomText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 15 : 13, 812),
      fontWeight: '500',
    }),
    [isTablet],
  );

  const descriptionStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 12 : 10, 812),
      textAlign: 'center',
      paddingHorizontal: isTablet ? scale(6) : scale(10),
      color: '#000000',
      fontWeight: '400',
      letterSpacing: 0.03,
      lineHeight: isTablet ? 26 : 18,
      marginBottom: isTablet ? scale(4) : verticalScale(6),
    }),
    [isTablet],
  );

  const inputStyle = useMemo(
    () => ({
      height: isTablet ? 58 : verticalScale(40),
      borderColor: '#000000',
      borderWidth: isTablet ? 1.5 : 1,
      borderRadius: isTablet ? 14 : scale(12),
      paddingHorizontal: scale(20),
      marginBottom: isTablet ? scale(22) : verticalScale(16),
      fontSize: RFValue(isTablet ? 13 : 12, 812),
      overflow: 'hidden',
    }),
    [isTablet],
  );

  const passwordInputStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 13 : 12, 812),
      paddingHorizontal: scale(20),
    }),
    [isTablet],
  );

  const passwordContainerStyle = useMemo(
    () => ({
      borderRadius: isTablet ? 14 : scale(12),
      marginBottom: isTablet ? scale(8) : verticalScale(8),
      height: isTablet ? 58 : verticalScale(40),
      borderWidth: isTablet ? 1.5 : 1,
    }),
    [isTablet],
  );

  const forgotView = useMemo(
    () => ({
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginRight: 4,
      marginBottom: isTablet ? 8 : verticalScale(20),
    }),
    [],
  );

  const forgotText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 14 : 12, 812),
    }),
    [isTablet],
  );

  const eyeImage = useMemo(
    () => ({
      width: scale(18),
      height: scale(18),
    }),
    [],
  );

  const loginButtonStyle = useMemo(
    () => ({
      paddingVertical: isTablet ? scale(10) : verticalScale(10),
      borderRadius: isTablet ? 14 : scale(10),
      marginBottom: isTablet ? scale(22) : verticalScale(14),
      shadowColor: '#000',
      shadowOffset: { width: isTablet ? 2 : 1, height: isTablet ? 9 : 5 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    }),
    [isTablet],
  );

  const loginTextStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 15 : 13, 812),
    }),
    [isTablet],
  );

  const loginLogo = useMemo(
    () => ({
      width: isTablet ? wp(8) : scale(50),
      maxWidth: 200,
      height: undefined,
      aspectRatio: 1,
    }),
    [isTablet, wp],
  );

  const rightHeader = useMemo(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: scale(16),
      paddingBottom: isTablet ? scale(22) : verticalScale(14),
      marginBottom: isTablet ? scale(10) : verticalScale(6),
      marginTop: isTablet ? undefined : verticalScale(12),
    }),
    [isTablet],
  );

  const headerWelcome = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 16 : 14, 812),
      fontWeight: '600',
    }),
    [],
  );

  const headerAppName = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 24 : 20, 812),
      fontWeight: '800',
    }),
    [isTablet],
  );

  const googleButtonStyle = useMemo(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: isTablet ? 1.5 : 1,
      borderColor: '#000',
      borderRadius: isTablet ? 14 : scale(10),
      paddingVertical: 10,
      paddingHorizontal: isTablet ? scale(12) : scale(6),
    }),
    [isTablet],
  );

  const buttonText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 15 : 13, 812),
      fontWeight: 'bold',
    }),
    [isTablet],
  );

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState<boolean>(true);
  const passwordInputRef = useRef<TextInput>(null);

  const appLogo = require('../../../assets/images/nurse_img.png');
  const backButton = require('../../../assets/icons/back-arrow2.png');
  // Stable style to prevent re-renders/shaking
  const contentStyle = useMemo(() => {
    return {
      flex: 1,
      justifyContent: 'center' as const,
      flexDirection: isLandscape || isTablet ? 'row' : 'column',
    };
  }, [isLandscape, isTablet]);

  const handlePasswordVisibility = () => setPasswordVisibility(prev => !prev);
  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // useFocusEffect(
  //   useCallback(() => {
  //     AsyncStorage.getItem('tempUsername').then(savedUser => {
  //       if (savedUser) setUsername(savedUser);
  //     });
  //     AsyncStorage.getItem('tempPassword').then(savedPass => {
  //       if (savedPass) setPassword(savedPass);
  //     });
  //   }, []),
  // );

  const handleLogin = async () => {
    Keyboard.dismiss();

    // 1. Validation Toast
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields',
        text2: 'Please enter your email and password to continue.',
      });
      return;
    }

    const trimmedUsername = username.trim();

    if (!validateEmail(trimmedUsername)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Format',
        text2: 'Please enter a valid email address.',
      });
      return;
    }

    try {
      setLoading(true);

      const response = await loginNurse({
        userName: trimmedUsername,
        password: password,
      });

      console.log('Login Response:', response);
      // Storage logic...
      await AsyncStorage.setItem(
        'userName',
        response.userName || trimmedUsername,
      );
      await AsyncStorage.setItem('orgName', response.orgName || '');
      await AsyncStorage.setItem('tempUsername', trimmedUsername);

      // 3. Navigate based on backend response
      if (response.code === '111') {
        Toast.show({
         type: 'success',
          text1: 'Security Verification',
          text2: 'A 1FA code has been sent to your registered device.',
          visibilityTime: 6000, // Give them time to read instructions
        });
        navigation.navigate('TwoFactorAuth', {
          email: trimmedUsername,
          loginType: 'email',
          verificationType: 'FIRST_FACTOR',
        });
        return;
      }

      if (response.code === '222') {
        Toast.show({
          type: 'success',
          text1: 'Security Verification',
          text2: 'A 2FA code has been sent to your registered device.',
        });
        navigation.navigate('TwoFactorAuth', {
          email: trimmedUsername,
          loginType: 'email',
          verificationType: 'SECOND_FACTOR',
        });
        return;
      }

      // Success Toast for direct login
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
      });

      // navigation.replace('Dashboard');
    } catch (loginError: any) {
      console.log('Login Error message:', loginError);
      const status = loginError?.data?.status;

      console.log('Login Error status:', status);
      // Custom messages based on HTTP Status
      let errorTitle = 'Authentication Failed';
      let errorMessage = 'Please check your credentials and try again.';

      if (status === 'UNAUTHORIZED') {
        errorTitle = 'Invalid Credentials';
        errorMessage = 'The email or password you entered is incorrect.';
      } else if (!status) {
        errorTitle = 'Connection Error';
        errorMessage =
          'Unable to reach the server. Please check your internet.';
      } else if (loginError?.response?.data?.message) {
        errorMessage = loginError.response.data.message;
      }

      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
    // navigation.navigate('CreateNewPassword');
  };

  return (
    <View style={[styles.safeContainer]}>
      <View style={styles.backButton} onTouchEnd={() => navigation.goBack()}>
        <Image
          source={backButton}
          style={[styles.backButtonImage, { aspectRatio: 16 / 16 }]}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* WRAPPER: Detects taps to dismiss keyboard */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* MAIN CONTAINER: Replaces ScrollView */}
          <View style={contentStyle}>
            <View style={[styles.leftPanel, leftpanelStyle]}>
              <Image
                source={appLogo}
                style={imageStyles}
                resizeMode="contain"
              />
              <Text style={descriptionStyle}>
                An ICU app for nurses to monitor real-time vitals, receive
                doctor instructions, manage shift handovers and respond quickly
                to critical alerts for safer patient care.
              </Text>
              <View style={styles.leftBottom}>
                <Text style={leftBottomText}>Powered by</Text>
                <Image
                  source={Images.iorbitLogo}
                  style={orgLogoStyle}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={[styles.rightPanel, rightPanelStyle]}>
              <View style={rightHeader}>
                <Image
                  style={loginLogo}
                  source={Icon.loginLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={headerWelcome}>Welcome to</Text>
                  <Text style={headerAppName}>iTouch Nurse !</Text>
                </View>
              </View>
              <TextInput
                style={inputStyle}
                placeholder="Email Address"
                placeholderTextColor={'#000000'}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                disableFullscreenUI={true}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />

              <View style={[styles.passwordContainer, passwordContainerStyle]}>
                <TextInput
                  ref={passwordInputRef}
                  style={[styles.passwordInput, passwordInputStyle]}
                  placeholder="Password"
                  placeholderTextColor={'#000000'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={passwordVisibility}
                  autoCapitalize="none"
                  disableFullscreenUI={true}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={handlePasswordVisibility}
                >
                  <Image
                    source={passwordVisibility ? eyeOffIcon : eyeIcon}
                    style={[eyeImage, { tintColor: '#000000' }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              <View style={forgotView}>
                <TouchableOpacity>
                  <Text
                    style={styles.forgotText}
                    onPress={handleForgotPassword}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loginButtonStyle]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={[styles.loginText, loginTextStyle]}>
                  {loading ? 'Please wait...' : 'Get OTP'}
                </Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
                style={googleButtonStyle}
                onPress={() => {
                  navigation.goBack();
                }}
                disabled={loading}
              >
                <Text style={buttonText}>Cancel</Text>
              </TouchableOpacity> */}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

// ... Styles remain the same ...
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  leftPanel: {
    // width: '50%',   // ← add this
    // flex: 0,   
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  leftBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPanel: {
    // width: '50%',   // ← add this
    // flex: 0,  
    flex: 1, 
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: verticalScale(30),
    left: scale(30),
    zIndex: 10,
    padding: scale(8),
  },
  backButtonImage: {
    width: scale(20),
    height: undefined,
    resizeMode: 'contain',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000000',
    overflow: 'hidden',
    marginTop: verticalScale(4),
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: scale(20),
    color: '#000000',
    fontSize: RFValue(12, 812),
  },
  eyeIcon: {
    position: 'absolute',
    right: scale(6),
    padding: scale(4),
  },
  eyeImage: {},
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  forgotText: {
    color: '#292929',
    fontSize: RFValue(12, 812),
  },
  forgotPassword: {
    color: '#4CAE51',
    fontWeight: '400',
    fontSize: RFValue(12, 812),
  },
  errorText: {
    color: 'red',
    marginBottom: verticalScale(8),
    fontSize: RFValue(12, 812),
  },
  mobileInputContainer: {
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  flag: { marginRight: 8, borderRadius: 2 },
  countryText: {
    fontSize: RFValue(14, 812),
    fontWeight: '400',
    marginRight: 4,
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#000',
    marginRight: 10,
  },
  flexInput: { flex: 1, fontSize: RFValue(14, 812), color: '#000' },
  loginButton: {
    backgroundColor: '#4CAE51',
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  googleIconStyle: { width: 20, height: 20, marginRight: 10 },
  modalContent: {
    width: '80%',
    height: '50%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  itemText: { fontSize: RFValue(14, 812) },
  dropdownIcon: {
    width: scale(25),
    height: 40,
    marginRight: scale(2),
    tintColor: '#000',
    resizeMode: 'contain',
  },
  dropdownCard: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    zIndex: 9999,
    elevation: 10, // For Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)', // Keeps the UI underneath visible
  },
  searchBar: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#000',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
  },
  searchView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
});

export default EmailLoginScreen;
