import { first, set } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { fontScale, scale, verticalScale } from '../../../../utils/scaling';
import Toast from 'react-native-toast-message';
import { useResponsive } from '../../../../utils/responsive';
import { getSharedStyles } from '../../../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';

type SharedChangePasswordAuthenticatedProps = {
  BackButton: any;
  eyeImage: any;
  eyeOffImage: any;
  onBackPress: () => void;
  onSavePassword: (
    currentpassword: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  onForgotPasswordPress: () => void;
};
const SharedChangePasswordAuthenticated: React.FC<
  SharedChangePasswordAuthenticatedProps
> = ({ BackButton, eyeImage, eyeOffImage, onBackPress, onSavePassword, onForgotPasswordPress }) => {
    const { t } = useTranslation();
    const { isTablet } = useResponsive();
    const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordVisibility, setCurrentPasswordVisibility] =
    useState(true);
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] =
    useState(true);
  const [rightIconColor] = useState('#000000');
  //   const isFormValid = password.length > 0 && confirmPassword.length > 0;
  const [errorMsg, setErrorMsg] = useState('');
  const [newPassErrorMsg, setNewPassErrorMsg] = useState('');
  const [currentPassErrorMsg, setCurrentPassErrorMsg] = useState('');
  const handlePasswordVisibility = () => {
    setPasswordVisibility(prev => !prev);
  };

  const handleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisibility(prev => !prev);
  };

  const handleCurrentPasswordVisibility = () => {
    setCurrentPasswordVisibility(prev => !prev);
  };

   const errorMessageStyle = useMemo(
    () => ({
      color: 'red',
      marginTop: scale(4),
      fontSize: isTablet? RFValue(12): RFValue(10)
    }),
    [isTablet],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: '#fffefe' }}>
        <View style={styles.header}>
          <Pressable
            onPress={onBackPress}
            hitSlop={8}
            style={styles.backButton}
          >
            <Image source={BackButton} style={styles.backIcon} />
          </Pressable>
          <Text style={shared.headerTitle}>{t('change_password_auth.title')}</Text>
        </View>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.firstSection}>
            <Text style={[shared.inputLabel, { marginLeft: scale(30) }]}>
              {t('change_password_auth.current_password_label')}
            </Text>
            <View
              style={[
                styles.passwordContainerFirst,
                currentPassErrorMsg && { borderColor: 'red' },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { fontSize: shared.placeholder.fontSize }]}
                placeholder={t('change_password_auth.current_password_placeholder')}
                placeholderTextColor={shared.placeholder.color}
                value={currentPassword}
                disableFullscreenUI={true}
                onChangeText={text => {
                  setCurrentPassword(text);
                  setCurrentPassErrorMsg('');
                }}
                secureTextEntry={currentPasswordVisibility}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={handleCurrentPasswordVisibility}
              >
                <Image
                  source={currentPasswordVisibility ? eyeOffImage : eyeImage}
                  style={[styles.eyeImage, { tintColor: rightIconColor }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
            {currentPassErrorMsg ? (
              <Text style={[errorMessageStyle, { marginLeft: scale(30) }]}>
                {currentPassErrorMsg}
              </Text>
            ) : null}
            <View style={{ marginLeft: scale(30) }}>
              <Text style={styles.forgotText} onPress={onForgotPasswordPress}>
                {t('change_password_auth.forgot_current_password')}
              </Text>
            </View>
          </View>
          <View style={styles.firstSection}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={shared.inputLabel}>{t('change_password_auth.new_password_label')}</Text>
                <View
                  style={[
                    styles.passwordContainer,
                    errorMsg && { borderColor: 'red' },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { fontSize: shared.placeholder.fontSize }]}
                    placeholder={t('change_password_auth.new_password_placeholder')}
                    placeholderTextColor={shared.placeholder.color}
                    value={password}
                    disableFullscreenUI={true}
                    onChangeText={text => {
                      setPassword(text);
                      setErrorMsg('');
                    }}
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
                {errorMsg ? (
                  <Text style={errorMessageStyle}>{errorMsg}</Text>
                ) : null}
              </View>

              <View style={styles.halfInput}>
                <Text style={shared.inputLabel}>{t('change_password_auth.confirm_password_label')}</Text>
                <View
                  style={[
                    styles.passwordContainer,
                    newPassErrorMsg && { borderColor: 'red' },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { fontSize: shared.placeholder.fontSize }]}
                    placeholder={t('change_password_auth.confirm_password_placeholder')}
                    placeholderTextColor={shared.placeholder.color}
                    value={confirmPassword}
                    disableFullscreenUI={true}
                    onChangeText={text => {
                      setConfirmPassword(text);
                      setNewPassErrorMsg('');
                    }}
                    secureTextEntry={confirmPasswordVisibility}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={handleConfirmPasswordVisibility}
                  >
                    <Image
                      source={
                        confirmPasswordVisibility ? eyeOffImage : eyeImage
                      }
                      style={[styles.eyeImage, { tintColor: rightIconColor }]}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                {newPassErrorMsg ? (
                  <Text style={errorMessageStyle}>{newPassErrorMsg}</Text>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <Pressable
              style={[styles.loginButton]}
              //   disabled={!isFormValid}
              onPress={async () => {
                if (!currentPassword) {
                  setCurrentPassErrorMsg(`*${t('change_password_auth.password_required')}`);
                  return;
                }
                if (!password) {
                  setErrorMsg(`*${t('change_password_auth.password_required')}`);
                  return;
                }
                if (!confirmPassword) {
                  setNewPassErrorMsg(`*${t('change_password_auth.password_required')}`);
                  return;
                }

                if (password.length < 9) {
                  Toast.show({
                    type: 'error',
                    text1: t('change_password_auth.password_min_length'),
                    position: 'top',
                  });
                  setErrorMsg(`*${t('change_password_auth.password_min_length')}`);
                  return;
                }

                if (password !== confirmPassword) {
                  setNewPassErrorMsg(`*${t('change_password_auth.passwords_mismatch')}`);
                  return;
                }
                // Handle password reset logic here
                await onSavePassword(
                  currentPassword,
                  password,
                  confirmPassword,
                );
              }}
            >
              <Text style={shared.loginText}>{t('change_password_auth.button')}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SharedChangePasswordAuthenticated;

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // padding: scale(8),
    paddingTop: scale(28),
    paddingLeft: scale(26),
    justifyContent: 'flex-start',
    // gap: scale(10),
  },
  firstSection: {
    backgroundColor: '#fff',
    marginHorizontal: scale(16),
    marginTop: scale(4),
    borderRadius: scale(12),
    padding: scale(8),
  },

  //   secondSection: {
  //     backgroundColor: '#ffffff',
  //     marginHorizontal: 16,
  //     marginTop: 4,
  //     borderRadius: 12,
  //     padding: 8,
  //   },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(67),
    marginHorizontal: scale(30),
  },

  halfInput: {
    flex: 1,
  },

  passwordContainerFirst: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: scale(1),
    borderRadius: scale(4),
    height: verticalScale(44),
    paddingRight: scale(6),
    backgroundColor: '#fff',
    width: '42%',
    marginLeft: scale(30),
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: scale(1),
    borderRadius: scale(4),
    height: verticalScale(44),
    paddingRight: scale(6),
    backgroundColor: '#fff',
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: scale(12),
    color: '#000',
    paddingRight: scale(44),
  },

  eyeIcon: {
    position: 'absolute',
    right: scale(12),
    padding: scale(8),
  },
  eyeImage: {
    width: scale(22),
    height: verticalScale(22),
  },
  loginButton: {
    backgroundColor: '#4CAE51',
    paddingVertical: verticalScale(12),
    borderRadius: scale(4),
    marginTop: verticalScale(12),
    marginBottom: verticalScale(12),
    marginHorizontal: scale(16),
    alignItems: 'center',
    width: '38%',
    alignSelf: 'center',
  },

  loginText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: fontScale(14),
  },
  headerText: {
    fontSize: fontScale(24),
    fontWeight: '500',
  },
  passwordLabel: {
    marginBottom: scale(6),
    fontSize: fontScale(18),
    fontWeight: '600',
  },
  bottomSection: {
    // backgroundColor: '#866b6b',
    // marginTop:scale(4),
    flex: 1,
    // flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: scale(36),
  },
  backIcon: {
    width: scale(20),
    // height: scale(20),
    resizeMode: 'contain',
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f0f0f0',
  },
  forgotText: {
    color: '#000',
    textDecorationLine: 'underline',
    fontSize:scale(12),
    fontWeight:'500'
  },
  errorMessage: {
    width: '100%',
    color: 'red',
    marginTop: scale(4),
  },
});
