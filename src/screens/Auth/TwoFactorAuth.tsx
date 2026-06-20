import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale, verticalScale, fontScale } from '../../utils/scaling';
import {
  getAndCreateFcmTokenAPI,
  verify2faAPI,
  getNurseDetails,
  resend2faAPI,
  verifyFirstFactorAPI,
} from '../../services/authService';
import { getMessaging } from '@react-native-firebase/messaging';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Icon, Images } from '../../../assets';
import { useResponsive } from '../../utils/responsive';
import Toast from 'react-native-toast-message';
import {
  enrollBiometric,
  getBiometricCapability,
  isBiometricEnrolled,
} from '../../services/biometricService';

type TwoFactorRouteProp = RouteProp<RootStackParamList, 'TwoFactorAuth'>;

// Update to match AppNavigator
// type RootStackParamList = {
//   nurseLogin: undefined;
//   OTP: undefined;
//   Dashboard: undefined;
// };

// Define style types
type Styles = {
  safeContainer: object;
  container: object;
  leftPanel: object;
  rightPanel: object;
  appTitle: object;
  image: object;
  logo: object;
  welcomeText: object;
  input: object;
  loginButton: object;
  loginText: object;
  errorText: object;
  description: object;
};

const TwoFactorAuth: React.FC = () => {
  const { t } = useTranslation();
  const backButton = require('../../../assets/icons/back-arrow2.png');
  const appLogo = require('../../../assets/images/nurse_img.png');

  const { wp, hp, isTablet } = useResponsive();

  const leftpanelStyle = useMemo(
    () => ({
      padding: isTablet ? scale(28) : scale(18),
      maxWidth: isTablet ? wp(50) : '100%',
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

  const rightHeader = useMemo(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: scale(16),
      paddingBottom: isTablet ? scale(22) : verticalScale(14),
      marginBottom: isTablet ? scale(10) : verticalScale(2),
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

  const descriptionStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 12 : 10, 812),
      textAlign: 'center',
      paddingHorizontal: isTablet ? scale(6) : scale(10),
      color: '#000000',
      fontWeight: '400',
      letterSpacing: 0.03,
      lineHeight: isTablet ? 24 : 16,
      marginBottom: isTablet ? scale(4) : verticalScale(6),
    }),
    [isTablet],
  );

  const emailInstructionStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 18 : 14, 812),
      fontWeight: '500',
      // marginBottom: verticalScale(8),
      textAlign: 'center' as const,
    }),
    [isTablet],
  );

  const emailBoldStyle = useMemo(
    () => ({
      fontWeight: '700', // or 'bold'
      color: '#000', // optional, but usually looks cleaner
      fontSize: RFValue(isTablet ? 14 : 14, 812),
    }),
    [isTablet],
  );

  const editTextStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 14 : 14, 812),
      fontWeight: '500',
      color: '#4CAF50',
    }),
    [isTablet],
  );
  const otpInputStyle = useMemo(
    () => ({
      boxShadow: '0px 2px 2.1px rgba(0, 0, 0, 0.06)',
      width: isTablet ? 48 : 38,
      height: isTablet ? 49 : 40,
      borderRadius: isTablet ? scale(4) : 5,
      textAlign: 'center',
      fontSize: RFValue(14),
      backgroundColor: '#E2E2E2',
      color: '#705757',
    }),
    [isTablet],
  );

  const resendTextStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 14 : 14, 812),
      color: '#000000',
      fontWeight: '500',
    }),
    [isTablet],
  );
  const leftBottomText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 15 : 13, 812),
      fontWeight: '500',
    }),
    [isTablet],
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

  const googleButtonStyle = useMemo(
    () => ({
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: isTablet ? 14 : scale(10),
      paddingVertical: 10,
      paddingHorizontal: isTablet ? scale(12) : scale(6),
      marginTop: verticalScale(10),
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

  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const route = useRoute<TwoFactorRouteProp>();

  const { email } = route.params;
  const { phoneNumber, countryCode, loginType, verificationType } =
    route.params;
  const isFirstFactor = verificationType === 'FIRST_FACTOR';

  const RESEND_TIME = 59;

  const [timer, setTimer] = useState(RESEND_TIME);
  const [isResending, setIsResending] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('userName').then(setUserName);
  }, []);

  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleResendOtp = async () => {
    if (isFirstFactor) {
      return;
    }
    if (timer > 0 || isResending) return;

    try {
      setIsResending(true);
      await resend2faAPI();
      setError('');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
      setTimer(RESEND_TIME);

      Toast.show({
        type: 'success',
        text1: t('otp.otp_sent'),
        text2: t('otp.otp_sent_msg'),
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: t('otp.resend_failed'),
        text2: t('otp.resend_failed_msg'),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    if (error) setError('');
    // Case 1: user pastes full OTP into first box
    if (text.length > 1 && index === 0) {
      const chars = text.split('').slice(0, OTP_LENGTH); // only take 6
      setOtp(chars.concat(Array(OTP_LENGTH - chars.length).fill('')));

      // Blur the last field
      inputsRef.current[Math.min(chars.length - 1, OTP_LENGTH - 1)]?.blur();
      return;
    }

    // Case 2: normal typing 1 digit
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (index < OTP_LENGTH - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    }

    if (text === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleBackspace = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [error, setError] = useState<string>('');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const handleVerifyOtp = async () => {
    try {
      const otpValue = otp.join('');
      if (!otpValue.length) {
        setError(t('otp.error_enter_otp'));
        return;
      } else if (otpValue.length < OTP_LENGTH) {
        setError(t('otp.error_complete_otp'));
        return;
      }
      if (isFirstFactor) {
        await verifyFirstFactorAPI(otpValue);

        Toast.show({
          type: 'success',
          text1: t('otp.verification_successful'),
          text2: t('otp.verification_successful_msg'),
        });

        await AsyncStorage.multiRemove(['authFlow']);
        if (loginType === 'mobile') {
          navigation.replace('NurseLogin');
        } else {
          navigation.replace('EmailLogin');
        }

        return;
      }

      const response = await verify2faAPI(otpValue);
      console.log('OTP Verification Response:', response);

      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
      }
      await AsyncStorage.setItem('careSiteCode', response.careSiteCode ?? '');
      await AsyncStorage.setItem('userId', response.userData?.userId ?? response.userId ?? '');
      await AsyncStorage.setItem('careSiteId', response.userData?.careSiteId ?? response.careSiteId ?? '');
      await AsyncStorage.setItem('orgId', response.userData?.orgId ?? response.orgId ?? '');
      await AsyncStorage.setItem('firstName', response.userData?.firstName ?? response.firstName ?? '');
      await AsyncStorage.setItem('lastName', response.userData?.lastName ?? response.lastName ?? '');
      await AsyncStorage.setItem('isAuthenticated', 'true');

      try {
        const nurseDetail = await getNurseDetails();
        await AsyncStorage.setItem('nurseDetails', JSON.stringify(nurseDetail));
      } catch (err) {
        console.error('Failed to fetch nurse detail after login:', err);
      }

      try {
        const fcmToken = await getMessaging().getToken();
        const deviceOsInfo = Platform.OS;
        const userName = await AsyncStorage.getItem('userName');

        const fcmPayload = {
          username: userName,
          fcmToken,
          deviceOsInfo,
        };
        console.log('The fcm payload: ' + fcmPayload);
        await getAndCreateFcmTokenAPI(fcmPayload);
        console.log('FCM Token saved to backend ');
      } catch (tokenErr) {
        console.error('Failed to save FCM token:', tokenErr);
      }

      setError('');

      const navigateToDashboard = () =>
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });

      const capability = await getBiometricCapability();
      const alreadyEnrolled = await isBiometricEnrolled();

      if (capability !== 'none' && !alreadyEnrolled && response.token) {
        const label = capability === 'face' ? 'Face ID' : 'Fingerprint';
        const storedUsername =
          (await AsyncStorage.getItem('userName')) ?? '';
        Alert.alert(
          `Enable ${label} Login`,
          `Log in faster next time using ${label}. You can disable this by logging out.`,
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: navigateToDashboard,
            },
            {
              text: 'Enable',
              onPress: async () => {
                await enrollBiometric(storedUsername, response.token);
                navigateToDashboard();
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        navigateToDashboard();
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data || '';

      if (message?.toLowerCase().includes('invalid')) {
        setError(t('otp.incorrect_otp'));
      } else if (message?.toLowerCase().includes('new otp has been sent')) {
        setOtp(Array(OTP_LENGTH).fill(''));

        inputsRef.current[0]?.focus();
        setError(t('otp.otp_expired_new'));
      } else if (message?.toLowerCase().includes('expired')) {
        setError(t('otp.otp_expired'));
      } else {
        setError(t('otp.something_went_wrong'));
      }
    }
  };

  const encryptEmail = (email: string) => {
    if (!email.includes('@')) return email;

    const [localPart, domain] = email.split('@');

    if (localPart.length >= 3) {
      const visible = localPart.slice(0, 3);
      const masked = '*'.repeat(localPart.length - 3);
      return `${visible}${masked}@${domain}`;
    } else {
      const visible = localPart[0];
      const masked = '*'.repeat(localPart.length - 1);
      return `${visible}${masked}@${domain}`;
    }
  };

  const encryptPhone = (phone: string) => {
    if (phone.length >= 4) {
      const visible = phone.slice(-4);
      const masked = '*'.repeat(phone.length - 4);
      return `${masked}${visible}`;
    } else {
      return '*'.repeat(phone.length);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { flexDirection: isLandscape ? 'row' : 'column' },
      ]}
    >
      <View style={styles.backButton} onTouchEnd={() => navigation.goBack()}>
        <Image
          source={backButton}
          style={[styles.backButtonImage, { aspectRatio: 16 / 16 }]}
        />
      </View>
      <View style={[styles.leftPanel, leftpanelStyle]}>
        <Image source={appLogo} style={imageStyles} resizeMode="contain" />
        <Text style={descriptionStyle}>
          {t('auth.app_description')}
        </Text>
        <View style={styles.leftBottom}>
          <Text style={leftBottomText}>{t('common.powered_by')}</Text>
          <Image
            source={Images.iorbitLogo}
            style={orgLogoStyle}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.rightPanel}>
        <View style={rightHeader}>
          <Image
            style={loginLogo}
            source={Icon.loginLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={headerWelcome}>{t('auth.welcome_to')}</Text>
            <Text style={headerAppName}>{t('auth.app_title')} !</Text>
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={emailInstructionStyle}>
            {isFirstFactor
              ? t('otp.prompt_verification')
              : t('otp.prompt')}
          </Text>

          <View style={styles.editMessageTextCentered}>
            <Text style={emailBoldStyle}>
              {loginType === 'email'
                ? encryptEmail(email)
                : `${countryCode}${encryptPhone(phoneNumber || '')}`}
            </Text>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={editTextStyle}> {t('otp.edit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputsRef.current[index] = ref)}
              style={otpInputStyle}
              keyboardType="number-pad"
              // maxLength={1}
              value={digit}
              disableFullscreenUI={true}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={e => handleBackspace(e, index)}
            />
          ))}
        </View>
        <View style={styles.errorTimerRow}>
          {error ? <Text style={styles.errorText}>{error}</Text> : <View />}
          {!isFirstFactor && timer > 0 ? (
            <Text style={styles.timerText}>
              00:{timer.toString().padStart(2, '0')}
            </Text>
          ) : null}
        </View>
        {!isFirstFactor && (
          <View style={styles.resendRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={resendTextStyle}>{t('otp.didnt_receive')}</Text>

              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={timer > 0 || isResending}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    resendTextStyle,
                    styles.resend,
                    {
                      opacity: timer > 0 ? 0.4 : 1,
                    },
                  ]}
                >
                  {t('otp.resend_otp')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* {error ? <Text style={styles.errorText}>{error}</Text> : null} */}

        <TouchableOpacity style={styles.loginButton} onPress={handleVerifyOtp}>
          <Text style={styles.loginText}>{t('otp.verify_otp')}</Text>
        </TouchableOpacity>
        {/* <Pressable
          style={googleButtonStyle}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Text style={buttonText}>Cancel</Text>
        </Pressable> */}
      </View>
      {/* </KeyboardAvoidingView> */}
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFF',
    paddingHorizontal: scale(10),
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFF',
    paddingHorizontal: scale(40),
  },
  leftPanel: {
    marginTop: verticalScale(14),
    flex: 1,
    paddingHorizontal: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  leftBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPanel: {
    flex: 1,
    paddingHorizontal: scale(25),
    justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: '#ffffffff',
  },
  appTitle: {
    fontFamily: 'Mont',
    fontStyle: 'normal',
    fontSize: RFValue(20, 812),
    fontWeight: '700',
    marginBottom: verticalScale(8),
    color: '#000000',
    textAlign: 'center',
    // lineHeight: verticalScale(26),
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
  emailInstruction: {
    fontSize: fontScale(14),
    fontWeight: '500',
    marginBottom: verticalScale(8),
    textAlign: 'center',
    width: 'auto',
  },
  editText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#4CAF50',
  },
  emailBold: {
    fontWeight: '700', // or 'bold'
    color: '#000', // optional, but usually looks cleaner
    fontSize: fontScale(14),
  },

  editMessageText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  otpContainer: {
    alignSelf: 'center',
    marginTop: verticalScale(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    // marginBottom: verticalScale(16),
  },
  otpInput: {
    boxShadow: '0px 2px 2.1px rgba(0, 0, 0, 0.06)',
    width: 39,
    height: verticalScale(50),
    borderRadius: scale(5),
    textAlign: 'center',
    fontSize: RFValue(18, 812),
    backgroundColor: '#E2E2E2',
    color: '#705757',
  },

  description: {
    fontSize: RFValue(10, 812),
    textAlign: 'center',
    paddingHorizontal: scale(10),
    color: '#000000',
    fontWeight: '400',
    letterSpacing: 0.03,
    lineHeight: 18,
    marginBottom: verticalScale(6),
  },
  image: {
    width: scale(220),
    height: undefined,
    alignSelf: 'center',
  },
  logo: {
    width: scale(200),
    height: verticalScale(85),
    alignSelf: 'center',
    marginBottom: verticalScale(20),
  },
  welcomeText: {
    fontFamily: 'Inter',
    width: 'auto',
    height: verticalScale(29),
    fontSize: RFValue(20, 812),
    textAlign: 'center',
    marginBottom: verticalScale(16),
    fontWeight: '700',
    lineHeight: verticalScale(30),
  },
  otpErrorContainer: {
    width: '100%',
    // marginTop: verticalScale(6),
    // paddingLeft: scale(14), // aligns with OTP boxes
    marginBottom: verticalScale(16),
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: scale(8),
  },

  otpErrorText: {
    color: '#D32F2F', // proper error red
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  loginButton: {
    filter: 'drop-shadow(0px 2px 4.5px rgba(0, 0, 0, 0.25))',
    boxShadow: '0px 0px 50px 20px rgba(0, 0, 0, 0.05)',
    width: '100%',
    height: verticalScale(40),
    backgroundColor: '#4CAF50',
    // padding: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: scale(8),
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  loginText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    color: '#FFFFFF',
    fontSize: RFValue(16, 812),
    fontWeight: '600',
    lineHeight: verticalScale(16),
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    fontSize: RFValue(12, 812),
  },
  rrorText: {
    color: '#FF0000',
    textAlign: 'center',
    fontSize: RFValue(12, 812),
  },
  errorTimerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(6),
    marginBottom: verticalScale(8),
  },
  resendRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: verticalScale(2),
  },

  timerText: {
    fontSize: RFValue(12, 812),
    color: '#000',
  },

  resendText: {
    fontSize: RFValue(14, 812),
    color: '#000000',
    fontWeight: '500',
  },
  resend: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  editMessageTextCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
});

export default TwoFactorAuth;
