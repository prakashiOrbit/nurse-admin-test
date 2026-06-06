// import React, {useState, useEffect} from 'react';
// import {
//   Modal,
//   View,
//   StyleSheet,
//   Text,
//   Pressable,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
// } from 'react-native';
// // import {Icons} from '../../assets';
// // import InstructionsModal from '../instructions/InstructionsModal';
// import {AlarmDetailFullDTO, VitalDataPoint} from '../../types/Types';
// import {
//   getAlarmDetailByIdAPI,
//   getVitalsAPI,
// } from '../../services/nurseService';
// import { VitalsLineChart } from '../VitalsLineChart';
// import {scale, verticalScale} from '../../utils/scaling';
// import {RFValue} from 'react-native-responsive-fontsize';
// import {NavigationProp, useNavigation} from '@react-navigation/native';
// // import MonitoringScreen from '../monitoring/MonitoringScreen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const MonitoringVector = require('../../../assets/icons/monitoring.png');
// const InstructionsVector = require('../../../assets/icons/instruction.png');

// interface Props {
//   visible: boolean;
//   onClose: () => void;
//   data?: AlarmDetailFullDTO;
// }

// const AlarmDetailsModal: React.FC<Props> = ({visible, onClose, data}) => {
//   const [showInstructions, setShowInstructions] = useState(false);

//   const [loading, setLoading] = useState(false);
//   const [fullData, setFullData] = useState<AlarmDetailFullDTO | undefined>(
//     undefined,
//   );

//   const [vitalsData, setVitalsData] = useState<VitalDataPoint[]>([]);
//   const [vitalsLoading, setVitalsLoading] = useState(false);

//   const [monitoringVisible, setMonitoringVisible] = useState(false);

//   const handleGoToMonitoring = () => {
//     setMonitoringVisible(true);
//   };

//   // fetch alarm details
//   useEffect(() => {
//     if (!data) return;
//     let intervalId: ReturnType<typeof setInterval>;
//     if (data) {
//       const fetchDetails = async () => {
//         try {
//           const response = await getAlarmDetailByIdAPI(
//             data.alarmId,
//             data.bedCode,
//           );
//           console.log('Response from details:::', response);

//           const merged: AlarmDetailFullDTO = {
//             ...data, // base summary
//             ...response, // override/extend with backend details
//             // violatedParameter: data.violatedParameter,
//             violatedParameter: response.violatedParameter,
//           };

//           setFullData(merged);
//           setLoading(false);
//         } catch (err) {
//           console.error('Error fetching alarm detail:', err);
//           setLoading(false);
//         }
//       };

//       fetchDetails();

//       intervalId = setInterval(fetchDetails, 3000);
//       return () => clearInterval(intervalId);
//     }
//   }, [data]);

//   useEffect(() => {
//     const fetchVitals = async () => {
//       if (!data) return;

//       const vitalName = getParameterParts(fullData.violatedParameter).key;

//       if (
//         data.patientId &&
//         data.deviceId &&
//         data.windowStartTime &&
//         data.windowEndTime &&
//         vitalName &&
//         vitalName !== '-'
//       ) {
//         try {
//           setVitalsLoading(true);

//           const response = await getVitalsAPI({
//             patientId: data.patientId,
//             deviceId: data.deviceId,
//             startTimeMs: data.windowStartTime,
//             endTimeMs: data.windowEndTime || Date.now(),
//             vitalName,
//           });

//           const formatted = response.map((v: any) => ({
//             time: new Date(v.timestamp).toISOString(),
//             value: v.value,
//           }));

//           console.log('Vital Data:: ', formatted);
//           setVitalsData(formatted);
//         } catch (error) {
//           console.error('Failed to fetch vitals data:', error);
//         } finally {
//           setVitalsLoading(false);
//         }
//       }
//     };

//     fetchVitals();
//   }, [data?.alarmId]); // only run when modal opens for a new alarm

//   if (!data) {
//     return (
//       <Modal
//         visible={visible}
//         transparent
//         animationType="fade"
//         onRequestClose={onClose}>
//         <View style={styles.overlay}>
//           <Pressable style={styles.backdrop} onPress={onClose} />
//           <View style={styles.card}>
//             <Text style={styles.errorText}>No alarm information available</Text>
//           </View>
//         </View>
//       </Modal>
//     );
//   }

//   const panelWidth = scale(300);
//   const gap = scale(10);

//   const name = fullData?.patientName || '-';
//   const gender = fullData?.gender?.[0] || '-';
//   const age = fullData?.dob;
//   const bedCode = fullData?.bedCode ?? '';
//   const alarmTime = fullData?.raisedTime;
//   const wardName = fullData?.wardName;

//   const Icon = fullData?.icon;
//   const color = fullData?.iconColor || '#000';

//   const alarmSummary = fullData?.detailedDescription;
//   const raisedTime = fullData?.raisedTime;

//   const violatedParameter = fullData?.violatedParameter;

//   const wardCode = fullData?.wardCode;

//   const getParameterParts = (param?: string): {key: string; value: string} => {
//     if (!param) return {key: '-', value: '-'};
//     const [rawKey, rawValue] = param.split(':');
//     return {
//       key: rawKey?.trim() ?? '-',
//       value: rawValue?.trim() ?? '-', // this will be the number like 90
//     };
//   };

//   const {key: vitalName, value: vitalValue} =
//     getParameterParts(fullData?.violatedParameter);

//   const formatRaisedTime = (ms: number): string => {
//     if (!ms) return '';
//     const date = new Date(ms);
//     return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       statusBarTranslucent
//       animationType="fade"
//       onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <Pressable
//           style={styles.backdrop}
//           onPress={() => {
//             if (!showInstructions) onClose();
//           }}
//         />
//         <View
//           style={[
//             styles.panelContainer,
//             {width: showInstructions ? panelWidth * 2 + gap : panelWidth},
//           ]}>
//           <View style={styles.modalWrapper}>
//             <View
//               style={[
//                 styles.card,
//                 {marginRight: showInstructions ? panelWidth + gap : 0},
//               ]}>
//               <View style={styles.container}>
//                 {/* Header */}
//                 <View style={styles.header}>
//                   <View style={styles.leftHeader}>
//                     <Text style={styles.name}>{name}</Text>
//                     <Text style={styles.gender}>
//                       {gender}, Age:{age}
//                     </Text>
//                   </View>
//                   <View style={styles.rightHeader}>
//                     <View style={styles.headerBedInfo}>
//                       <Text style={styles.bedCode}>
//                         {/* {bedCode.match(/B\d+$/)?.[0] || bedCode}, */}
//                         {bedCode}
//                       </Text>
//                       <Text style={styles.wardName}>{wardName}</Text>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Content */}
//                 <View style={styles.content}>
//                   <View style={styles.leftPanel}>
//                     {/* <View style={styles.diagnosis}></View> */}
//                     <View style={styles.alarmInfo}>
//                       <View style={styles.alarmInfoLeft}>
//                         <View
//                           style={[styles.iconView, {backgroundColor: color}]}>
//                           {Icon && <Icon width={30} height={30} fill="#fff" />}
//                         </View>
//                         <Text style={styles.summaryText}>{alarmSummary}</Text>
//                       </View>
//                       <Text style={styles.raisedTime}>
//                         {formatRaisedTime(raisedTime)}
//                       </Text>
//                     </View>
//                     <View style={styles.alarmData}>
//                       <View style={styles.alarmChart}>
//                         {vitalsLoading ? (
//                           <ActivityIndicator size="small" color="#4a90e2" />
//                         ) : vitalsData.length > 0 ? (
//                           <VitalsLineChart data={vitalsData} />
//                         ) : (
//                           <Text>No data available</Text>
//                         )}
//                       </View>
//                       <View style={styles.alarmParam}>
//                         <Text style={styles.param}>{vitalValue || '-'} </Text>
//                         <Text>bpm</Text>
//                       </View>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Buttons */}
//                 <View style={styles.buttonRow}>
//                   <ActionButton
//                     icon={MonitoringVector}
//                     onPress={ async () => {
//                       await AsyncStorage.setItem('wardCode', wardCode);
//                       handleGoToMonitoring()
//                     }
//                     }
//                     isActive={false}
//                   />
//                   <ActionButton
//                     icon={InstructionsVector}
//                     onPress={() => setShowInstructions(true)}
//                     isActive={showInstructions}
//                   />
//                 </View>
//               </View>
//             </View>
//           </View>
//         </View>

//         {/* <InstructionsModal
//           visible={showInstructions}
//           onClose={() => setShowInstructions(false)}
//           patientCode={fullData?.patientCode ?? data?.patientCode}
//           customCardStyle={{marginLeft: panelWidth + gap}}
//         /> */}

//         {/* <MonitoringScreen
//           visible={monitoringVisible}
//           onClose={() => setMonitoringVisible(false)}
//           bedCode={bedCode}
//         /> */}
//       </View>
//     </Modal>
//   );
// };

// const ActionButton = ({
//   icon,
//   onPress,
//   isActive,
// }: {
//   icon: any;
//   onPress: () => void;
//   isActive: boolean;
// }) => (
//   <TouchableOpacity
//     style={[
//       styles.actionButton,
//       {backgroundColor: isActive ? '#4a90e2' : '#c9def6'},
//     ]}
//     onPress={onPress}>
//     <Image
//       source={icon}
//       style={[styles.actionIcon, {tintColor: isActive ? '#fff' : '#000000'}]}
//     />
//   </TouchableOpacity>
// );

// export default AlarmDetailsModal;

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   backdrop: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   panelContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalWrapper: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     // marginRight: scale(22),
//   },
//   card: {
//     width: scale(300),
//     height: verticalScale(285),
//     backgroundColor: '#fff',
//     borderRadius: scale(6),
//     padding: scale(14),
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: verticalScale(4)},
//     shadowOpacity: 0.15,
//     shadowRadius: scale(6),
//     overflow: 'hidden',
//   },
//   container: {
//     flex: 1,
//     flexDirection: 'column',
//     paddingLeft: 2,
//   },
//   header: {
//     height: verticalScale(30),
//     marginTop: verticalScale(1),
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   leftHeader: {
//     width: '50%',
//     flexDirection: 'column',
//     justifyContent: 'space-evenly',
//     gap: scale(4),
//     flexShrink: 1,
//   },
//   rightHeader: {
//     width: '50%',
//     flexDirection: 'column',
//     justifyContent: 'space-evenly',
//     alignItems: 'flex-end',
//     marginRight: scale(8),
//     marginTop: verticalScale(2),
//     gap: scale(4),
//     flexShrink: 1,
//   },
//   headerBedInfo: {
//     flexDirection: 'column',
//     justifyContent: 'center',
//     // alignItems: 'center',
//   },
//   bedCode: {
//     fontSize: RFValue(13, 812),
//     fontWeight: 'bold',
//     color: '#000000',
//     marginRight: scale(6),
//   },
//   name: {
//     fontSize: RFValue(13, 812),
//     fontWeight: '600',
//     marginRight: scale(6),
//     color: '#4a90e2',
//     // flexWrap: 'wrap',
//   },
//   gender: {
//     fontSize: RFValue(12, 812),
//     fontWeight: 'bold',
//     color: '#666',
//   },
//   wardName: {
//     fontSize: RFValue(13, 812),
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   errorText: {
//     fontSize: RFValue(13, 812),
//     color: '#ff4444',
//     textAlign: 'center',
//     marginVertical: verticalScale(20),
//   },
//   admissionView: {
//     marginTop: 25,
//   },
//   admissionText: {
//     fontSize: 12,
//     color: '#000000',
//   },
//   content: {
//     flex: 1,
//     // marginTop: 15,
//   },
//   leftPanel: {
//     flex: 1,
//   },
//   alarmInfo: {
//     marginTop: verticalScale(28),
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   alarmInfoLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flexShrink: 1,
//     gap: scale(10),
//     backgroundColor: '#1111',
//     padding: scale(6),
//     borderRadius: scale(4),
//   },
//   summaryText: {
//     fontSize: RFValue(12, 812),
//     fontWeight: '500',
//     color: '#000000',
//     flexShrink: 1,
//     flexWrap: 'wrap',
//   },
//   iconView: {
//     width: scale(40),
//     height: verticalScale(40),
//     borderRadius: scale(20),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   raisedTime: {
//     paddingLeft: scale(6),
//     fontSize: RFValue(12, 812),
//     fontWeight: '800',
//   },
//   alarmData: {
//     height: verticalScale(70),
//     width: '100%',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-evenly',
//     marginTop: verticalScale(3),
//     overflow: 'hidden',
//   },
//   alarmChart: {
//     height: '100%',
//     width: '67%',
//     backgroundColor: '#1111',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginLeft: scale(-50),
//   },
//   alarmParam: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//     paddingLeft: scale(40),
//   },
//   param: {
//     fontSize: RFValue(24, 812),
//     fontWeight: '900',
//   },
//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: verticalScale(10),
//     justifyContent: 'center',
//     gap: scale(12),
//   },
//   actionButton: {
//     width: '48%',
//     height: verticalScale(40),
//     borderRadius: scale(3),
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   actionIcon: {
//     width: scale(26),
//     height: verticalScale(23),
//     resizeMode: 'contain',
//   },
// });
