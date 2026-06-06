import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateWhenReady(routeName: keyof RootStackParamList): Promise<void> {
  return new Promise((resolve) => {
    const tryNavigate = () => {
      if (navigationRef.isReady()) {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routeName }],
          }),
        );
        resolve();
      } else {
        setTimeout(tryNavigate, 100);
      }
    };
    tryNavigate();
  });
}

// Keep this for general navigation use across the app
export function navigate(name: keyof RootStackParamList, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  } else if (__DEV__) {
    console.warn('[Nav] navigationRef not ready yet for:', name);
  }
}