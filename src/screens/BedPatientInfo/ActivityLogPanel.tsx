import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ActivityLogPanel = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity Log</Text>
      <Text style={styles.item}>- BP measured 118/75 (10:25:10)</Text>
      <Text style={styles.item}>- Given Injection A (09:35:17)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 8,
  },
  item: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default ActivityLogPanel;
