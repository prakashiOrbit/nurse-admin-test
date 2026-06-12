import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet, View, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { enableScreens } from 'react-native-screens';

import AppNavigator from './src/navigation/AppNavigator';
import { setupAxiosInterceptors } from './src/utils/axiosInterceptor';
import { navigationRef } from './src/navigation/navigationService';
import { configureGoogleSignIn } from './src/utils/googleAuth';
import NetworkProvider from './src/context/NetworkProvider';
import { toastConfig } from './src/config/ToastConfig';
import Orientation from 'react-native-orientation-locker';
import './src/i18n';
import { restoreLanguage } from './src/i18n';

configureGoogleSignIn();
enableScreens();

export default function App() {
  useEffect(() => {
    // Interceptors don't need nav to be ready at setup time —
    // navigateWhenReady() in the interceptor handles that internally
    setupAxiosInterceptors();
    Orientation.lockToLandscape();
    restoreLanguage();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <NetworkProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </NetworkProvider>
      <Toast config={toastConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
