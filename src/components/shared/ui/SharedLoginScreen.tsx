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
import { fontScale, scale, verticalScale } from '../../../utils/scaling';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { loginNurseWithGoogle } from '../../../services/authService';
import { useResponsive } from '../../../utils/responsive';
import { Icon, Images } from '../../../../assets';
import { COUNTRY_DATA } from '../../../constants/countries';
import CountryFlag from 'react-native-country-flag';
import { RootStackParamList } from '../../../navigation/AppNavigator';

const eyeIcon = require('../../../../assets/icons/eye-line.png');
const eyeOffIcon = require('../../../../assets/icons/eye-off-line.png');
const googleIcon = require('../../../../assets/icons/google.png');

// type RootStackParamList = {
//   nurseLogin: undefined;
//   EmailLogin: undefined;
//   TwoFactorAuth: undefined;
//   Dashboard: undefined;
// };

type LoginScreenProps = {
  title: string;
  description: string;
  imageSource: any;
  onLogin: (mobileNumber: string, countryCode: string) => Promise<any>;
};

const SharedLoginScreen: React.FC<LoginScreenProps> = ({
  title,
  description,
  imageSource,
  onLogin,
}) => {
  const { wp, hp, isTablet, width, height } = useResponsive();
  const isLandscape = width > height;

  const leftpanelStyle = useMemo(
    () => ({
      paddingLeft: isTablet ? scale(28) : scale(65),
      paddingRight: isTablet ? scale(18) : scale(20),
      maxWidth: isTablet ? wp(50) : '100%',
      paddingTop: isTablet ? 30 : verticalScale(20),
    }),
    [isTablet, wp],
  );

  const rightPanelStyle = useMemo(
    () => ({
      paddingRight: isTablet ? scale(28) : scale(85),
      paddingLeft: isTablet ? scale(18) : scale(20),
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

  const appTitleStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 20 : 24, 812),
      fontWeight: 'bold',
      marginBottom: isTablet ? scale(12) : verticalScale(16),
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

  const welcomeText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 18 : 20, 812),
      fontWeight: 'bold',
      marginBottom: isTablet ? scale(10) : verticalScale(12),
      textAlign: 'center',
    }),
    [isTablet],
  );

  const inputStyle = useMemo(
    () => ({
      height: isTablet ? 48 : verticalScale(35),
      borderColor: '#000000',
      borderWidth: 1,
      borderRadius: isTablet ? 10 : scale(12),
      paddingHorizontal: scale(20),
      marginBottom: isTablet ? scale(10) : verticalScale(12),
      fontSize: RFValue(isTablet ? 10 : 12, 812),
      overflow: 'hidden',
    }),
    [isTablet],
  );

  const passwordInputStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 10 : 12, 812),
      paddingHorizontal: scale(20),
    }),
    [isTablet],
  );

  const passwordContainerStyle = useMemo(
    () => ({
      borderRadius: isTablet ? 10 : scale(12),
      marginBottom: verticalScale(2),
      height: isTablet ? 48 : verticalScale(35),
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

  const googleIconStyle = useMemo(
    () => ({
      width: isTablet ? wp(3) : scale(20),
      height: undefined,
      aspectRatio: 48 / 48,
      marginRight: scale(8),
      resizeMode: 'contain',
    }),
    [isTablet, wp],
  );

  const mailIconStyle = useMemo(
    () => ({
      width: isTablet ? wp(3) : scale(20),
      height: undefined,
      aspectRatio: 1,
      marginRight: scale(8),
      resizeMode: 'contain',
    }),
    [isTablet, wp],
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
      // marginBottom: isTablet ? scale(10) : verticalScale(10),
      paddingBottom: isTablet ? scale(22) : verticalScale(14),
      marginBottom: isTablet ? scale(10) : verticalScale(14),
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
      fontStyle: 'mont',
    }),
    [isTablet],
  );

  const mobileInputContainerStyle = useMemo(
    () => ({
      borderWidth: isTablet ? 2 : 1,
      height: isTablet ? scale(38) : verticalScale(42),
      borderRadius: isTablet ? 14 : 10,
    }),
    [isTablet],
  );

  const otpInstructionStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 12 : 11, 812),
      fontWeight: 400,
    }),
    [isTablet],
  );

  const instructionView = useMemo(
    () => ({
      marginBottom: isTablet ? 24 : verticalScale(15),
      paddingLeft: 6,
    }),
    [isTablet],
  );

  const searchStyle = useMemo(
    () => ({
      width: isTablet ? scale(20) : scale(18),
      height: isTablet ? scale(20) : verticalScale(18),
      tintColor: '#666666',
      marginRight: 6,
    }),
    [isTablet],
  );

  const searchBarStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 12 : 10),
      height: isTablet ? scale(40) : verticalScale(35),
    }),
    [isTablet],
  );

  const loginwithStyle = useMemo(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isTablet ? scale(10) : scale(8),
      width: '100%',
      overflow: 'hidden',
      marginBottom: isTablet ? scale(20) : verticalScale(15),
    }),
    [isTablet],
  );

  const horizontalLineStyle = useMemo(
    () => ({
      width: '30%',
      height: isTablet ? 2 : 1,
      backgroundColor: '#000',
    }),
    [isTablet],
  );

  const loginWithText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 15 : 14, 812),
      paddingHorizontal: 10,
      color: '#000',
      fontWeight: '500',
    }),
    [isTablet],
  );

  const bottomButtonStyle = useMemo(
    () => ({
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: isTablet ? 15 : scale(10),
    }),
    [isTablet],
  );

  const googleButtonStyle = useMemo(
    () => ({
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#000',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: isTablet ? scale(12) : scale(6),
    }),
    [isTablet],
  );

  const buttonText = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 13 : 11, 812),
      fontWeight: 400,
    }),
    [],
  );

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_DATA[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [googleLoading, setGoogleLoading] = useState<boolean>(false); // For Google

  const inputContainerRef = useRef<View>(null);
  const [dropdownLayout, setDropdownLayout] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // New state

  const toggleDropdown = () => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    } else {
      // Keyboard.dismiss is vital to prevent layout jumping on iOS
      Keyboard.dismiss();

      // measureInWindow is more stable for absolute positioning on iOS
      inputContainerRef.current?.measureInWindow((x, y, width, height) => {
        setDropdownLayout({
          top: y + height,
          left: x,
          width: width,
        });
        setIsDropdownOpen(true);
      });
    }
  };

  const filteredCountries = useMemo(() => {
    return COUNTRY_DATA.filter(
      item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.includes(searchQuery),
    );
  }, [searchQuery]);

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

  const handleLogin = async () => {
    Keyboard.dismiss();

    // 1. Validation logic
    if (mobileNumber.length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Number',
        text2: 'Please enter a valid 10-digit mobile number to proceed.',
      });
      return;
    }

    try {
      setLoading(true);

      // 2. Call the API
      const response = await onLogin(mobileNumber, selectedCountry.code);
      await AsyncStorage.setItem('userName', response.userName);
      await AsyncStorage.setItem('orgName', response.orgName);
      // Persistence for user convenience
      await AsyncStorage.setItem('tempMobile', mobileNumber);
      await AsyncStorage.setItem('tempCountryCode', selectedCountry.code);

      // 3. Handle Business Logic Errors
      if (response?.status === 'error' || response?.code === 'USER_NOT_FOUND') {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'This mobile number is not registered in our system.',
        });
        return;
      }

      if (response?.code === '111') {
        Toast.show({
          type: 'error',
          text1: 'Verify Your Email with 1 fact authentication',
          // text2: response.message,
        });

        return;
      }
      // 4. Success - Inform user and navigate
      Toast.show({
        type: 'success',
        text1: 'OTP Dispatched',
        text2: `A verification code has been sent to ${selectedCountry.code} ${mobileNumber}`,
        visibilityTime: 4000,
      });

      // Pass params so TwoFactorAuth knows which number to verify
      navigation.navigate('TwoFactorAuth', {
        email: response?.userName || '', // In case API returns associated email, else empty
        loginType: 'mobile',
        phoneNumber: mobileNumber,
        countryCode: selectedCountry.code,
        verificationType: 'SECOND_FACTOR',
      });
    } catch (error: any) {
      const status = error?.response?.status;
      let errorTitle = 'Request Failed';
      let errorMessage =
        'Unable to send OTP. Please check your network connection.';

      if (status === 429) {
        errorTitle = 'Too Many Attempts';
        errorMessage = 'Please wait a few minutes before requesting a new OTP.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
      });

      console.error('Mobile Login Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      // Ensure Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // clearing cache before signin(responsible for showing account picker every time)
      await GoogleSignin.signOut();

      // generate the idToken from Google Sign-In
      const userInfo = await GoogleSignin.signIn();

      console.log('Google user info:', userInfo);

      const idToken = userInfo.data?.idToken;

      // if user cancels sign-in, idToken will be undefined
      if (!idToken) {
        return;
      }

      console.log('Google ID Token:', idToken);
      // passing the idToken to backend for verification and login
      const response = await loginNurseWithGoogle(idToken);
      console.log('Backend Google login response:', response);

      if (response.userName && response.orgName != null) {
        await AsyncStorage.setItem('userName', response.userName);
        await AsyncStorage.setItem('orgName', response.orgName);
      }

      switch (response.code) {
        case 'GMAIL_NOT_REGISTERED':
          Toast.show({
            type: 'error',
            text1: 'Account Not Found',
            text2: response.message,
          });
          return;

        case '111':
          Toast.show({
            type: 'info',
            text1: 'Verify Your Email',
            text2: response.message,
          });
          return;

        case '222':
          Toast.show({
            type: 'info',
            text1: '2-Factor Authentication',
            text2: response.message,
          });
          navigation.navigate('TwoFactorAuth', {
            email: response?.userName || '', // In case API returns associated email, else empty
            loginType: 'email',
            verificationType: 'SECOND_FACTOR',
            phoneNumber: mobileNumber,
            countryCode: selectedCountry.code,
          });
          return;
      }

      navigation.replace('Dashboard');
    } catch (error: any) {
      console.error('Google login error:', error);

      Toast.show({
        type: 'error',
        text1: 'Google Login Failed',
        text2:
          error?.response?.data?.message ||
          'Unable to login with Google. Please try again.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.safeContainer]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* WRAPPER: Detects taps to dismiss keyboard */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* MAIN CONTAINER: Replaces ScrollView */}
          <View style={contentStyle}>
            <View style={[styles.leftPanel, leftpanelStyle]}>
              {/* <Text style={appTitleStyle}>{title}</Text> */}
              <Image
                source={imageSource}
                style={imageStyles}
                resizeMode="contain"
              />
              <Text style={descriptionStyle}>{description}</Text>
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
                  <Text style={headerAppName}>{title} !</Text>
                </View>
              </View>

              <View
                ref={inputContainerRef}
                collapsable={false}
                style={[styles.mobileInputContainer, mobileInputContainerStyle]}
              >
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={toggleDropdown}
                >
                  <CountryFlag
                    isoCode={selectedCountry.iso}
                    size={isTablet ? 22 : 16}
                    style={styles.flag}
                  />
                  <Text style={styles.countryText}>{selectedCountry.code}</Text>
                  <Image
                    source={Icon.arraowDropdown}
                    style={styles.dropdownIcon}
                    resizeMode="contain"
                  />
                  <View style={styles.verticalDivider} />
                </TouchableOpacity>

                <TextInput
                  style={styles.flexInput}
                  placeholder="Enter Mobile Number"
                  placeholderTextColor={'#000'}
                  value={mobileNumber}
                  onChangeText={text =>
                    setMobileNumber(text.replace(/[^0-9]/g, ''))
                  }
                  keyboardType="phone-pad"
                  maxLength={10}
                  disableFullscreenUI={true}
                />
              </View>
              <View style={instructionView}>
                <Text style={otpInstructionStyle}>
                  An <Text style={{ fontWeight: '700' }}>OTP</Text> will be sent
                  to this number
                </Text>
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

              <View style={loginwithStyle}>
                <View style={horizontalLineStyle} />
                <Text style={loginWithText}>Login with</Text>
                <View style={horizontalLineStyle} />
              </View>
              <View style={bottomButtonStyle}>
                <TouchableOpacity
                  style={googleButtonStyle}
                  onPress={() => {
                    navigation.navigate('EmailLogin');
                  }}
                >
                  <Image source={Icon.mail} style={mailIconStyle} />
                  <Text style={buttonText}>E-mail Address</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={googleButtonStyle}
                  disabled={loading || googleLoading}
                  onPress={handleGoogleLogin}
                >
                  <Image source={googleIcon} style={googleIconStyle} />
                  <Text style={buttonText}>{'Google Account'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {isDropdownOpen && (
        <>
          {/* Transparent backdrop to catch taps outside */}
          <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.dropdownCard,
              isTablet
                ? {
                    maxHeight: scale(200),
                  }
                : { maxHeight: verticalScale(180) },
              {
                top: dropdownLayout.top + 5,
                left: dropdownLayout.left,
                width: dropdownLayout.width,
              },
            ]}
          >
            <View style={styles.searchView}>
              <Image source={Icon.search} style={searchStyle} />

              <TextInput
                style={[styles.searchBar, searchBarStyle]}
                placeholder="Search for countries"
                value={searchQuery}
                onChangeText={setSearchQuery}
                disableFullscreenUI={true}
                placeholderTextColor="#666666"
                // autoFocus={true}
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.iso}
              style={{ marginTop: 5 }}
              persistentScrollbar={true} // Keeps scrollbar visible on Android
              indicatorStyle="black" // iOS option
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled" // Important for scrolling
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setIsDropdownOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <CountryFlag
                    isoCode={item.iso}
                    size={14}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.itemText}>
                    {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </>
      )}
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
    flex: 1,
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
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000000',
    borderWidth: 1,
    overflow: 'hidden',
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
    color: '#4CAE51',
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
    width: scale(20),
    height: scale(14),
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

export default SharedLoginScreen;
