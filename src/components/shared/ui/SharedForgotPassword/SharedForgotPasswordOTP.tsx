import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Image,
  Platform,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Loader from '../../../Loader';
import { fontScale, scale, verticalScale } from '../../../../utils/scaling';
import { useResponsive } from '../../../../utils/responsive';
import { getSharedStyles } from '../../../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';
type SharedForgotPasswordOTPProps = {
  title: string;
  // description: string;
  imageSource: any;
  backButton: any;
  onBackPress: () => void;
  onEditPress: () => void;
  onVerifyOtp: (otp: string) => Promise<boolean>;
  onResendOtp: (email: string) => Promise<boolean>;
  emailAddress: string;
};

const SharedForgotPasswordOTP: React.FC<SharedForgotPasswordOTPProps> = ({
  title,
  imageSource,
  backButton,
  onBackPress,
  onEditPress,
  onVerifyOtp,
  onResendOtp,
  emailAddress,
}) => {
  const [email, setEmail] = useState<string>('');
  const [isOtpDisabled, setIsOtpDisabled] = useState(false);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { wp, hp, isTablet, width, height } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

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

  const emailInstructionStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 18 : 14, 812),
      fontWeight: '500',
      marginBottom: verticalScale(24),
      textAlign: 'center' as const,
    }),
    [isTablet],
  );

  const emailBoldStyle = useMemo(
    () => ({
      fontWeight: '700', // or 'bold'
      color: '#000', // optional, but usually looks cleaner
      fontSize: RFValue(14, 812),
    }),
    [isTablet],
  );

  const editTextStyle = useMemo(
    () => ({
      fontSize: RFValue(14, 812),
      fontWeight: '500',
      color: '#4CAF50',
    }),
    [isTablet],
  );

  const resendTextStyle = useMemo(
    () => ({
      fontSize: RFValue(14, 812),
      color: '#000000',
      fontWeight: '500',
    }),
    [isTablet],
  );
  return (
    <View style={styles.safeContainer}>
      <View style={styles.backButton} onTouchEnd={onBackPress}>
        <Image
          source={backButton}
          style={[styles.backButtonImage, { aspectRatio: 16 / 16 }]}
        />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.leftPanel}>
          <Text style={shared.appTitle}>{title}</Text>
          <Image
            source={imageSource}
            style={[styles.image, { aspectRatio: 664 / 664 }]}
            resizeMode="contain"
          />
        </View>

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
                Please enter 6 digit OTP sent to:{' '}
                <Text style={emailBoldStyle}>
                  {encryptEmail(emailAddress?.toString() || '')}
                </Text>
                <Text style={editTextStyle} onPress={onEditPress}>
                  {' '}
                  Edit
                </Text>
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
                Didn’t receive any OTP?{' '}
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

                      const response = await onResendOtp(
                        emailAddress as string,
                      );
                      if (response) {
                        startOtpCooldown();
                      }
                    } catch (e) {
                      Toast.show({
                        type: 'error',
                        text1: 'Failed to resend OTP',
                        position: 'top',
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Resend OTP
                </Text>
              </Text>
            </View>
            <View>
              <Pressable
                style={shared.loginButton}
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
                      text1: 'Please enter complete OTP',
                      position: 'top',
                    });
                    return;
                  }

                  try {
                    setLoading(true);
                    const success = await onVerifyOtp(otp.join(''));
                    // if (!success) {
                    //   setOtpError('*Incorrect OTP');
                    // }
                  } catch (error: any) {
                    console.error('OTP verification failed:', error.message);
                    const message = error?.response?.data?.message;

                    if (message?.toLowerCase().includes('invalid')) {
                      setOtpError('*Incorrect OTP');
                    } else if (message?.toLowerCase().includes('expired')) {
                      setOtpError('*OTP expired. Please request a new one.');
                    } else {
                      setOtpError('*Something went wrong. Please try again.');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={shared.loginText}>Verify OTP</Text>
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
      {/* {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#4CAE51" />
          <Text style={styles.loaderText}>Please wait…</Text>
        </View>
      )} */}
      <Loader visible={loading} />
    </View>
  );
};

export default SharedForgotPasswordOTP;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: scale(40),
    alignItems: 'center',
  },
  leftPanel: {
    flex: 1,
    paddingHorizontal: scale(25),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffff',
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
  appTitle: {
    fontSize: fontScale(19),
    fontWeight: 'bold',
    marginBottom: verticalScale(12),
  },
  image: {
    width: scale(220),
    height: undefined,
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
  cancelButton: {
    marginTop: verticalScale(10),
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    fontSize: fontScale(14),
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  description: {
    fontSize: fontScale(10),
    textAlign: 'center',
    paddingHorizontal: 8,
    color: '#555',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    height: verticalScale(40),
    paddingRight: scale(6), // space from right edge
    marginBottom: verticalScale(35),
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    color: '#000',
  },

  getOtpButton: {
    backgroundColor: '#c9e7cb',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(8),
  },

  getOtpText: {
    color: '#000',
    fontSize: fontScale(12),
    fontWeight: '600',
  },
  otpContainer: {
    marginTop: verticalScale(18),
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
    fontSize: RFValue(18),
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

  forgotPasswordText: {
    fontSize: fontScale(20),
    fontWeight: '600',
    marginBottom: verticalScale(12),
    textAlign: 'center',
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
  // backButton: {
  //   marginTop: verticalScale(10),
  //   justifyContent: 'flex-start',
  //   gap: scale(8),
  //   alignContent: 'center',
  //   padding: scale(10),
  //   // backgroundColor:'#787990'
  // },
  backButton: {
    position: 'absolute',
    top: verticalScale(30),
    left: scale(30),
    zIndex: 10,
    padding: scale(8),
  },
  editText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#4CAF50',
  },
  backButtonImage: {
    width: scale(20),
    height: undefined,
    resizeMode: 'contain',
  },
  backToLoginText: {
    fontSize: fontScale(16),
    color: '#000',
    fontWeight: '500',
  },
  timerText: {
    marginTop: verticalScale(6),
    textAlign: 'center',
    fontSize: fontScale(12),
    color: '#666',
  },
  resendContainer: {
    marginTop: verticalScale(18),
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

  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderText: {
    marginTop: 12,
    color: '#fff',
    fontSize: fontScale(14),
  },
  resendDisabled: {
    color: '#999',
    textDecorationLine: 'none',
  },
});
