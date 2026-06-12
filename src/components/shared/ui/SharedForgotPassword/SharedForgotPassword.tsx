import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { fontScale, scale, verticalScale } from '../../../../utils/scaling';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native';
import Loader from '../../../Loader';
import { useResponsive } from '../../../../utils/responsive';
import { getSharedStyles } from '../../../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';

type SharedForgotPasswordProps = {
  title: string;
  // description: string;
  imageSource: any;
  backButton: any;
  onBackPress: () => void;
  onGetOtp: (email: string) => Promise<boolean>;
  onVerifyOtp: (email: string, otp: string) => Promise<boolean>;
};

const SharedForgotPassword: React.FC<SharedForgotPasswordProps> = ({
  title,
  // description,
  imageSource,
  backButton,
  onBackPress,
  onGetOtp,
  onVerifyOtp,
}) => {
  const { t } = useTranslation();
  // const { isTablet } = useResponsive();
  const { wp, hp, isTablet, width, height } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const [email, setEmail] = useState<string>('');
  const [isOtpDisabled, setIsOtpDisabled] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (text: string, index: number) => {
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
  const handleBack = () => {};

  const startOtpCooldown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsOtpDisabled(true);
    setTimer(60);

    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsOtpDisabled(false);
          return 30;
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

  const forgotPasswordTextStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(20) : RFValue(16),
      fontWeight: '600',
      marginBottom: verticalScale(12),
      textAlign: 'center',
    }),
    [isTablet],
  );

  const emailInstructionStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16) : RFValue(14),
      fontWeight: '500',
      marginBottom: verticalScale(35),
      textAlign: 'center',
      width: '100%',
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
            style={[styles.image, { aspectRatio: 525 / 450 }]}
            resizeMode="contain"
          />
          {/* <Text style={styles.description}>{description}</Text> */}
        </View>

        <View style={styles.rightPanel}>
          <View>
            <Text style={forgotPasswordTextStyle}>{t('forgot_password.title')}</Text>
          </View>
          <View>
            <Text style={emailInstructionStyle}>
              {t('forgot_password.instruction')}
            </Text>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[shared.placeholder,{paddingLeft: 10}]}
              placeholder={t('forgot_password.email_placeholder')}
              placeholderTextColor={'#606060'}
              value={email}
              disableFullscreenUI={true}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            {/* <Pressable
              style={[styles.getOtpButton, isOtpDisabled && { opacity: 0.5 }]}
              disabled={isOtpDisabled}
              onPress={async () => {
                if (!email) {
                  Toast.show({
                    type: 'error',
                    text1: t('forgot_password.email_required'),
                    position: 'top',
                  });
                  return;
                }

                try {
                  setLoading(true);
                  const success = await onGetOtp(email.trim());
                  if (success) {
                    startOtpCooldown();
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.getOtpText}>
                {isOtpDisabled ? 'OTP Sent' : 'Get OTP'}
              </Text>
            </Pressable> */}
          </View>
          {/* {isOtpDisabled && (
            <Text style={styles.timerText}>You can resend OTP in {timer}s</Text>
          )} */}
          {/* <View>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => (inputsRef.current[index] = ref)}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  disableFullscreenUI={true}
                  onChangeText={text => handleChange(text, index)}
                  onKeyPress={e => handleBackspace(e, index)}
                />
              ))}
            </View>
          </View> */}
          <View>
            <Pressable
              style={shared.loginButton}
              // onPress={async () => {
              //   if (!email) {
              //     Toast.show({
              //       type: 'error',
              //       text1: t('forgot_password.email_required'),
              //       position: 'top',
              //     });
              //     return;
              //   }

              //   if (otp.some(digit => digit === '')) {
              //     Toast.show({
              //       type: 'error',
              //       text1: 'Please enter complete OTP',
              //       position: 'top',
              //     });
              //     return;
              //   }

              //   try {
              //     setLoading(true);
              //     await onVerifyOtp(email.trim(), otp.join(''));
              //   } finally {
              //     setLoading(false);
              //   }
              // }}
              onPress={async () => {
                if (!email) {
                  Toast.show({
                    type: 'error',
                    text1: t('forgot_password.email_required'),
                    position: 'top',
                  });
                  return;
                }

                try {
                  setLoading(true);
                  const success = await onGetOtp(email.trim());
                  if (success) {
                    startOtpCooldown();
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={shared.loginText}>{t('forgot_password.send_otp')}</Text>
            </Pressable>
          </View>
          {/* <View style={styles.cancelButton} onTouchEnd={onBackPress}>
            <Text style={styles.cancelText}>Cancel</Text>
          </View> */}
          {/* <View style={styles.backButton} onTouchEnd={onBackPress}>
            <Image source={backButton} style={[styles.backButtonImage, { aspectRatio: 16/16 }]} />
            <Text style={styles.backToLoginText}>Back to login</Text>
          </View> */}
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

export default SharedForgotPassword;

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
    justifyContent: 'space-between',
    backgroundColor: '#ffffffff',
  },
  rightPanel: {
    flex: 1,
    paddingHorizontal: scale(35),
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  appTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    marginBottom: verticalScale(12),
  },
  image: {
    width: scale(220),
    height: undefined,
    marginTop: verticalScale(10),
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
    marginTop: verticalScale(10),
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: 'auto',
    marginBottom: verticalScale(16),
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
});
