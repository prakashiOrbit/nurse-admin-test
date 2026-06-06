// BedPatientInfoCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InstructionsPanel from './InstructionsPanel';
import NotificationPanel from './NotificationPanel';
import ActivityLogPanel from './ActivityLogPanel';
import ActionButton from './ActionButton';
import { useRoute } from '@react-navigation/native';


type BedPatientInfoCardRouteParams = {
  bedCode?: string;
  patientCode?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  birthDate?: string;
  bedStatus?: string;
  orgName?: string;
  auditMe?: { createdtime?: string };
  // Add more fields as needed
};

const BedPatientInfoCard = () => {
  const route = useRoute();
  // Destructure the params from navigation
  const {
    bedCode,
    patientCode,
    firstName,
    lastName,
    age,
    birthDate,
    bedStatus,
    orgName,
    auditMe,
    // Add more fields as needed
  } = (route.params as BedPatientInfoCardRouteParams) || {};

  let admissionDate = '-';
  if (auditMe && auditMe.createdtime) {
    const dateObj = new Date(auditMe.createdtime);
    admissionDate = dateObj.toLocaleDateString(); // e.g. "7/3/2025"
    // Or use: dateObj.toISOString().slice(0, 10) for "YYYY-MM-DD"
  }

  const instructions = [
    'Start IV antibiotics at 9 AM',
    'Monitor vitals every 15 minutes for 1 hour',
    'Keep NPO until further notice',
  ];

  const activityLogs = [
    { time: '10:25:10', text: 'BP measured 118/75' },
    { time: '09:35:17', text: 'Given Injection A' },
  ];

  const notification = {
    text: 'Oxygen saturation is dropping - 9:30 AM\nPlease connect supplement oxygen',
    spo2: 70,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.bedCode}>
          {bedCode ? bedCode.match(/B\d+$/)?.[0] || bedCode : '-'}
        </Text>        
        <Text style={styles.patientName}>
          {firstName || ''} {lastName || ''}
        </Text>
        <Text style={styles.patientCode}>{patientCode || '-'}</Text>
        <Text style={styles.age}>Age: {age || '-'}</Text>
      </View>
      <Text style={styles.admissionDate}>Admission date: {admissionDate}</Text>
    </View>


      <View style={styles.mainContent}>
        {/* <InstructionsPanel instructions={instructions} />
        <NotificationPanel text={notification.text} spo2={notification.spo2} />
        <ActivityLogPanel logs={activityLogs} /> */}
        <InstructionsPanel  />
        <NotificationPanel  />
        <ActivityLogPanel />
      </View>

      <View style={styles.footer}>
        <ActionButton label="Ward Transfer" onPress={() => { /* handle ward transfer */ }} />
        <ActionButton label="Instructions" onPress={() => { /* handle instructions */ }} />
        <ActionButton label="Monitoring Screen" onPress={() => { /* handle monitoring screen */ }} />
      </View>
    </View>
  );
};

export default BedPatientInfoCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7f7f7',
  },
  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  paddingVertical: 8,
  paddingHorizontal: 12,
  backgroundColor: '#f4fff4',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e0e0e0',
  marginBottom: 2,
},
headerLeft: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8, // Optional, fallback below if RN version doesn't support gap
},
  bedCode: { fontSize: 24, fontWeight: 'bold', color: '#2ecc71' },
  patientName: { fontSize: 16, fontWeight: '600' },
  patientCode: { fontSize: 16, color: '#666' },
  age: { fontSize: 16 },
  admissionDate: { fontSize: 16, textAlign: 'right' },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    width: '100%',
    gap: 8,
  },
});
