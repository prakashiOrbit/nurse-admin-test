import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale } from '../../../utils/scaling';
import { verticalScale } from 'react-native-size-matters';

const BottomControls = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Monitoring Screen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary}>
        <Text style={styles.buttonTextSecondary}>Instructions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: verticalScale(2),
    marginBottom: verticalScale(5),
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BottomControls;
