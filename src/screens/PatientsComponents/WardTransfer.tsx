import React, { useState, useRef, useEffect } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, Animated , Alert} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getAllWards } from '../../services/nurseService';
import { getAllEmptyBeds, wardtransfer, dischargePatient } from '../../services/bedService';
import Toast from 'react-native-toast-message';
import { startMonitoring, stopMonitoring, checkMonitoring, getAssignedDevicesAPI } from '../../services/deviceService';
import { fontScale, scale, verticalScale } from "../../utils/scaling";

type WardTransferProps = {
    assignedDevices: any[];
    selectedDevices: string[];
    setSelectedDevices: React.Dispatch<React.SetStateAction<string[]>>;
    patientCode: string;
    currentBedCode: string;
}

const WardTransfer: React.FC<WardTransferProps> = ({
  assignedDevices,
  selectedDevices,
  setSelectedDevices,
  patientCode,
  currentBedCode
}) => {
  const [selectedTab, setSelectedTab] = useState<"WardTransfer" | "Discharge">(
    "WardTransfer"
  );
  const [patientMonitoring, setPatientMonitoring] = useState(true);
  const [ventilator, setVentilator] = useState(true);

  const [targetWard, setTargetWard] = useState<string | null>(null);
  const [targetBed, setTargetBed] = useState<string | null>(null);

  const [wards, setWards] = useState<string[]>([]);
  const [beds, setBeds] = useState<string[]>([]);

  const [selectedWard, setSelectedWard] = useState<string>(""); 
  const [selectedBed, setSelectedBed] = useState<string>("");   
  const [deviceMonitoringStatus, setDeviceMonitoringStatus] = useState<{ [key: string]: boolean }>({});

  const scrollY = useRef(new Animated.Value(0)).current;
    const [scrollHeight, setScrollHeight] = useState(1);
    const [contentHeight, setContentHeight] = useState(1);
  
    const indicatorSize = (scrollHeight / contentHeight) * scrollHeight;
    const scrollableContentHeight = contentHeight - scrollHeight;
    const thumbScrollRange = scrollHeight - indicatorSize;
  
    const translateY = scrollY.interpolate({
      inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
      outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
      extrapolate: 'clamp',
    });

  const handleProceed = async () => {
    try {
        if (selectedDevices.length > 0) {
        Alert.alert("Monitoring Active", "Please stop monitoring of all devices before transferring.");
        return;
      }
      if (selectedTab === "WardTransfer") {
        if (!selectedWard || !selectedBed) {
          Alert.alert("Error", "Please select both Ward and Bed");
          return;
        }

        const payload = {
          currentBedCode: currentBedCode,
          bedCode: selectedBed,
          patientCode: patientCode,
        };

        const res = await wardtransfer(payload);
        Alert.alert("Success", "Patient transferred successfully!");
        console.log("Ward transfer success:", res);

      } else if (selectedTab === "Discharge") {
        // placeholder discharge API (you’ll replace later)
        const res = await dischargePatient({ patientCode, currentBedCode });
        Alert.alert("Success", "Patient discharged successfully!");
        console.log("Discharge success:", res);
      }
    } catch (err: any) {
      console.error("Error on proceed:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };


  useEffect(() => {
  const fetchData = async () => {
    try {
      const allWards = await getAllWards();
      if (allWards && allWards.length > 0) {
        setWards(allWards);
      } else {
        console.error("No wards data returned from API");
        setWards([]); // clear if empty
      }
    } catch (err) {
      console.error("Error fetching wards:", err); 
      setWards([]);
    }

    
  };

  fetchData();
}, []);

useEffect(() => {
  if (selectedWard) {
    fetchAllEmptyBeds();   // will fetch beds for that ward
    setSelectedBed("");    // reset bed selection whenever ward changes
  } else {
    setBeds([]);           // clear beds if no ward selected
  }
}, [selectedWard]);

useEffect(() => {
  if (!currentBedCode || !patientCode) return;

  const fetchMonitoringStatus = async () => {
    try {
      const deviceCodes = await getAssignedDevicesAPI(currentBedCode);
      if (!deviceCodes || deviceCodes.length === 0) {
        setDeviceMonitoringStatus({});
        return;
      }

      const statusMap: { [key: string]: boolean } = {};

      for (const deviceCode of deviceCodes) {
        const response = await checkMonitoring( deviceCode, patientCode );
        statusMap[deviceCode] = response === "START"; // backend sends "START"
      }

      setDeviceMonitoringStatus(statusMap);
    } catch (error) {
      //console.error("Error checking monitoring:", error);
      setDeviceMonitoringStatus({});
    }
  };

  fetchMonitoringStatus();
  const interval = setInterval(fetchMonitoringStatus, 5000); // refresh every 5 sec
  return () => clearInterval(interval);
}, [currentBedCode, patientCode]);

  const fetchAllEmptyBeds = async () => {
    try {
      const allEmptyBeds = await getAllEmptyBeds(selectedWard);
      if (allEmptyBeds && allEmptyBeds.length > 0) {
        setBeds(allEmptyBeds);
      } else {
        //console.error("No beds data returned from API");
        setBeds([]);
      }
    } catch (err) {
      //console.error("Error fetching beds:", err);
      setBeds([]);
    }
  }

  const handleStartMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };
    try {
      const response = await startMonitoring(data);
      Toast.show({
        text1: 'Start Monitoring Success',
        text2: JSON.stringify(response),
        type: 'success',
      });
      Alert.alert('Monitoring Started', `Device ${deviceCode} is now being monitored.`);
    } catch (error) {
      console.error('Error starting monitoring:', error);
      Toast.show({
        text1: 'Start Monitoring Failed',
        text2: JSON.stringify(error),
        type: 'error',
      });
      Alert.alert('Error', `Failed to start monitoring for device ${deviceCode}.`);
    }
  };
  
  const handleStopMonitoring = async (deviceCode: string) => {
    const data = { deviceCode };
    try {
      const response = await stopMonitoring(data);
      Toast.show({
        text1: 'Stop Monitoring Success',
        text2: JSON.stringify(response),
        type: 'success',
      });
      Alert.alert('Monitoring Stopped', `Device ${deviceCode} monitoring has been stopped.`);
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      Toast.show({
        text1: 'Stop Monitoring Failed',
        text2: JSON.stringify(error),
        type: 'error',
      });
      Alert.alert('Error', `Failed to stop monitoring for device ${deviceCode}.`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "WardTransfer" && styles.activeTab,
          ]}
          onPress={() => setSelectedTab("WardTransfer")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "WardTransfer" && styles.activeTabText,
            ]}
          >
            Ward Transfer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "Discharge" && styles.activeTab,
          ]}
          onPress={() => setSelectedTab("Discharge")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "Discharge" && styles.activeTabText,
            ]}
          >
            Send to Discharge
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.deviceParent}>
        <View style={styles.deviceLeft}>
          <Text style={styles.sectionTitle}>Stop Assigned Devices:</Text>
          <View style={styles.deviceListWrapper}>
                        <Animated.ScrollView
                          style={styles.scrollArea}
                          showsVerticalScrollIndicator={false}
                          scrollEventThrottle={16}
                          onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false },
                          )}
                          onLayout={e => setScrollHeight(e.nativeEvent.layout.height)}
                          onContentSizeChange={(w, h) => setContentHeight(h)}
                          contentContainerStyle={{ paddingBottom: 10 }}
                        >
                          {assignedDevices.length > 0 ? (
                            <View style={styles.deviceSection}>
                              <View>
                                {assignedDevices.map((device, index) => {
                                  const isSelected = selectedDevices.includes(device.deviceCode);
                                  return (
                                    <View key={index} style={styles.deviceRow}>
                                      <Text style={styles.deviceText}>{device.deviceCode}</Text>
                                      <Switch
                                        style={styles.switchButton}
                                        trackColor={{false: '#7C7C7C', true: '#4CAF50'}}
                                        thumbColor={'#ffffff'}
                                        ios_backgroundColor="#7C7C7C" 
                                        value={deviceMonitoringStatus[device.deviceCode] || false}
                                        onValueChange={async newValue => {
                                          if (newValue) {
                                            await handleStartMonitoring(device.deviceCode);
                                            setDeviceMonitoringStatus(prev => ({
                                              ...prev,
                                              [device.deviceCode]: true,
                                              }));
                                          } else {
                                            await handleStopMonitoring(device.deviceCode);
                                            setDeviceMonitoringStatus(prev => ({
                                            ...prev,
                                            [device.deviceCode]: false,
                                            }));
                                          }
                                        }}
                                      />
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          ) : (
                            <Text>No devices assigned to this patient</Text>
                          )}
                        </Animated.ScrollView>
          
                        {contentHeight > scrollHeight && (
                          <View style={styles.scrollBarTrack}>
                            <Animated.View
                              style={[
                                styles.scrollBarThumb,
                                { height: indicatorSize, transform: [{ translateY }] },
                              ]}
                            />
                          </View>
                        )}
                      </View>
        </View>
        {selectedTab === "WardTransfer" ? (
          <View style={styles.deviceRight}>
            <Text style={styles.sectionTitle}>Transfer To:</Text>

            {/* Ward Picker */}
            <View style={styles.row}>
              <Text style={styles.label}>Target Ward:</Text>
              <View style={styles.dropdown}>
                <Picker
                  style={styles.picker}
                  selectedValue={selectedWard}
                  onValueChange={(itemValue) => setSelectedWard(itemValue)}
                >
                  <Picker.Item label="Select" value="" style={styles.pickerItem} />
                  {wards.map((ward: any) => (
                    <Picker.Item
                      key={ward.wardCode}
                      label={ward.wardCode}
                      value={ward.wardCode}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Bed Picker */}
            <View style={styles.row}>
              <Text style={styles.label}>Target Bed:</Text>
              <View style={styles.dropdown}>
              <Picker
                style={styles.picker}
                selectedValue={selectedBed}
                onValueChange={(itemValue) => setSelectedBed(itemValue)}
              >
                <Picker.Item label="Select" value="" style={styles.pickerItem} />
                {beds.map((bed: any) => (
                  <Picker.Item
                    key={bed.bedCode}
                    label={bed.bedCode}
                    value={bed.bedCode}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
              </View>
            </View>
          </View>
        ) : (<View style={[styles.deviceRight, { opacity: 0 }]} />)}

        
      </View>
        <View style={styles.btncontainer}>
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
            <Text style={styles.text}>Proceed</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#4CAF50",
  },
  tabText: {
    fontSize: fontScale(14),
    color: "#444",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
   deviceParent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    // flex: 1,
    marginTop: 4,
  },
  deviceLeft: { 
    justifyContent: 'flex-start', 
    alignItems: 'flex-start', 
    flex: 1, 
    height:verticalScale(100),
    paddingRight:4
    // backgroundColor: '#755353ff',
  },
  deviceRight: { 
    justifyContent: 'flex-start', 
    alignItems: 'flex-start', 
    flex: 1,
    paddingLeft:4
    // backgroundColor: '#4b1010ff',
  },

  deviceListWrapper: { flex: 1, flexDirection: 'row', width: '100%' },
  scrollArea: { flex: 1 },
  scrollBarTrack: { width: 4, backgroundColor: '#e0e0e0', borderRadius: 3, marginLeft: 6 },
  scrollBarThumb: { width: 4, backgroundColor: '#4CAE51', borderRadius: 3 },
  deviceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#a3a3a3ff',
    borderRadius: 6,
    padding: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    width: '100%',
  },
  deviceText: { fontSize: fontScale(12), flex: 1 },
switchButton: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }], // slightly bigger, but keeps thumb inside
    marginVertical: 5,
    marginHorizontal: 10,
  },
  selectParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // flex: 1,
    marginTop: 4,
  },
  sectionTitle: {
  fontSize: fontScale(14),
  marginBottom: 4,
  fontWeight: "bold",
},

row: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 2,
},

label: {
  fontSize: fontScale(12),
  marginRight: 8,
  width: scale(90),   
},


dropdown: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  backgroundColor: '#fff',
  paddingHorizontal: 4,
  justifyContent: 'center',
  height: verticalScale(45),  
},

picker: {
  flex: 1,
},

pickerItem: {
  fontSize: fontScale(10),
},
 proceedBtn: {
    backgroundColor: "#28a745",   // Green
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    flexDirection: "row",         
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",                
    fontSize: fontScale(14),
    fontWeight: "500",
  },
  arrow: {
    color: "#fff",                
    fontSize: fontScale(16),
    marginLeft: 4,  
    lineHeight: 20,  
  },

  btncontainer:{
    width: "100%",               
    alignItems: "flex-end", 
  }
});

export default WardTransfer;
