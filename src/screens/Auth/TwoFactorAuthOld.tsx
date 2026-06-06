import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verify2faAPI, getAndCreateFcmTokenAPI } from '../../services/nurseService';
import Toast from 'react-native-toast-message';
import  messaging, { getMessaging } from '@react-native-firebase/messaging';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { fontScale, scale, verticalScale } from '../../utils/scaling';

type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  TwoFactorAuth: undefined;
};

const TwoFactorAuth = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

   
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
    Toast.show({
      type: 'error',
      text1: 'OTP Required',
      text2: 'Please enter the OTP to continue.',
    });
    return;
  }

    try {
      const response = await verify2faAPI(otp);
      console.log('OTP Verification Response:', response);

        await AsyncStorage.setItem('hospitalCode', response.hospitalCode);
        await AsyncStorage.setItem('userId', response.userId);
        await AsyncStorage.setItem('hospitalId', response.hospitalId);
        await AsyncStorage.setItem('orgId', response.orgId);
        await AsyncStorage.setItem('firstName', response.firstName);
        await AsyncStorage.setItem('lastName', response.lastName);
        
        const fcmToken= await getMessaging().getToken();
        const deviceOsInfo = Platform.OS;
        const userName = await AsyncStorage.getItem('userName');

        const fcmPayload = {
          username: userName,
          fcmToken,
          deviceOsInfo
        };

        await getAndCreateFcmTokenAPI(fcmPayload);

        setError('');
        navigation.replace('Dashboard');
      } 
     catch (err) {
      console.error('OTP Verification Failed:', err);
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.leftPanel}>
        <Text style={styles.appTitle}>2FA Verification</Text>
        <Image source={require('../../../assets/images/nurse.png')} style={styles.image} resizeMode="contain" />
        <Text style={styles.description}>
          Please enter the One-Time Password sent to your registered email or phone
          to complete the login process.
        </Text>
      </View>

      <View style={styles.rightPanel}>
        <Image source={require('../../../assets/images/hospital_logo.jpg')} style={styles.logo} />
        <Text style={styles.welcomeText}>Enter OTP to Continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleVerifyOtp}>
          <Text style={styles.loginText}>Verify</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default TwoFactorAuth;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
  },
  leftPanel: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#e6f7ff',
  },
  rightPanel: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  appTitle: {
    fontSize: fontScale(28),
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#34a853',
  },
  description: {
    fontSize: fontScale(14),
    color: '#333',
    marginTop: 12,
  },
  image: {
    width: '80%',
    height: verticalScale(200),
    alignSelf: 'center',
  },
  logo: {
    width: scale(100),
    height: verticalScale(100),
    alignSelf: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: fontScale(20),
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: fontScale(16),
  },
  loginButton: {
    backgroundColor: '#34a853',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  loginText: {
    color: '#fff',
    fontSize: fontScale(16),
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginTop: 8,
    textAlign: 'center',
  },
});
