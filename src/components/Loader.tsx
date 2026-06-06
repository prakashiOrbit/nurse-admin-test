import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fontScale } from '../utils/scaling';

type LoaderProps = {
  visible: boolean;
  text?: string;
};

const Loader: React.FC<LoaderProps> = ({
  visible,
  text = 'Please wait…',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#4CAE51" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  text: {
    marginTop: 12,
    color: '#fff',
    fontSize: fontScale(14),
  },
});
