import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationCallOutModal from '../../components/CallOutModal/NotificationCallOutModal';
import { getBedPatientInfo } from '../../services/nurseService';
import { getRaisedAlarm } from '../../services/alarmService';
import Toast from 'react-native-toast-message';
import { Icons } from '../../../assets';
import { AlarmConfirmModal } from '../../components/CallOutModal/AlarmConfirmModal';
import { AlarmDetailFullDTO } from '../../types/Types';
import { AlarmInputModal } from '../../components/CallOutModal/AlarmInputModal';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { scale, verticalScale } from 'react-native-size-matters';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';

const MIN_WIDTH = 100;
const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_WIDTH = SCREEN_WIDTH * 0.22;
const DEFAULT_WIDTH = SCREEN_WIDTH * 0.22;

const formatRaisedTime = (ms: number): string => {
  // console.log('Raised Time', ms);
  if (!ms) return '';
  const date = new Date(ms);
  // console.log('Parsed Raised Time:', date);
  const finalDate = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // console.log('Formatted Raised Time:', finalDate);
  return finalDate;
};

export const Notification = forwardRef(
  ({ sessionReady }: { sessionReady: boolean }, ref) => {
    const { t } = useTranslation();
    const { isTablet, wp, hp } = useResponsive();

    const panelWidth = useRef(new Animated.Value(DEFAULT_WIDTH)).current;
    const [currentPanelWidth, setCurrentPanelWidth] = useState(DEFAULT_WIDTH);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showCallout, setShowCallout] = useState(false);
    const [bedPatientInfo, setBedPatientInfo] = useState<any>(null);
    const [raisedAlarms, setRaisedAlarms] = useState<any[]>([]);
    const isCompact = currentPanelWidth <= SCREEN_WIDTH * 0.15;
    const containerRef = useRef<View>(null);
    const [selectedCriticalPatient, setSelectedCriticalPatient] = useState<
      AlarmDetailFullDTO | undefined
    >(undefined);
    const [activeAlarm, setActiveAlarm] = useState<AlarmDetailFullDTO | null>(
      null,
    );
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [inputVisible, setInputVisible] = useState(false);
    const [selectedBedCode, setSelectedBedCode] = useState<string | null>(null);
    const [selectedParamKey, setSelectedParamKey] = useState<string | null>(
      null,
    );
    const [longPressMenuVisible, setLongPressMenuVisible] = useState(false);
    const [longPressPosition, setLongPressPosition] = useState({ x: 0, y: 0 });
    const [longPressAlarm, setLongPressAlarm] = useState(null);

    const fetchBedPatientInfo = async (bedCode: string, alarmId?: string) => {
      try {
        // DON'T open the modal yet — fetch first
        const bedPatientResponse = await getBedPatientInfo(bedCode);
        if (bedPatientResponse?.bedCode) {
          setBedPatientInfo(bedPatientResponse);
        }
      } catch (error) {
        // keep modal closed to avoid showing an empty modal
        setShowCallout(false);
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: t('notifications.not_found_msg'),
        });
      }
    };

    const getColorByPriority = (priority: number) => {
      switch (priority) {
        case 0:
          return '#ff0000'; // critical
        case 1:
          return '#ff0000'; // high
        case 2:
          return '#ffaa00'; // medium
        case 3:
          return '#00aaff'; // low
        default:
          return '#cccccc'; // default
      }
    };
    const openLongPressMenu = (event: any, alarm: any) => {
      const { pageX, pageY } = event.nativeEvent;

      setLongPressPosition({ x: pageX, y: pageY });
      setLongPressAlarm(alarm);
      setLongPressMenuVisible(true);
    };

    const getParameterKey = (violatedParameter?: string): string => {
      if (!violatedParameter) return '';
      const [key] = violatedParameter.split(':');
      return key.trim().toUpperCase();
    };

    const getParameterIcon = (
      key: string,
    ): React.FC<{
      width?: number;
      height?: number;
      fill?: string;
    }> => {
      switch (key) {
        case 'HR':
          return Icons.hr;
        case 'SPO2':
          return Icons.spo2;
        case 'RR':
          return Icons.rr;
        case 'TEMP':
          return Icons.temp;
        case 'TEMP_S':
          return Icons.temp;
        case 'NIBP_D':
          return Icons.nibp;
        case 'NIBP_S':
          return Icons.nibp;
        case 'NIBP_M':
          return Icons.nibp;
        default:
          return Icons.default; // fallback SVG
      }
    };

    useEffect(() => {
      const fetchNurseName = async () => {
        try {
          const fName = await AsyncStorage.getItem('firstName');
          const lName = await AsyncStorage.getItem('lastName');
          setFirstName(fName || '');
          setLastName(lName || '');
        } catch (error) {
          console.error('Error fetching nurse name from storage:', error);
        }
      };

      fetchNurseName();
    }, []);

    useEffect(() => {
      let intervalId: NodeJS.Timeout;
      if (!sessionReady) {
        setRaisedAlarms([]); // clear stale alarms immediately
        return;
      }

      const fetchRaisedAlarms = async () => {
        try {
          const response = await getRaisedAlarm();
          if (Array.isArray(response) && response.length > 0) {
            setRaisedAlarms(response);
          } else {
            setRaisedAlarms([]);
          }
        } catch (error) {
          setRaisedAlarms([]);
        }
      };

      fetchRaisedAlarms();

      intervalId = setInterval(() => {
        fetchRaisedAlarms();
      }, 5000);

      return () => {
        clearInterval(intervalId);
      };
    }, [sessionReady]);

    // Add this ref in Notification.tsx
    const lastKnownAlarmRef = useRef<AlarmDetailFullDTO | undefined>(undefined);

    const latestMatchingAlarm = useMemo(() => {
      if (!selectedCriticalPatient || !selectedBedCode || !selectedParamKey) {
        return selectedCriticalPatient;
      }

      const matches = raisedAlarms.filter(
        a =>
          a.bedCode === selectedBedCode &&
          a.patientCode === selectedCriticalPatient.patientCode &&
          getParameterKey(a.violatedParameter) === selectedParamKey,
      );

      if (matches.length === 0) {
        // ← NEVER return selectedCriticalPatient (the old tapped one)
        // Return the last known latest instead — holds position during empty polls
        return lastKnownAlarmRef.current ?? selectedCriticalPatient;
      }

      const match = matches.reduce((latest, current) =>
        current.raisedTime > latest.raisedTime ? current : latest,
      );

      const IconComponent = getParameterIcon(selectedParamKey);
      const priorityColor = getColorByPriority(match.priority);

      const enriched = {
        ...match,
        icon: IconComponent,
        iconColor: priorityColor,
      };

      // Always update the ref when we have a real match
      lastKnownAlarmRef.current = enriched;

      return enriched;
    }, [
      raisedAlarms,
      selectedBedCode,
      selectedParamKey,
      selectedCriticalPatient,
    ]);

    const togglePanel = () => {
      const newWidth =
        currentPanelWidth > MIN_WIDTH ? MIN_WIDTH : DEFAULT_WIDTH;

      Animated.timing(panelWidth, {
        toValue: newWidth,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setCurrentPanelWidth(newWidth);
      });
    };

    const expandPanel = () => {
      Animated.timing(panelWidth, {
        toValue: DEFAULT_WIDTH,
        duration: 200,
        useNativeDriver: false,
      }).start(() => {
        setCurrentPanelWidth(DEFAULT_WIDTH);
      });
    };

    // useImperativeHandle(ref, () => ({
    //   expandPanel,
    // }));

    const handleWithAction = (alarm: any) => {
      setActiveAlarm(alarm); // <-- this captures EXACT clicked card
      setInputVisible(true);
    };

    const handleWithoutAction = (alarm: any) => {
      setActiveAlarm(alarm); // <-- this captures EXACT clicked card
      setConfirmVisible(true);
    };

    useImperativeHandle(ref, () => ({
      expandPanel,
      getWidth: () => panelWidth,
    }));

    // useEffect(() => {
    //   if (!showCallout) return;
    //   if (!selectedCriticalPatient) return;

    //   const paramKey = getParameterKey(selectedCriticalPatient.violatedParameter);
    //   const bedCode = selectedCriticalPatient.bedCode;
    //   const patientCode = selectedCriticalPatient.patientCode;

    //   // Find latest alarm for same bed + same parameter
    //   const updated = raisedAlarms.find(
    //     a =>
    //       a.bedCode === bedCode &&
    //       a.patientCode === patientCode &&
    //       getParameterKey(a.violatedParameter) === paramKey,
    //   );

    //   if (updated) {
    //     // Attach icon + iconColor like earlier
    //     const IconComponent = getParameterIcon(paramKey);
    //     const priorityColor = getColorByPriority(updated.priority);
    //     setSelectedCriticalPatient({
    //       ...updated,
    //       icon: IconComponent,
    //       iconColor: priorityColor,
    //     });
    //   }
    // }, [raisedAlarms, showCallout]);

    const bedCodeStyle = useMemo(
      () => ({
        fontSize: isTablet ? RFValue(14, 812) : RFValue(13, 812),
        fontWeight: '600',
        flexWrap: 'wrap',
        width: '80%',
      }),
      [isTablet],
    );

    const nurseNameTitleStyle = useMemo(
      () => ({
        fontSize: isTablet ? RFValue(15, 812) : RFValue(13, 812),
        fontWeight: '700',
      }),
      [isTablet],
    );

    const nurseNameStyle = useMemo(
      () => ({
        fontSize: isTablet ? RFValue(15, 812) : RFValue(13, 812),
        fontWeight: '700',
        color: '#34a853',
      }),
      [isTablet],
    );

    const ignoreTextStyle = useMemo(
      () => ({
        color: '#000', // black text
        fontWeight: '500',
        fontSize: isTablet ? RFValue(12, 812) : RFValue(10, 812),
      }),
      [isTablet],
    );

    const handleTextStyle = useMemo(
      () => ({
        color: '#fff', // white text
        fontWeight: '500',
        fontSize: isTablet ? RFValue(12, 812) : RFValue(10, 812),
      }),
      [isTablet],
    );
    const notificationTimeStyle = useMemo(
      () => ({
        fontSize: isTablet ? RFValue(10, 812) : RFValue(8, 812),
        color: '#888',
        fontWeight: '400',
      }),
      [isTablet],
    );

    const homeButtonIndicatorStyle = useMemo(
      () => ({
        width: isTablet ? scale(40) : scale(30),
        height: isTablet ? 6 : 4,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
        transform: [{ rotate: '90deg' }],
        borderWidth: 0.5,
        borderColor: '#4CAF50',
        opacity: 0.8,
      }),
      [isTablet],
    );

    return (
      <Animated.View
        ref={containerRef}
        style={[
          styles.leftPanel,
          currentPanelWidth > MIN_WIDTH ? { width: panelWidth } : { width: 20 },
        ]}
      >
        {currentPanelWidth > SCREEN_WIDTH * 0.15 && (
          <Text style={styles.sectionTitle}>
            <Text style={nurseNameTitleStyle}>Nurse : </Text>
            <Text style={nurseNameStyle}>
              {firstName} {lastName}
            </Text>
          </Text>
        )}
        {currentPanelWidth > MIN_WIDTH && (
          <ScrollView
            style={styles.notificationScroll}
            contentContainerStyle={styles.notificationList}
          >
            {raisedAlarms.map((item, index) => {
              const paramKey = getParameterKey(item.violatedParameter);
              const IconComponent = getParameterIcon(paramKey);
              const priorityColor = getColorByPriority(item.priority);
              // console.log('Alarm id: ' + item.alarmId);
              // console.log('Alarm bedCode: ' + item.bedCode);
              // console.log('Alarm patientCode: ' + item.patientCode);
              const enrichedItem: AlarmDetailFullDTO = {
                ...item,
                icon: IconComponent,
                iconColor: priorityColor,
              };

              return (
                <Pressable
                  key={item.alarmId || index}
                  style={({ pressed }) => [
                    styles.notificationItem,
                    { borderLeftColor: priorityColor },
                    pressed && {
                      opacity: 0.5,
                      transform: [{ scale: 0.98 }],
                    },
                  ]}
                  // onPress={() => {
                  //   setSelectedCriticalPatient(enrichedItem);
                  //   fetchBedPatientInfo(item.bedCode, item.alarmId);
                  //   setShowCallout(true);
                  // }}
                  onPress={() => {
                    const paramKey = getParameterKey(item.violatedParameter);
                    setSelectedBedCode(item.bedCode);
                    setSelectedParamKey(paramKey);
                    setSelectedCriticalPatient(enrichedItem);
                    fetchBedPatientInfo(item.bedCode);
                    setShowCallout(true);
                  }}
                  onLongPress={e => openLongPressMenu(e, enrichedItem)}
                  delayLongPress={300}
                >
                  <View
                    style={[
                      styles.notificationContent,
                      isCompact && styles.notificationContentCompact,
                    ]}
                  >
                    {isCompact ? (
                      <>
                        <Text style={bedCodeStyle}>{item.bedCode || '-'}</Text>
                        <IconComponent
                          width={20}
                          height={20}
                          fill={priorityColor}
                        />
                      </>
                    ) : (
                      <>
                        <View style={styles.altIcon}>
                          <IconComponent
                            width={isTablet ? 34 : 24}
                            height={isTablet ? 34 : 24}
                            fill={priorityColor}
                          />
                        </View>
                        <View style={styles.textSection}>
                          <View style={styles.headerRow}>
                            <Text style={bedCodeStyle}>
                              {item.bedCode || '-'}
                            </Text>
                            {currentPanelWidth > SCREEN_WIDTH * 0.15 && (
                              <Text style={notificationTimeStyle}>
                                {formatRaisedTime(item.raisedTime || 0)}
                              </Text>
                            )}
                          </View>
                          <View style={styles.headerRow}>
                            {currentPanelWidth > SCREEN_WIDTH * 0.15 && (
                              <Text style={styles.notificationText}>
                                {item.summaryDescription
                                  ? item.summaryDescription
                                      .split(' ')
                                      .slice(0, 2)
                                      .join(' ') + '...'
                                  : ''}
                              </Text>
                            )}
                          </View>
                          <View style={styles.container}>
                            <Pressable
                              onPress={() => handleWithoutAction(enrichedItem)}
                              style={({ pressed }) => [
                                styles.ignoreButton,
                                { borderLeftColor: priorityColor },
                                pressed && {
                                  opacity: 0.5,
                                  transform: [{ scale: 0.98 }],
                                },
                              ]}
                            >
                              <Text style={ignoreTextStyle}>Ignore</Text>
                            </Pressable>

                            <Pressable
                              onPress={() => handleWithAction(enrichedItem)}
                              style={({ pressed }) => [
                                styles.handledButton,
                                { borderLeftColor: priorityColor },
                                pressed && {
                                  opacity: 0.5,
                                  transform: [{ scale: 0.98 }],
                                },
                              ]}
                            >
                              <Text style={handleTextStyle}>Handle</Text>
                            </Pressable>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <NotificationCallOutModal
          visible={showCallout}
          onClose={() => {
            setShowCallout(false);
            setSelectedBedCode(null);
            setSelectedParamKey(null);
            lastKnownAlarmRef.current = undefined;
          }}
          bedPatientInfo={bedPatientInfo}
          raisedAlarm={latestMatchingAlarm}
        />
        <AlarmConfirmModal
          visible={confirmVisible}
          onClose={() => setConfirmVisible(false)}
          alarmInfo={activeAlarm}
        />

        <AlarmInputModal
          visible={inputVisible}
          onClose={() => setInputVisible(false)}
          alarmInfo={activeAlarm}
        />
        {/* Drag Handle */}
        <TouchableOpacity style={styles.resizer} onPress={togglePanel}>
          <View style={homeButtonIndicatorStyle} />
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6, // spacing between buttons
    marginTop: 2,
  },
  ignoreButton: {
    backgroundColor: '#CAE7CB', // light green
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginTop: 2,
    paddingRight: 6,
    paddingLeft: 6,
  },
  handledButton: {
    backgroundColor: '#4CAF50', // dark green
    paddingVertical: 1,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginTop: 2,
    paddingRight: 4,
    paddingLeft: 4,
  },
  ignoreText: {
    color: '#000', // black text
    fontWeight: '500',
    fontSize: RFValue(10, 812),
  },
  handledText: {
    color: '#fff', // white text
    fontWeight: '500',
    fontSize: RFValue(10, 812),
  },
  leftPanel: {
    backgroundColor: '#fffefe',
    borderRightWidth: 1,
    borderColor: '#ddd',
    height: '100%',
    position: 'relative',
    zIndex: 10,
    borderTopRightRadius: 35,
    borderTopLeftRadius: 3,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    paddingRight: 10,
    //elevation: 0, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: scale(3), height: verticalScale(0) },
    shadowOpacity: 0.08,
    shadowRadius: 7.8,
  },
  sectionTitle: {
    fontSize: RFValue(16, 812),
    fontWeight: 'bold',
    color: '#000',
    margin: 10,
  },
  nurseNameTitle: {
    fontSize: RFValue(13, 812),
    fontWeight: '700',
  },
  nurseName: {
    fontSize: RFValue(13, 812),
    fontWeight: '700',
    color: '#34a853',
  },
  notificationScroll: {
    flex: 1,
    paddingHorizontal: 10,
  },
  notificationList: {
    paddingBottom: 20,
  },
  notificationItem: {
    marginTop: 5,
    backgroundColor: '#fff',
    padding: 10,
    // borderRadius: 3,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },

  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationContentCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  altIcon: {
    color: '#888',
    marginRight: 5,
    marginTop: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bedCode: {
    fontSize: RFValue(13, 812),
    fontWeight: '600',
    flexWrap: 'wrap',
    width: '80%',
  },
  notificationText: {
    fontSize: RFValue(12, 812),
    marginTop: 2,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: RFValue(8, 812),
    color: '#888',
    fontWeight: '400',
  },
  resizer: {
    width: scale(15),
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  homeButtonIndicator: {
    width: scale(30),
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    transform: [{ rotate: '90deg' }],
    borderWidth: 0.5,
    borderColor: '#4CAF50',
    opacity: 0.8,
  },
  longPressMenu: {
    position: 'absolute',
    width: 160,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 9999,
  },

  longPressButton: {
    paddingVertical: 6,
  },

  longPressButtonHandle: {
    paddingVertical: 6,
  },

  longPressText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },

  longPressTextHandle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconImage: {
    width: scale(20),
    height: scale(20),
    resizeMode: 'contain',
  },
});
