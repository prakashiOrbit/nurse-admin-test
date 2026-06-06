import React from 'react';
import {View, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {scale, verticalScale} from '../../../utils/scaling';
import {RFValue} from 'react-native-responsive-fontsize';

type Props = {
  label: string;
  value: string;
  unit: string;
  color: string;
  highlight?: boolean;
  meanValue?: string;
  cardStyle?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
  unitStyle?: TextStyle;
};

const VitalCard: React.FC<Props> = ({
  label,
  value,
  unit,
  color,
  highlight,
  meanValue,
  cardStyle,
  labelStyle,
  valueStyle,
  unitStyle,
}) => {
  return (
    <View
      style={[
        styles.card,
        highlight && {borderColor: '#4CAF50', borderWidth: 1},
        cardStyle,
      ]}>
      <View style={styles.topRow}>
        <Text style={[styles.label, labelStyle]}>{label}</Text>
        <Text style={[styles.unit, unitStyle]}>{unit}</Text>
      </View>

      <Text style={[styles.value, {color}, valueStyle]}>{value}</Text>

      {meanValue && (
        <Text style={[styles.meanValue, {color}, valueStyle]}>{meanValue}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: scale(97),
    height: verticalScale(83),
    backgroundColor: '#ffffff',
    borderRadius: scale(8),
    padding: scale(6),
    marginBottom: verticalScale(7),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(4),
  },
  label: {
    fontSize: RFValue(11),
    fontWeight: '600',
    color: '#333',
  },
  unit: {
    fontSize: RFValue(11),
    fontWeight: '600',
    color: '#000000',
  },
  value: {
    paddingTop: verticalScale(4),
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  meanValue: {
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: verticalScale(2),
  },
});

export default VitalCard;
