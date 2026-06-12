import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { getPatientInstructions } from '../../services/bedService';
// import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { RFValue } from 'react-native-responsive-fontsize';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { useTranslation } from 'react-i18next';
import { scale, verticalScale } from 'react-native-size-matters';
const InstructionsVector = require('../../../assets/icons/instruction.png');

type PatientInstructionsProps = {
  patientCode: string;
};

const PatientInstructions: React.FC<PatientInstructionsProps> = ({
  patientCode,
}) => {
  type Instruction = {
    instructionId: string;
    message: string;
    createdTime: string;
  };

  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const instructionStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14, 812) : RFValue(12, 812),
      color: '#111',
    }),
    [isTablet],
  );

  const createdTimeStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(12, 812) : RFValue(10, 812),
      color: '#666',
    }),
    [isTablet],
  );

  const bulletStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(16, 812) : RFValue(14, 812),
      marginRight: 6,
      color: '#333',
    }),
    [isTablet],
  );

  const emptyStyle = useMemo(
    () => ({
      color: '#777',
      marginTop: 10,
      fontSize: isTablet? RFValue(12): RFValue(10)
    }),
    [isTablet],
  );

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchInstructions = async () => {
      try {
        const data = await getPatientInstructions(patientCode);
        // sort newest first
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdTime).getTime() -
            new Date(a.createdTime).getTime(),
        );
        setInstructions(sorted);
        setError(null);
      } catch (err: any) {
        setError(t('patient_instructions.no_found'));
      } finally {
      }
    };

    if (patientCode) {
      fetchInstructions();
      intervalId = setInterval(fetchInstructions, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [patientCode]);

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!instructions.length) {
    return <Text style={emptyStyle}>{t('patient_instructions.no_available')}</Text>;
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.heading}>
        <Image source={InstructionsVector} style={[styles.actionIcon]} />
        <Text style={styles.header}>Instructions</Text>
      </View> */}

      <FlatList
        data={instructions}
        keyExtractor={item => item.instructionId}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.instructionRow}>
            <Text style={bulletStyle}>•</Text>
            <View style={styles.instructionContent}>
              <Text style={instructionStyle}>{item.message}</Text>
              {item.createdTime && (
                <Text style={createdTimeStyle}>
                  {new Date(item.createdTime).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default PatientInstructions;

const styles = StyleSheet.create({
  container: { marginTop: 2, paddingHorizontal: 2, marginLeft: 2 },
  // header: {
  //   fontSize: fontScale(16),
  //   fontWeight: '600',
  //   color: '#4CAE51',
  //   marginBottom: 10,
  //   paddingLeft: 6,
  // },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  // bullet: { fontSize: fontScale(14), marginRight: 6, color: '#333' },
  // instruction: { fontSize: fontScale(12), color: '#111' },
  instructionContent: {
    width: '100%',
  },
  error: { color: 'red', marginTop: 10 },
  empty: { color: '#777', marginTop: 10 },
  card: {
    padding: 12,
    margin: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    elevation: 2,
  },
  // message: {
  //   fontSize: fontScale(16),
  //   color: '#333',
  // },
  actionIcon: {
    width: scale(24),
    height: verticalScale(24),
    marginBottom: 8,
    resizeMode: 'contain',
    tintColor: '#4CAE51',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 2,
  },
  createdTime: {
    fontSize: RFValue(10, 812),
    color: '#666',
    // marginLeft: scale(2),
  },
});
