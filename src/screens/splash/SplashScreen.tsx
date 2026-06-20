import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RFValue } from 'react-native-responsive-fontsize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { getNurseDetails } from '../../services/authService';
import { AUTH_FLOW, clearAuthSession } from '../../services/sessionService';
import {
  authenticateWithBiometric,
  isBiometricEnrolled,
  revokeBiometric,
} from '../../services/biometricService';
import { setupNotifications } from '../../utils/notification';

const splashBackground = require('../../../assets/images/NurseInWard.png');
const iorbitLogo = require('../../../assets/images/iOrbit_Logo.png');

const FIRST_SCREEN_DURATION = 1800;
const SECOND_SCREEN_DURATION = 1600;
const CIRCLE_REVEAL_SIZE = 40;
const CIRCLE_REVEAL_DURATION = 650;
const NOTIFICATION_PERMISSION_DELAY = 500;

type SplashNavigation = NativeStackNavigationProp<RootStackParamList, 'Splash'>;
type SplashDestination = 'Dashboard' | 'NurseLogin';

const SplashScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<SplashNavigation>();
  const { width, height } = useWindowDimensions();
  const [activeStep, setActiveStep] = useState(0);
  const circleRevealScale = useRef(new Animated.Value(0)).current;
  const contentToneProgress = useRef(new Animated.Value(0)).current;
  const circleRevealFinalScale =
    Math.sqrt(width * width + height * height) / CIRCLE_REVEAL_SIZE + 2;

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    let isMounted = true;

    const checkAuth = async (): Promise<SplashDestination> => {
      try {
        // Biometric path: enrolled users skip password entirely
        const enrolled = await isBiometricEnrolled();
        if (enrolled) {
          const token = await authenticateWithBiometric(
            'Sign in to iTouch Nurse',
            'Use Password',
          );
          if (token) {
            await AsyncStorage.setItem('authToken', token);
            try {
              await getNurseDetails();
              return 'Dashboard';
            } catch {
              // Stored token is expired — revoke enrollment, force fresh login
              await revokeBiometric();
              await clearAuthSession();
              return 'NurseLogin';
            }
          }
          // User cancelled biometric prompt → fall through to password login
          return 'NurseLogin';
        }

        // Non-biometric path: standard token validation
        const authToken = await AsyncStorage.getItem('authToken');
        const authFlow = await AsyncStorage.getItem('authFlow');

        if (!authToken) return 'NurseLogin';

        if (authFlow !== AUTH_FLOW.AUTHENTICATED) {
          await clearAuthSession();
          return 'NurseLogin';
        }

        try {
          await getNurseDetails();
          return 'Dashboard';
        } catch {
          await clearAuthSession();
          return 'NurseLogin';
        }
      } catch (err) {
        console.error('Auth check error:', err);
        await clearAuthSession();
        return 'NurseLogin';
      }
    };

    const authCheckPromise = checkAuth();

    timers.push(
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(circleRevealScale, {
            toValue: circleRevealFinalScale,
            duration: CIRCLE_REVEAL_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(contentToneProgress, {
            toValue: 1,
            duration: CIRCLE_REVEAL_DURATION,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setActiveStep(1);
        });
      }, FIRST_SCREEN_DURATION),
    );

    timers.push(
      setTimeout(() => {
        authCheckPromise.then(destination => {
          if (!isMounted) return;

          navigation.reset({
            index: 0,
            routes: [{ name: destination }],
          });

          setTimeout(() => {
            setupNotifications().catch(error => {
              if (__DEV__) console.error('Notification setup error:', error);
            });
          }, NOTIFICATION_PERMISSION_DELAY);
        });
      }, FIRST_SCREEN_DURATION + SECOND_SCREEN_DURATION + CIRCLE_REVEAL_DURATION),
    );

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
      circleRevealScale.stopAnimation();
      contentToneProgress.stopAnimation();
    };
  }, [
    circleRevealFinalScale,
    circleRevealScale,
    contentToneProgress,
    navigation,
  ]);

  const isGreenSplash = activeStep === 0;
  const contentTextColor = contentToneProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#000000'],
  });

  const splashContent = (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isGreenSplash ? 'light-content' : 'dark-content'}
      />
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { color: contentTextColor }]}>
          {t('auth.app_title')}
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { color: contentTextColor }]}>
          {t('splash.subtitle')}
        </Animated.Text>
        <View style={styles.poweredByRow}>
          <Animated.Text
            style={[styles.poweredByText, { color: contentTextColor }]}
          >
            {t('common.powered_by')}
          </Animated.Text>
          <Image source={iorbitLogo} resizeMode="contain" style={styles.logo} />
        </View>
      </View>
    </>
  );

  if (!isGreenSplash) {
    return <View style={styles.whiteContainer}>{splashContent}</View>;
  }

  return (
    <ImageBackground
      source={splashBackground}
      resizeMode="cover"
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.greenOverlay} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.circleReveal,
          {
            transform: [{ scale: circleRevealScale }],
          },
        ]}
      />
      {splashContent}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  greenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(82, 174, 91, 0.68)',
  },
  circleReveal: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: CIRCLE_REVEAL_SIZE,
    height: CIRCLE_REVEAL_SIZE,
    marginLeft: -CIRCLE_REVEAL_SIZE / 2,
    marginTop: -CIRCLE_REVEAL_SIZE / 2,
    borderRadius: CIRCLE_REVEAL_SIZE / 2,
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: scale(24),
  },
  title: {
    fontSize: fontScale(42),
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: fontScale(52),
    marginBottom: verticalScale(48),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: RFValue(16, 812),
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: RFValue(24, 812),
    marginBottom: verticalScale(14),
    textAlign: 'center',
  },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredByText: {
    fontSize: RFValue(15, 812),
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: RFValue(22, 812),
    marginRight: scale(12),
  },
  logo: {
    width: scale(92),
    height: scale(40),
  },
});

export default SplashScreen;
