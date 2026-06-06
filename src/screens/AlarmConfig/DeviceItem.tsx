import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import { RFValue } from 'react-native-responsive-fontsize';
import LeftArrow from '../../../assets/SVGIcons/LeftArrow';
import RightArrow from '../../../assets/SVGIcons/RightArrow';
import EditAlarm from '../../../assets/SVGIcons/EditAlarm';

type DeviceItemProps = {
  device: any;
  isMonitoring: boolean;
  params: any[];
  currentIndex: number;
  onStart: (deviceCode: string) => void;
  onStop: (deviceCode: string) => void;
  onPrev: (deviceCode: string, index: number) => void;
  onNext: (deviceCode: string, index: number, length: number) => void;
  onEdit: (deviceCode: string, index: number) => void;
  isTablet: boolean;
};

const DeviceItemComponent = (props: DeviceItemProps) => {
  const {
    device,
    isMonitoring,
    params,
    currentIndex,
    onStart,
    onStop,
    onPrev,
    onNext,
    onEdit,
    isTablet,
  } = props;

  const visibleParams = params.slice(currentIndex, currentIndex + 3);
  const paramsLength = params.length;

  return (
    <View style={styles.deviceContainer}>
      <Text style={styles.deviceTitle}>
        {device.deviceName || device.deviceCode}
      </Text>

      <View style={styles.paramContainer}>
        <TouchableOpacity
          onPress={() => onPrev(device.deviceCode, currentIndex)}
          style={styles.editAlarmButton}
        >
          <LeftArrow width={scale(isTablet ? 10 : 16)} height={scale(isTablet ? 10 : 16)} fill="#000" />
        </TouchableOpacity>

        <View style={styles.visibleParamsContainer}>
          {visibleParams.map((param, pIndex) => (
            <View key={pIndex} style={styles.paramChip}>
              <Text>{param.paramName}</Text>
              <Text> H {param.high}</Text>
              <Text> L {param.low}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => onNext(device.deviceCode, currentIndex, paramsLength)}
          style={styles.editAlarmButton}
        >
          <RightArrow width={scale(isTablet ? 10 : 16)} height={scale(isTablet ? 10 : 16)} fill="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onEdit(device.deviceCode, currentIndex)}
          style={styles.editAlarmButton}
        >
          <EditAlarm width={scale(isTablet ? 12 : 14)} height={scale(isTablet ? 12 : 14)} fill="#4CAF50" />
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.startButton, isMonitoring && styles.startedButton]}
          onPress={() =>
            isMonitoring
              ? onStop(device.deviceCode)
              : onStart(device.deviceCode)
          }
        >
          <Text style={{ color: '#fff' }}>
            {isMonitoring ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const DeviceItem = React.memo(DeviceItemComponent);


export const styles = StyleSheet.create({
  deviceContainer: {
    flexDirection: 'column', // ← column so title is above paramContainer
    backgroundColor: '#FFFFFF',
    borderRadius: scale(2),
    padding: scale(8),
    marginVertical: verticalScale(2),
    marginHorizontal: scale(2),
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
  },

  deviceTitle: {
    fontSize: RFValue(13, 812),
    fontWeight: '600',
    marginBottom: verticalScale(5),
    marginLeft: scale(4),
    textAlign: 'left',
  },
  paramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // works now because deviceContainer is column
  },

  visibleParamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    flexShrink: 1,
  },
paramChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: scale(2),
    paddingVertical: verticalScale(3),
    paddingHorizontal: scale(6),
  },

  editAlarmButton: {
    marginHorizontal: scale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },

  spacer: {
    flex: 1,
  },

  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(6),
    borderRadius: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(60),
  },

  startedButton: {
    backgroundColor: '#fc2020',
    borderWidth: 1,
    borderColor: '#fcfcfc',
  },
});