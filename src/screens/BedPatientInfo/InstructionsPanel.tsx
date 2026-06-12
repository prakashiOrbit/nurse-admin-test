import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const InstructionsPanel = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('bed_patient_info.instructions_title')}</Text>
      <Text style={styles.item}>- Start IV antibiotics at 9 AM</Text>
      <Text style={styles.item}>- Monitor vitals every 15 minutes for 1 hour</Text>
      <Text style={styles.item}>- Keep NPO until further notice</Text>
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

export default InstructionsPanel;
