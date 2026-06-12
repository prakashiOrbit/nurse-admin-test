import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Dimensions, Text} from 'react-native';
import VitalCard from './VitalCard';
import {scale, verticalScale} from 'react-native-size-matters';
import {getVitalRecordsAPI} from '../../../services/telemetryService';
import {formatDateWithOffset} from '../../../utils/dataformatter';
import {useTranslation} from 'react-i18next';

const {width: screenWidth} = Dimensions.get('window');

type VitalsPanelRightProps = {
  height?: number;
  bedCode: string;
  patientCode: string;
  patientId: string;
  source: 'ALARM' | 'DEFAULT';
  violatedParam?: string;
  metadata?: any[]; // Pass metadata from MonitoringScreen
  raisedTime?: number;
};

const VitalsPanelRight: React.FC<VitalsPanelRightProps> = ({
  height,
  patientCode,
  metadata,
  source,
  raisedTime,
}) => {
  const {t} = useTranslation();
  console.log("datatimestamp: "+raisedTime)
  const [vitals, setVitals] = useState({});

  useEffect(() => {
    if (!metadata?.length) return;

    const fetchVitals = async () => {
      const vitalsObj = {};

      for (const device of metadata) {
        if (!device.deviceCode) continue;

        const deviceCode = device.deviceCode;

        for (const param of device.relatedParams) {
          if (param.typeOfDisplay !== 'value') continue;

          // -----------------------
          // COMPOSITE PARAM (NIBP)
          // -----------------------
          if (param.subParams?.length > 0) {
            for (const sub of param.subParams) {
              const payload = {
                patientCode,
                deviceCode,
                vitalParams: [sub], // <--- FIXED: send subparam ONLY
              };

              if (source === 'ALARM' && raisedTime) {
                // const ts = Number(raisedTime);
                const ts = raisedTime;
                const alarmDate = new Date(ts);

                payload.endTime = formatDateWithOffset(alarmDate);
                payload.startTime = formatDateWithOffset(
                  new Date(alarmDate.getTime() - 15 * 60 * 1000),
                );
              }

              let data = [];
              try {
                data = await getVitalRecordsAPI(payload);
              } catch {}

              const item = data.find(v => v.vitalName === sub);

              if (item?.dataPoints?.length) {
                vitalsObj[sub] = item.dataPoints.at(-1)?.value ?? '--';
              } else {
                vitalsObj[sub] = '--';
              }
            }

            continue;
          }

          // -----------------------
          // SIMPLE PARAM
          // -----------------------
          const code = param.paramCode;

          const payload = {
            patientCode,
            deviceCode,
            vitalParams: [code],
          };

          if (source === 'ALARM' && raisedTime) {
            const ts = Number(raisedTime);
            const alarmDate = new Date(ts);

            payload.endTime = formatDateWithOffset(alarmDate);
            payload.startTime = formatDateWithOffset(
              new Date(alarmDate.getTime() - 15 * 60 * 1000),
            );
          }

          let data = [];
          try {
            data = await getVitalRecordsAPI(payload);
          } catch {}

          const item = data.find(v => v.vitalName === code);

          if (item?.dataPoints?.length) {
            vitalsObj[code] = item.dataPoints.at(-1)?.value ?? '--';
          } else {
            vitalsObj[code] = '--';
          }
        }
      }

      setVitals(vitalsObj);
    };

    fetchVitals();
    const interval = setInterval(fetchVitals, 5000);
    return () => clearInterval(interval);
  }, [metadata, source, raisedTime]);

  return (
    <View style={[styles.rowContainer, height ? {height} : null]}>
      <View style={styles.container}>
        {metadata?.length ? (
          metadata.flatMap(device =>
            device.relatedParams
              .filter(p => p.typeOfDisplay === 'value')
              .map(p => {
                if (p.subParams?.length > 0) {
                  const [s, d, m] = p.subParams;
                  return (
                    <VitalCard
                      key={p.paramCode}
                      label={p.paramName}
                      value={`${vitals[s] || '--'} / ${vitals[d] || '--'}\n(${
                        vitals[m] || '--'
                      })`}
                      color={p.properties?.color || '#4A90E2'}
                      unit={p.unit}
                      highlight
                    />
                  );
                }

                const code = p.paramCode;
                console.log('Code: ', code);

                return (
                  <VitalCard
                    key={code}
                    label={p.paramName}
                    value={vitals[code] || '--'}
                    color={p.properties?.color || '#4A90E2'}
                    unit={p.unit}
                    highlight
                  />
                );
              }),
          )
        ) : (
          <View style={styles.errorContainer}>
            <Text>{t('monitoring.no_vital_parameters')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    marginHorizontal: scale(4),
    marginTop: verticalScale(4),
    maxWidth: screenWidth,
  },
  container: {
    paddingVertical: verticalScale(2),
    width: scale(80),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: verticalScale(4),
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VitalsPanelRight;
 