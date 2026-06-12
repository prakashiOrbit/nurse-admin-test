import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { fontScale, scale, verticalScale } from '../../../utils/scaling';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useResponsive } from '../../../utils/responsive';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestForgotPasswordOTP,
  verifyForgotPasswordOTP,
} from '../../../services/authService';
import Loader from '../../../components/Loader';
import { RFValue } from 'react-native-responsive-fontsize';
import { getSharedStyles } from '../../../styles/sharedStyles';
import { useTranslation } from 'react-i18next';

const BackButtonImg = require('../../../../assets/icons/back-arrow2.png');

const ForgotPasswordAuthenticated: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [isOtpDisabled, setIsOtpDisabled] = useState(false);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();
  const { wp, hp, isTablet, width, height } = useResponsive();
  const [emailAddress, setEmailAddress] = useState<string | null>(null);

      const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  
  useEffect(() => {
    const getEmail = async () => {
      const email = await AsyncStorage.getItem('userName');
      setEmailAddress(email);
    };
    getEmail();
  }, []);

  const handleChange = (text: string, index: number) => {
    if (otpError) setOtpError(null);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const mm = mins < 10 ? `0${mins}` : mins;
    const ss = secs < 10 ? `0${secs}` : secs;

    return `${mm}:${ss}`;
  };

  const handleBackspace = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };
  const handleBack = () => {};

  const startOtpCooldown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsOtpDisabled(true);
    setTimer(59);

    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsOtpDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    startOtpCooldown();
  }, []);

  const otpInputStyle = useMemo(
    () => ({
      boxShadow: '0px 2px 2.1px rgba(0, 0, 0, 0.06)',
      width: isTablet ? 50 : 39,
      height: isTablet ? 49 : 40,
      borderRadius: isTablet ? scale(4) : 5,
      textAlign: 'center',
      fontSize: RFValue(14),
      backgroundColor: '#E2E2E2',
      color: '#705757',
    }),
    [isTablet],
  );

  const headerTitleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(22) : RFValue(16),
      fontWeight: '600' as const,
      color: '#000',
    }),
    [isTablet],
  );

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
  
const emailInstructionStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 18 : 14, 812),
      fontWeight: '500',
      marginBottom: isTablet ? verticalScale(24) : verticalScale(2),
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

  const resendTextStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 14 : 14, 812),
      color: '#000000',
      fontWeight: '500',
    }),
    [isTablet],
  );
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

  const verifyOTP = async (otp: string) => {
    try {
      const response = await verifyForgotPasswordOTP(emailAddress, otp);
      console.log('OTP verification response:', response);
      if (response?.code === '555') {
        Toast.show({
          type: 'success',
          text1: t('forgot_password.otp_verified'),
          text2: t('forgot_password.otp_verified_msg'),
          position: 'top',
        });
        navigation.navigate('SetNewPasswordAuthenticated', {
          email: emailAddress!,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      // console.log('OTP verification failed:', error.message);
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={styles.backButton}
          onTouchEnd={() => {
            navigation.goBack();
          }}
        >
          <Image source={BackButtonImg} style={styles.backButtonImage} />
        </View>

        <Text style={headerTitleStyle}>{t('change_password_auth.forgot_current_password')}</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.rightContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.rightPanel}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={false}
          >
            <View>
              <Text style={emailInstructionStyle}>
                {t('otp.prompt')}{' '}
                <Text style={emailBoldStyle}>
                  {encryptEmail(emailAddress?.toString() || '')}
                </Text>
                {/* <Text style={editTextStyle} onPress={onEditPress}>
                    {' '}
                    Edit
                  </Text> */}
              </Text>
            </View>
            <View>
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
              <View style={styles.otpErrorContainer}>
                <View>
                  {otpError && (
                    <Text style={shared.otpErrorText}>{otpError}</Text>
                  )}
                </View>
                {isOtpDisabled && timer > 0 && (
                  <View>
                    <Text style={shared.tpTimerText}>{formatTime(timer)}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.resendContainer}>
              <Text style={resendTextStyle}>
                {t('otp.didnt_receive')}
                <Text
                  style={[
                    resendTextStyle,
                    styles.resendLink,
                    isOtpDisabled && styles.resendDisabled,
                  ]}
                  onPress={async () => {
                    if (isOtpDisabled) return;
                    try {
                      setLoading(true);
                      setOtpError(null);
                      setOtp(Array(OTP_LENGTH).fill(''));

                      const response = await handleGetOtp(
                        emailAddress as string,
                      );
                      if (response) {
                        startOtpCooldown();
                      }
                    } catch (e) {
                      Toast.show({
                        type: 'error',
                        text1: t('otp.failed_resend'),
                        position: 'top',
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {t('otp.resend_otp')}
                </Text>
              </Text>
            </View>
            <View>
              <Pressable
                style={loginButtonStyle}
                onPress={async () => {
                  // if (!email) {
                  //   Toast.show({
                  //     type: 'error',
                  //     text1: 'Email is required',
                  //     position: 'top',
                  //   });
                  //   return;
                  // }

                  if (otp.some(digit => digit === '')) {
                    Toast.show({
                      type: 'error',
                      text1: t('otp.enter_complete_otp'),
                      position: 'top',
                    });
                    return;
                  }

                  try {
                    setLoading(true);
                    const success = await verifyOTP(otp.join(''));
                    // if (!success) {
                    //   setOtpError('*Incorrect OTP');
                    // }
                  } catch (error: any) {
                    console.error('OTP verification failed:', error.message);
                    const message = error?.response?.data?.message;

                    if (message?.toLowerCase().includes('invalid')) {
                      setOtpError(t('otp.incorrect_otp'));
                    } else if (message?.toLowerCase().includes('expired')) {
                      setOtpError(t('otp.otp_expired'));
                    } else {
                      setOtpError(t('otp.something_went_wrong'));
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={loginTextStyle}>{t('otp.verify_otp')}</Text>
              </Pressable>
            </View>
            {/* <View style={styles.cancelButton} onTouchEnd={onBackPress}>
                          <Text style={styles.cancelText}>Cancel</Text>
                        </View> */}
            {/* <View style={styles.backButton} onTouchEnd={onBackPress}>
                        <Image
                          source={backButton}
                          style={[styles.backButtonImage, { aspectRatio: 16 / 16 }]}
                        />
                        <Text style={styles.backToLoginText}>Back to login</Text>
                      </View> */}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <Loader visible={loading} />
    </View>
  );
};

export default ForgotPasswordAuthenticated;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  rightContainer: {
    width: '45%',
    flex: 1,
    alignSelf: 'center',
  },
  rightPanel: {
    flex: 1,
    paddingHorizontal: scale(35),
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    // paddingBottom: 20,
  },
  emailInstruction: {
    fontSize: fontScale(16),
    fontWeight: '500',
    marginBottom: verticalScale(35),
    textAlign: 'center',
    width: '100%',
  },
  emailBold: {
    fontWeight: '700', // or 'bold'
    color: '#000', // optional, but usually looks cleaner
  },
  editText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#4CAF50',
  },

  getOtpText: {
    color: '#000',
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  otpContainer: {
    marginTop: verticalScale(10),
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    // marginBottom: verticalScale(16),
  },
  otpInput: {
    boxShadow: '0px 2px 2.1px rgba(0, 0, 0, 0.06)',
    width: 39,
    height: 40,
    borderRadius: scale(5),
    textAlign: 'center',
    fontSize: 18,
    backgroundColor: '#E2E2E2',
    color: '#705757',
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
  tpTimerText: {
    color: '#181414', // proper error red
    fontSize: fontScale(12),
    fontWeight: '500',
  },
  resendContainer: {
    marginTop: verticalScale(8),
    alignItems: 'center',
  },

  resendText: {
    fontSize: fontScale(13),
    // color: '#666',
    marginBottom: verticalScale(4),
  },

  resendLink: {
    // marginTop: verticalScale(4),
    // fontSize: fontScale(13),
    color: '#000',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },
  loginButton: {
    backgroundColor: '#4CAE51',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'flex-end',
  },
  loginText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: fontScale(14),
  },
});
