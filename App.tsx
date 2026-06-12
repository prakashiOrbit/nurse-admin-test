import React, { useEffect, useState } from 'react';
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
import i18n, { i18nInitPromise, restoreLanguage } from './src/i18n';

configureGoogleSignIn();
enableScreens();

export default function App() {
  const [i18nReady, setI18nReady] = useState(i18n.isInitialized);

  useEffect(() => {
    setupAxiosInterceptors();
    Orientation.lockToLandscape();

    if (i18n.isInitialized) {
      restoreLanguage();
      return;
    }

    let mounted = true;
    i18nInitPromise.then(async () => {
      await restoreLanguage();
      if (mounted) setI18nReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!i18nReady) return null;

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
