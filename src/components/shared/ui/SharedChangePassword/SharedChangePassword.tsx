import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
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
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useResponsive } from '../../../../utils/responsive';
import { getSharedStyles } from '../../../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';

type SharedChangePasswordProps = {
  title: string;
  description: string;
  imageSource: any;
  eyeImage: any;
  eyeOffImage: any;
  backButton: any;
  onBackPress: () => void;
  onSavePassword: (password: string, confirmPassword: string) => Promise<void>;
};

const SharedChangePassword: React.FC<SharedChangePasswordProps> = ({
  title,
  description,
  imageSource,
  eyeImage,
  eyeOffImage,
  backButton,
  onBackPress,
  onSavePassword,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] =
    useState(true);
  const [rightIconColor] = useState('#000000');
  const { t } = useTranslation();
  const { wp, hp, isTablet, width, height } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);
  
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
        paddingVertical: isTablet? verticalScale(25) : verticalScale(12),
        justifyContent: 'space-between',
        backgroundColor: '#fff',
      }),
      [isTablet, wp],
    );

  const forgotpasswordtextStyle = useMemo(
      () => ({
        fontSize: isTablet? RFValue(20): RFValue(16),
        fontWeight: '600',
        marginBottom: isTablet? verticalScale(18) : verticalScale(6),
        textAlign: 'center',
      }),
      [isTablet, wp],
    );

    const forgotpasswordsubtextStyle = useMemo(
        () => ({
          fontSize: isTablet? RFValue(14): RFValue(12),
          fontWeight: '500',
          marginBottom: isTablet? verticalScale(20) : verticalScale(12),
          textAlign: 'center',
        }),
        [isTablet, wp],
      );

    const passwordInputStyle= useMemo(
      ()=>({
        flex: 1,
        paddingHorizontal: scale(12),
        fontSize: isTablet? RFValue(12): RFValue(10),
        color: '#000',
      }),
      [isTablet]
    )

    const formsectionStyle= useMemo(
      ()=>({
        gap: isTablet? verticalScale(14): verticalScale(12),
        marginBottom: isTablet? scale(2): scale(4)
      }),
      [isTablet]
    )

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
            style={[styles.image, { aspectRatio: 659 / 570 }]}
            resizeMode="contain"
          />
          {/* <Text style={styles.description}>{description}</Text> */}
        </View>

        <View style={rightpanelStyle}>
          <View>
            <Text style={forgotpasswordtextStyle}>{t('change_password.title')}</Text>
          </View>
          <View>
            <Text style={forgotpasswordsubtextStyle}>
              {t('change_password.subtitle')}
            </Text>
          </View>
          <View style={formsectionStyle}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={passwordInputStyle}
                placeholder={t('change_password.new_password_placeholder')}
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
                style={passwordInputStyle}
                placeholder={t('change_password.confirm_password_placeholder')}
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
                style={[shared.loginButton]}
                onPress={async () => {
                  if (!password || !confirmPassword) {
                    Toast.show({
                      type: 'error',
                      text1: t('change_password.password_required'),
                      position: 'top',
                    });
                    return;
                  }

                  if (password.length < 9) {
                    Toast.show({
                      type: 'error',
                      text1: t('change_password.password_min_length'),
                      position: 'top',
                    });
                    return;
                  }

                  if (password !== confirmPassword) {
                    Toast.show({
                      type: 'error',
                      text1: t('change_password.passwords_mismatch'),
                      text2: t('change_password.passwords_mismatch_msg'),
                      position: 'top',
                    });
                    return;
                  }
                  // Handle password reset logic here
                  await onSavePassword(password, confirmPassword);
                }}
              >
                <Text style={shared.loginText}>{t('change_password.save_password')}</Text>
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SharedChangePassword;

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
    flexDirection: 'column',
    paddingHorizontal: scale(35),
    paddingVertical: verticalScale(10),
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  appTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    marginBottom: verticalScale(6),
  },
  image: {
    width: scale(220),
    height: undefined,
    marginBottom: scale(12),
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
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    fontSize: RFValue(10),
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
    width: scale(39),
    height: verticalScale(50),
    borderRadius: scale(5),
    textAlign: 'center',
    fontSize: scale(18),
    backgroundColor: '#E2E2E2',
    color: '#705757',
  },
  forgotPasswordText: {
    fontSize: fontScale(20),
    fontWeight: '600',
    marginBottom: verticalScale(6),
    textAlign: 'center',
  },
  forgotPasswordSubText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  emailInstruction: {
    fontSize: fontScale(16),
    fontWeight: '400',
    marginBottom: verticalScale(20),
    textAlign: 'center',
    width: '100%',
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
  formSection: {
    gap: verticalScale(12), //
  },
});
