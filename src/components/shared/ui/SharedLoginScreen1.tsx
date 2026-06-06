// shared/ui/LoginScreen.tsx
import React, { useCallback, useState } from 'react';
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
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fontScale, scale, verticalScale } from '../../../utils/scaling';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { loginNurseWithGoogle } from '../../../services/authService';
const googleIcon = require('../../../../assets/icons/google.png');
const eyeIcon = require('../../../../assets/icons/eye-line.png');
const eyeOffIcon = require('../../../../assets/icons/eye-off-line.png');

type RootStackParamList = {
  Login: undefined;
  TwoFactorAuth: undefined;
  Dashboard: undefined;
  ForgotPassword: undefined;
  CreateNewPassword: undefined;
};

type LoginScreenProps = {
  title: string;
  description: string;
  imageSource: any;
  logoSource: any;
  onLogin: (username: string, password: string) => Promise<any>;
};

const SharedLoginScreen1: React.FC<LoginScreenProps> = ({
  title,
  description,
  imageSource,
  logoSource,
  onLogin,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [rightIconColor] = useState('#000000');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastAttemptedPassword, setLastAttemptedPassword] =
    useState<string>('');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('tempUsername').then(savedUser => {
        if (savedUser) {
          setUsername(savedUser);
        }
      });
      AsyncStorage.getItem('tempPassword').then(savedPass => {
        // Add this
        if (savedPass) {
          setPassword(savedPass);
        }
      });
    }, []),
  );

  const handlePasswordVisibility = () => {
    setPasswordVisibility(prev => !prev);
  };

  const validateEmail = (email: any) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: 'Please fill Username & Password',
      });
      return;
    }
    const trimmedUsername = username.trim();
    if (!validateEmail(trimmedUsername)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    // Save trimmed username before API (for persistence)
    await AsyncStorage.setItem('tempUsername', trimmedUsername);

    await AsyncStorage.setItem('tempPassword', password);

    try {
      setLoading(true);
      console.log('Login attempt with:', trimmedUsername);

      const response = await onLogin(trimmedUsername, password);
      console.log('Login response:', response);

      await AsyncStorage.removeItem('tempUsername');
      setPassword('');
      await AsyncStorage.removeItem('tempPassword');
      setLastAttemptedPassword('');

      await AsyncStorage.setItem('userName', response.userName);
      await AsyncStorage.setItem('orgName', response.orgName);

      if (response.code === '111') {
        Toast.show({
          type: 'info',
          text1: 'Verify Your Email',
          text2: response.message,
        });
        // Set state for email verification flow if needed
        return;
      }

      if (response.code === '222') {
        Toast.show({
          type: 'info',
          text1: '2-Factor Authentication',
          text2: response.message,
        });
        navigation.replace('TwoFactorAuth');
        return;
      }

      // If no special codes, proceed to dashboard
      navigation.replace('Dashboard');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        'Invalid credentials. Please check your email and password';

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });
      await AsyncStorage.getItem('tempPassword').then(savedPass => {
        if (savedPass) {
          setPassword(savedPass);
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Ensure Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // clearing cache before signin(responsible for showing account picker every time)
      await GoogleSignin.signOut();

      // generate the idToken from Google Sign-In
      const userInfo = await GoogleSignin.signIn();

      // console.log('Google user info:', userInfo);

      const idToken = userInfo.data?.idToken;

      // if user cancels sign-in, idToken will be undefined
      if (!idToken) {
        return;
      }

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
          navigation.replace('TwoFactorAuth');
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
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
    // navigation.navigate('CreateNewPassword');
  };

  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={styles.leftPanel}>
          <Text style={styles.appTitle}>{title}</Text>
          <Image
            source={imageSource}
            style={[styles.image, {aspectRatio: 979/654}]}
            resizeMode="contain"
          />
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.rightPanel}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true} 
            bounces={false} 
          >
            <Image source={logoSource} style={[styles.logo, {aspectRatio: 4890/ 2103}]} />
            <Text style={styles.welcomeText}>Welcome to iTouch Nurse</Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={'#000000'}
              value={username}
              disableFullscreenUI={true}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
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
                  source={passwordVisibility ? eyeOffIcon : eyeIcon}
                  style={[styles.eyeImage, { tintColor: rightIconColor }]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.forgotRow}>
              <TouchableOpacity>
                 <Text
                  style={styles.forgotPassword}
                   onPress={handleForgotPassword}
                >
                  Forgot password?
                </Text> 
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.loginButton, styles.googleButton]}
              onPress={handleGoogleLogin}
            >
              <Image source={googleIcon} style={styles.googleIcon} />
              <Text style={styles.googleText}>Log in with Google</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default SharedLoginScreen1;

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
    paddingVertical: verticalScale(10),
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    // paddingBottom: 20,
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
  logo: {
    width: scale(150),
    height: undefined,
    alignSelf: 'center',
    // marginBottom: scale(2),
  },
  welcomeText: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    marginBottom: scale(10),
    textAlign: 'center',
  },
  input: {
    height: verticalScale(40),
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#000',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    height: verticalScale(40),
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingRight: 40, // Make space for the icon
    color: '#000000',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  forgotText: {
    color: '#999',
  },
  forgotPassword: {
    color: 'green',
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#4CAE51',
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginText: {
    textAlign: 'center',
    color: 'white',
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
  eyeImage: {
    width: scale(22),
    height: verticalScale(22),
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleIcon: {
    width: scale(18),
    height: scale(18),
    marginRight: scale(8),
    resizeMode: 'contain',
  },

  googleText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: fontScale(14),
  },
});
