
import React, {createContext, useEffect, useState, useRef} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {View, Text, StyleSheet, Animated, Alert} from 'react-native';

type NetworkContextType = {
  isConnected: boolean;
  isPoorConnection: boolean;
};

export const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isPoorConnection: false,
});

 const NetworkProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isPoorConnection, setIsPoorConnection] = useState(false);
  const [showReconnectBanner, setShowReconnectBanner] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);

  const prevConnectionRef = useRef<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Recheck connection manually
  const checkNetworkManually = async () => {
    const state = await NetInfo.fetch();
    const currentConnected = state.isConnected ?? false;
    setIsConnected(currentConnected);
    if (!currentConnected) {
      showPersistentAlert(); // show again if still offline
    }
  };

  // Persistent alert logic
  const showPersistentAlert = () => {
    if (alertVisible) return; // prevent stacking alerts
    setAlertVisible(true);

    Alert.alert(
      'Network Issue',
      'No internet connection. Please check your network.',
      [
        {
          text: 'Retry',
          onPress: async () => {
            setAlertVisible(false);
            await checkNetworkManually();
          },
        },
      ],
      {cancelable: false},
    );
  };

  const dismissAlertIfNeeded = () => {
    if (alertVisible) {
      // Dismiss Alert (since RN’s Alert API doesn’t have dismiss method)
      // We emulate dismissal by resetting flag — no new alert will show.
      setAlertVisible(false);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const currentConnected = state.isConnected ?? false;
      const poor =
        state.details &&
        'downlink' in state.details &&
        ((state.details.downlink as number) || 0) < 0.05; // <0.05 Mbps = poor

      setIsConnected(currentConnected);
      setIsPoorConnection(!!poor);

      // Skip initial mount
      if (prevConnectionRef.current === null) {
        prevConnectionRef.current = currentConnected;
        return;
      }

      // Lost connection
      if (!currentConnected && prevConnectionRef.current === true) {
        showPersistentAlert();
      }

      // Regained connection
      if (currentConnected && prevConnectionRef.current === false) {
        dismissAlertIfNeeded();
        setShowReconnectBanner(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowReconnectBanner(false));
          }, 2000);
        });
      }

      prevConnectionRef.current = currentConnected;
    });

    return () => unsubscribe();
  }, []);

  // If the network stays down, keep re-checking periodically
  useEffect(() => {
    let retryInterval: NodeJS.Timeout | null = null;
    if (!isConnected) {
      retryInterval = setInterval(() => {
        checkNetworkManually();
      }, 5000);
    } else if (retryInterval) {
      clearInterval(retryInterval);
    }

    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [isConnected]);

  return (
    <NetworkContext.Provider value={{isConnected, isPoorConnection}}>
      {children}

      {/* Optional visual reconnect banner */}
      {showReconnectBanner && (
        <Animated.View
          style={[
            styles.banner,
            {backgroundColor: 'rgba(0, 180, 0, 0.9)', opacity: fadeAnim},
          ]}>
          <Text style={styles.text}>Back Online</Text>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
};

export default NetworkProvider;

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 8,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});