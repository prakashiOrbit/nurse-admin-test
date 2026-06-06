import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const ActionButton = ({ label, onPress }: { label: string; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  label: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ActionButton;
