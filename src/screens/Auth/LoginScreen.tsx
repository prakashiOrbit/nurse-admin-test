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
import { SafeAreaView } from 'react-native-safe-area-context';
const eyeIcon = require('../../../assets/icons/eye-line.png');
const eyeOffIcon = require('../../../assets/icons/eye-off-line.png');



import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginNurse } from '../../services/authService';

type RootStackParamList = {
  Login: undefined;
  TwoFactorAuth: undefined; 
  Dashboard: undefined;
};

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [rightIconColor, setRightIconColor] = useState('#000000');
  const [error, setError] = useState('');

  

  const handlePasswordVisibility = () => {
  setPasswordVisibility(prev => !prev);
};


  const handleLogin = async () => {
    try {
      const loginData = {
        userName: username,
        password: password,
      };

      const response = await loginNurse(loginData);
      await AsyncStorage.setItem('userName', response.userName);
      await AsyncStorage.setItem('orgName', response.orgName);

      setError('');
      navigation.replace('TwoFactorAuth');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.leftPanel}>
          <Text style={styles.appTitle}>iTouch Nurse</Text>
          <Image source={require('../../../assets/images/nurse.png')} style={styles.image} resizeMode="contain" />
          <Text style={styles.description}>
            This app is built to streamline ICU tasks for nurses. View real time
            patient vitals, receive instructions from doctors and manage shift
            handovers smoothly. Easily access patient details, get critical alerts
            and stay connected for faster, safer care delivery.
          </Text>
        </View>

        <View style={styles.rightPanel}>
          <Image source={require('../../../assets/images/hospital_logo.jpg')} style={styles.logo} />
          <Text style={styles.welcomeText}>Welcome to ICU Ward B</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={'#000000'}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

           <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={'#000000'}
              value={password}
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
            <Text style={styles.forgotText}> </Text>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

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
  },
  leftPanel: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  rightPanel: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
 passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    height: 40,
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
    justifyContent: 'space-between',
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
    backgroundColor: '#34a853',
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  description: {
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
    color: '#555',
  },
  eyeImage: {
  width: 22,
  height: 22,
},

});