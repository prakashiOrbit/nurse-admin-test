import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateWhenReady } from '../navigation/navigationService';
import Toast from 'react-native-toast-message';
import { privateApi } from '../services/privateApi';
import i18n from '../i18n';

let sessionExpiryPromise: Promise<void> | null = null;

export const setupAxiosInterceptors = () => {
  privateApi.interceptors.response.use(
    response => response,
    async (error) => {
      const status = error.response?.status;
      const originalRequest = error.config as any;

      if (
        status === 401 &&
        !originalRequest?._retry &&
        !originalRequest?.skipSessionHandler
      ) {
        originalRequest._retry = true;

        // Another 401 already being handled — wait for it then reject
        if (sessionExpiryPromise) {
          try { await sessionExpiryPromise; } catch (_) {}
          return Promise.reject(error);
        }

        // Synchronous lock — no await before this line
        sessionExpiryPromise = (async () => {
          try {
            Toast.show({
              type: 'error',
              text1: i18n.t('common.session_expired'),
              text2: i18n.t('common.please_login_again'),
            });

            // Step 1: Clear storage independently — don't let failure block navigation
            try {
              await AsyncStorage.multiRemove([
                'authToken',
                'userName',
                'orgName',
                'careSiteCode',
                'wardCode',
                'isAuthenticated',
              ]);
            } catch (e) {
              if (__DEV__) console.error('[Interceptor] AsyncStorage.multiRemove failed:', e);
            }

            // Step 2: Navigate — waits internally until nav tree is ready
            await navigateWhenReady('NurseLogin');

          } catch (e) {
            if (__DEV__) console.error('[Interceptor] Session expiry handler failed:', e);
          } finally {
            // Hold lock so in-flight 401s don't retrigger during redirect
            await new Promise<void>(resolve => setTimeout(resolve, 3000));
            sessionExpiryPromise = null;
          }
        })();

        try { await sessionExpiryPromise; } catch (_) {}
        return Promise.reject(error);
      }

      return Promise.reject(error);
    },
  );
};