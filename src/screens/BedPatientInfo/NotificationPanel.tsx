import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NotificationPanel = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.alertTime}>Oxygen saturation is dropping - 9:30 AM</Text>
      <Text style={styles.alertMessage}>Please connect supplement oxygen</Text>
      <Text style={styles.spo2Label}>SpO₂ %</Text>
      <Text style={styles.spo2Value}>70</Text>
      <View style={styles.actions}>
        <Text style={styles.link}>Send to doctor</Text>
        <Text style={styles.link}>Delegate</Text>
        <Text style={styles.link}>Handled</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    flex: 2,
  },
  alertTime: {
    color: 'red',
    fontSize: 16,
    marginBottom: 4,
  },
  alertMessage: {
    color: 'red',
    fontSize: 14,
    marginBottom: 12,
  },
  spo2Label: {
    fontSize: 14,
    marginTop: 8,
  },
  spo2Value: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  link: {
    color: 'red',
    textDecorationLine: 'underline',
  },
});

export default NotificationPanel;
