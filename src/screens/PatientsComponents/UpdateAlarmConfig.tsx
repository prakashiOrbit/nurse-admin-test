import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { patientDefaultConfig, updatePatientConfig } from '../../services/deviceService';
import Toast from 'react-native-toast-message';
import { getSharedStyles } from '../../styles/sharedStyles';
import { useResponsive } from '../../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import { scale } from 'react-native-size-matters';
import ConfirmCancelAlarmConfig from '../AlarmConfig/ConfirmCancelAlarmConfig';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width } = Dimensions.get('window');

const ACTIVE_GREEN = '#4CAF50';
const VALUE_BOX_GREEN = '#D8EDD2';
const ITEM_HEIGHT = 27;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PICKER_PADDING = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;
const PICKER_VALUES = Array.from({ length: 401 }, (_, index) => index);
const WINDOW_SIZE = 10;

type UpdateAlarmData = {
  deviceCode: string;
  deviceType: string;
  paramName: string;
  patientConfig: Record<string, string>;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (payload: Record<string, string>, data: UpdateAlarmData) => void;
  data: UpdateAlarmData | null;
};

type ParamTabProps = {
  isActive: boolean;
  label: string;
  param: string;
  onPressTab: (param: string) => void;
  showDivider: boolean;
};

// Pass these as props to WheelPicker
type WheelPickerProps = {
  configKey: string;
  label: string;
  onChangeValue: (configKey: string, nextValue: number) => void;
  value: number;
  minValue: number; // ← add
  maxValue: number; // ← add
};

const getDisplayLabel = (param: string) => param;

const extractParams = (config: Record<string, string>) => {
   if (!config || typeof config !== 'object') {
    return [];
  }
  const params: string[] = [];
  const seen = new Set<string>();

  Object.keys(config).forEach(key => {
    const match = key.match(/^(.*)_(High|Low)_Value$/);
    if (!match) return;

    const param = match[1];
    if (!seen.has(param)) {
      seen.add(param);
      params.push(param);
    }
  });

  return params;
};

const getNumericValue = (config: Record<string, string>, key: string) => {
  const parsedValue = Number(config[key]);
  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(PICKER_VALUES[PICKER_VALUES.length - 1], parsedValue),
  );
};

const ParamTab = React.memo(
  ({ isActive, label, onPressTab, param, showDivider }: ParamTabProps) => {
    const handlePress = React.useCallback(() => {
      onPressTab(param);
    }, [onPressTab, param]);

    const { isTablet } = useResponsive();
    const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

    const tabTextActiveStyle = useMemo(
      () => ({
        fontSize: isTablet ? RFValue(12) : RFValue(10),
        color: '#111111',
        fontWeight: '700',
      }),
      [isTablet],
    );

    const tabTextStyle = useMemo(
      () => ({
        fontSize: isTablet ? RFValue(12) : RFValue(10),
        color: '#1B1B1B',
        fontWeight: '500',
      }),
      [isTablet],
    );

    const tabDividerStyle = useMemo(
      () => ({
        marginHorizontal: isTablet ? 10 : 8,
        fontSize: isTablet ? RFValue(18) : RFValue(16),
        lineHeight: scale(18),
        color: '#2C2C2C',
        fontWeight: '400',
      }),
      [isTablet],
    );

    return (
      <View style={styles.tabItem}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          style={isActive ? styles.tabButtonActive : styles.tabButton}
        >
          <Text style={isActive ? tabTextActiveStyle : tabTextStyle}>
            {label}
          </Text>
        </TouchableOpacity>

        {showDivider ? <Text style={tabDividerStyle}>|</Text> : null}
      </View>
    );
  },
);

ParamTab.displayName = 'ParamTab';

const WheelPicker = React.memo(
  ({
    configKey,
    label,
    onChangeValue,
    value,
    minValue,
    maxValue,
  }: WheelPickerProps) => {
    const scrollRef = React.useRef<ScrollView>(null);
    const isScrolling = React.useRef(false);
    const pickerValues = React.useMemo(
      () =>
        Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i),
      [minValue, maxValue],
    );

    const [windowStart, setWindowStart] = React.useState(() =>
      Math.max(0, value - minValue - WINDOW_SIZE),
    );
    const { isTablet } = useResponsive();
    const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

    // Expand window as user scrolls near edges
    const expandWindowIfNeeded = React.useCallback(
      (centerIndex: number) => {
        setWindowStart(prev => {
          const newStart = Math.max(0, centerIndex - WINDOW_SIZE);
          const newEnd = Math.min(
            pickerValues.length - 1, // ← fixed
            centerIndex + WINDOW_SIZE,
          );
          const prevEnd = prev + WINDOW_SIZE * 2;
          if (newStart < prev || newEnd > prevEnd) {
            return newStart;
          }
          return prev;
        });
      },
      [pickerValues],
    );

    const commitFromOffset = React.useCallback(
      (offsetY: number) => {
        isScrolling.current = false;
        const index = Math.max(
          0,
          Math.min(pickerValues.length - 1, Math.round(offsetY / ITEM_HEIGHT)),
        );
        expandWindowIfNeeded(index);
        const nextValue = pickerValues[index]; // already correct since array starts at minValue
        onChangeValue(configKey, nextValue);
        if (nextValue === value) {
          scrollRef.current?.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: true,
          });
        }
      },
      [configKey, onChangeValue, value, pickerValues, expandWindowIfNeeded],
    );

    const handleScrollBegin = React.useCallback(() => {
      isScrolling.current = true;
    }, []);

    const handleScroll = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        const centerIndex = Math.round(offsetY / ITEM_HEIGHT);
        expandWindowIfNeeded(centerIndex);
      },
      [expandWindowIfNeeded],
    );

    const handleMomentumEnd = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        commitFromOffset(e.nativeEvent.contentOffset.y);
      },
      [commitFromOffset],
    );

    const handleScrollEndDrag = React.useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!e.nativeEvent.velocity?.y) {
          commitFromOffset(e.nativeEvent.contentOffset.y);
        }
      },
      [commitFromOffset],
    );

    const wheelItemSelectedStyle = useMemo(
      () => ({
        fontSize: RFValue(12), // ← selected value: medium, bold
        color: '#000000',
        fontWeight: '800',
      }),
      [isTablet],
    );

    const wheelItemTextStyle = useMemo(
      () => ({
        fontSize: RFValue(11), // ← small ghost numbers
        color: '#D0D0D0',
        fontWeight: '500',
      }),
      [isTablet],
    );

    const wheelItemNearStyle = useMemo(
      () => ({
        fontSize: RFValue(11.5), // 1 away: slightly bigger
        color: '#acacac',
        fontWeight: '600',
      }),
      [isTablet],
    );

    const wheelItemFarStyle = useMemo(
      () => ({
        fontSize: RFValue(10), // 2 away: smallest
        color: '#c9c9c9',
        fontWeight: '500',
      }),
      [isTablet],
    );

    React.useEffect(() => {
      if (isScrolling.current) return;
      const index = value - minValue; // ← offset from minValue, not 0
      expandWindowIfNeeded(index);
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: false,
        });
      }, 0);
      return () => clearTimeout(timer);
    }, [value, minValue, expandWindowIfNeeded]);

    const windowEnd = Math.min(
      pickerValues.length - 1,
      windowStart + WINDOW_SIZE * 2,
    );
    const visibleItems = pickerValues.slice(windowStart, windowEnd + 1);
    const topSpacer = windowStart * ITEM_HEIGHT;
    const bottomSpacer = (pickerValues.length - 1 - windowEnd) * ITEM_HEIGHT;

    return (
      <View style={styles.pickerColumn}>
        <Text style={styles.pickerLabel}>{label} -</Text>
        <View style={styles.wheelWrapper}>
          <ScrollView
            ref={scrollRef}
            bounces={false}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            onScrollBeginDrag={handleScrollBegin}
            onMomentumScrollBegin={handleScrollBegin}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollEndDrag={handleScrollEndDrag}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            snapToAlignment="start"
            style={styles.wheelScroll}
            contentContainerStyle={styles.wheelContent}
          >
            {/* Spacer for items before window */}
            <View style={{ height: topSpacer }} />

            {visibleItems.map(item => {
              const distance = Math.abs(item - value);
              const isSelected = item === value;
              const isNear = distance === 1;
              const isFar = distance === 2;

              return (
                <View key={item} style={styles.wheelItem}>
                  <Text
                    style={[
                      wheelItemTextStyle, // replaces styles.wheelItemText
                      isSelected && wheelItemSelectedStyle, // replaces styles.wheelItemSelected
                      isNear && wheelItemNearStyle, // replaces styles.wheelItemNear
                      isFar && wheelItemFarStyle, // replaces styles.wheelItemFar
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              );
            })}

            {/* Spacer for items after window */}
            <View style={{ height: bottomSpacer }} />
          </ScrollView>

          <View pointerEvents="none" style={styles.selectionOverlay} />
          <View pointerEvents="none" style={styles.fadeTop} />
          <View pointerEvents="none" style={styles.fadeBottom} />
        </View>
      </View>
    );
  },
);

WheelPicker.displayName = 'WheelPicker';

type RouteProps = RouteProp<RootStackParamList, 'UpdateAlarmConfig'>;

const UpdateAlarmConfig: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const handleClose = () => navigation.goBack();
  const [isReady, setIsReady] = React.useState(false);
  const { deviceCode, deviceType, paramName, patientConfig, patientId, callerScreen } =
    route.params;



  // const opacity = useRef(new Animated.Value(0)).current;
  const originalConfigRef = React.useRef<Record<string, string>>({});
  const data = { deviceCode, deviceType, paramName, patientConfig };

  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

   const cardStyle = useMemo(
    () => ({
      width: isTablet ? Math.min(width - 36, 800) : Math.min(width - 36, 606),
      paddingTop: scale(14),
      paddingBottom: scale(12),
      paddingHorizontal: scale(18),
      borderRadius: scale(4),
      backgroundColor: '#FFFFFF',
    }),
    [isTablet],
  );

    const hasValidConfig =
  patientConfig &&
  typeof patientConfig === 'object' &&
  Object.keys(patientConfig).length > 0 &&
  extractParams(patientConfig).length > 0;

if (!hasValidConfig) {
  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={cardStyle}>
        <View
          style={{
            height: PICKER_HEIGHT + 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: RFValue(14),
              color: '#555555',
              fontWeight: '600',
            }}
          >
            Data Not Available
          </Text>
        </View>
      </View>
    </View>
  );
}

  const allParams = React.useMemo(
    () => extractParams(patientConfig),
    [patientConfig],
  );
  const [selectedParam, setSelectedParam] = React.useState('');
  const [editedConfig, setEditedConfig] = React.useState<
    Record<string, string>
  >({});
  const defaultConfigRef = React.useRef<Record<string, string>>({});
  const [defaultConfig, setDefaultConfig] = React.useState<
    Record<string, string>
  >({});
  const [isResetting, setIsResetting] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [confirmVariant, setConfirmVariant] = React.useState<
    'update' | 'cancel' | null
  >(null);
   
  React.useEffect(() => {
    console.log('editedConfig updated:', JSON.stringify(editedConfig, null, 2));
  }, [editedConfig]);

  // React.useEffect(() => {
  //   originalConfigRef.current = data.patientConfig;
  //   setEditedConfig(data.patientConfig);
  //   setSelectedParam(data.paramName || allParams[0] || '');
  // },[]);

  const handleSelectParam = React.useCallback((param: string) => {
    setSelectedParam(param);
  }, []);

  //   useEffect(() => {
  //   if (visible) {
  //     setIsReady(false);

  //     requestAnimationFrame(() => {
  //       setIsReady(true);
  //     });
  //   } else {
  //     setIsReady(false);
  //   }
  // }, [visible]);

  // useEffect(() => {
  //   opacity.setValue(0);
  //   Animated.timing(opacity, {
  //     toValue: 1,
  //     duration: 150,
  //     useNativeDriver: true,
  //   }).start();
  // }, []); // animate in once on mount

  React.useEffect(() => {
    originalConfigRef.current = data.patientConfig;
    setEditedConfig(data.patientConfig);
    setSelectedParam(data.paramName || allParams[0] || '');

    // Fetch default config for this deviceType
    patientDefaultConfig(data.deviceType)
      .then(response => {
        defaultConfigRef.current = response;
        setDefaultConfig(response);
      })
      .catch(err => {
        console.log('Failed to fetch default config:', err);
      })
      .finally(() => {
        setIsReady(true); // ← mark ready after API resolves (or fails)
      });
  }, []);

  const handleChangeValue = React.useCallback(
    (configKey: string, nextValue: number) => {
      const normalizedValue = String(nextValue);

      setEditedConfig(prev => {
        if (prev[configKey] === normalizedValue) {
          return prev;
        }
        return { ...prev, [configKey]: normalizedValue };
      });
    },
    [],
  );

  const handleReset = React.useCallback(async () => {
    if (isResetting) return;

    const defaults = defaultConfigRef.current;
    if (!defaults || Object.keys(defaults).length === 0) {
      // fallback: defaults not loaded yet, try fetching now
      if (!deviceType) return;
      try {
        setIsResetting(true);
        const response = await patientDefaultConfig(deviceType);
        defaultConfigRef.current = response;
        applyDefaultForParam(response, selectedParam);
      } catch (err) {
        console.log('Reset failed to fetch defaults:', err);
      } finally {
        setIsResetting(false);
      }
      return;
    }

    applyDefaultForParam(defaults, selectedParam);
  }, [isResetting, deviceType, selectedParam]);

  // Extracts high/low keys for selectedParam and applies from defaults
  const applyDefaultForParam = React.useCallback(
    (defaults: Record<string, string>, param: string) => {
      const highKey = `${param}_High_Value`;
      const lowKey = `${param}_Low_Value`;

      setEditedConfig(prev => {
        const next = { ...prev };
        if (defaults[highKey] !== undefined) next[highKey] = defaults[highKey];
        if (defaults[lowKey] !== undefined) next[lowKey] = defaults[lowKey];
        return next;
      });
    },
    [],
  );

  const handleCancel = React.useCallback(() => {
    setEditedConfig(originalConfigRef.current); // restore original
    setSelectedParam(data?.paramName || allParams[0] || '');
    navigation.goBack();
  }, [allParams, paramName, navigation]);

  //   const handleReset = React.useCallback(() => {
  //     setEditedConfig(originalConfigRef.current);
  //     setSelectedParam(data?.paramName || allParams[0] || '');
  //   }, [allParams, data?.paramName]);

  const handleUpdate = React.useCallback(async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      const payload = {
        ...editedConfig, // ← spread flat, no wrapper key
      };
      const response = await updatePatientConfig(patientId, data.deviceType, payload);
      console.log('updatePatientConfig response:', response);
      if (response?.patientId) {
        Toast.show({
          type: 'success',
          text1: 'Patient config updated successfully',
        });
      }
      navigation.goBack();
    } catch (error) {
      console.log('Failed to update patient config:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [editedConfig, isUpdating, deviceCode, callerScreen, navigation]);

  const highKey = React.useMemo(
    () => `${selectedParam}_High_Value`,
    [selectedParam],
  );
  const lowKey = React.useMemo(
    () => `${selectedParam}_Low_Value`,
    [selectedParam],
  );
  const highValue = React.useMemo(
    () => getNumericValue(editedConfig, highKey),
    [editedConfig, highKey],
  );
  const lowValue = React.useMemo(
    () => getNumericValue(editedConfig, lowKey),
    [editedConfig, lowKey],
  );


  const closeButtonStyle = useMemo(
    () => ({
      width: isTablet ? 32 : 28,
      height: isTablet ? 32 : 28,
      marginLeft: scale(12),
      borderRadius: scale(14),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
    }),
    [isTablet],
  );

  const closeTextStyle = useMemo(
    () => ({
      fontSize: RFValue(isTablet ? 24 : 20),
      lineHeight: isTablet ? 24 : 20,
      color: '#2E2E2E',
      fontWeight: '400',
    }),
    [isTablet],
  );

  const getLimit = (
    config: Record<string, string>,
    key: string,
    fallback: number,
  ) => {
    const v = parseFloat(config[key]);
    return Number.isFinite(v) ? Math.round(v) : fallback;
  };

  return (
    <View style={styles.overlay}>
      {/* Backdrop — absolute, behind card, handles dismiss on tap outside */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Card — sibling of backdrop, centered by overlay's flexbox */}
      <View style={cardStyle}>
        {!isReady ? (
          // Loader — shown while default config is loading
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={ACTIVE_GREEN} />
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <ScrollView
                horizontal
                alwaysBounceHorizontal={false}
                contentContainerStyle={styles.tabsContent}
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
              >
                {allParams.map((param, index) => (
                  <ParamTab
                    key={param}
                    isActive={selectedParam === param}
                    label={getDisplayLabel(param)}
                    param={param}
                    onPressTab={handleSelectParam}
                    showDivider={index < allParams.length - 1}
                  />
                ))}
              </ScrollView>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                style={closeButtonStyle}
              >
                <Text style={closeTextStyle}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <WheelPicker
                configKey={highKey}
                label="High"
                onChangeValue={handleChangeValue}
                value={highValue}
                minValue={lowValue + 1}
                maxValue={getLimit(
                  defaultConfig,
                  `${selectedParam}_Max_Value`,
                  400,
                )}
              />
              <WheelPicker
                configKey={lowKey}
                label="Low"
                onChangeValue={handleChangeValue}
                value={lowValue}
                minValue={getLimit(
                  patientConfig,
                  `${selectedParam}_Min_Value`,
                  0,
                )}
                maxValue={highValue - 1}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReset}
                disabled={isResetting}
              >
                <Text style={styles.resetText}>
                  {isResetting ? 'Resetting...' : 'Reset to Default'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footerActions}>
                {/* Cancel now restores to original patientConfig */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setConfirmVariant('cancel')}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setConfirmVariant('update')}
                  disabled={isUpdating}
                  style={[
                    styles.updateButton,
                    isUpdating && styles.updateButtonDisabled,
                  ]}
                >
                  <Text style={styles.updateButtonText}>
                    {isUpdating ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ConfirmCancelAlarmConfig
              visible={confirmVariant !== null}
              variant={confirmVariant ?? 'update'}
              onConfirm={() => {
                setConfirmVariant(null);
                if (confirmVariant === 'update') handleUpdate();
                else handleCancel(); // your existing discard logic
              }}
              onDismiss={() => setConfirmVariant(null)}
            />
          </>
        )}
      </View>
    </View>
  );
};

export default UpdateAlarmConfig;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  loaderContainer: {
    height: PICKER_HEIGHT + 120, // matches roughly the card's content height
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: Math.min(width - 36, 606),
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  tabsContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },

  tabsContent: {
    alignItems: 'center',
    paddingRight: 6,
  },

  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabButton: {
    paddingTop: 8,
    paddingBottom: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },

  tabButtonActive: {
    paddingTop: 8,
    paddingBottom: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 3,
    borderBottomColor: ACTIVE_GREEN,
  },

  tabText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#1B1B1B',
    fontWeight: '500',
  },

  tabTextActive: {
    fontSize: 14,
    lineHeight: 18,
    color: '#111111',
    fontWeight: '700',
  },

  tabDivider: {
    marginHorizontal: 10,
    fontSize: RFValue(18),
    lineHeight: 18,
    color: '#2C2C2C',
    fontWeight: '400',
  },

  closeButton: {
    width: 28,
    height: 28,
    marginLeft: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },

  closeText: {
    fontSize: 24,
    lineHeight: 24,
    color: '#2E2E2E',
    fontWeight: '400',
  },

  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 56,
    paddingBottom: 6,
  },

  pickerColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    // overflow: 'hidden',
  },

  pickerLabel: {
    marginRight: 14,
    fontSize: RFValue(12),
    color: '#1C1C1C',
    fontWeight: '400',
  },

  //   wheelWrapper: {
  //     width: 58,
  //     height: PICKER_HEIGHT,
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //   },

  wheelList: {
    width: '100%',
    height: PICKER_HEIGHT,
  },

  //   wheelContent: {
  //     paddingVertical: PICKER_PADDING,
  //   },

  //   wheelItem: {
  //     height: ITEM_HEIGHT,
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //   },

  wheelValueText: {
    fontSize: 28,
    lineHeight: 32,
    color: '#BDBDBD',
    fontWeight: '600',
  },

  wheelValueHidden: {
    fontSize: 28,
    lineHeight: 32,
    color: 'transparent',
    fontWeight: '600',
  },

  //   selectionOverlay: {
  //     position: 'absolute',
  //     alignSelf: 'center',
  //   },

  //   valueBox: {
  //     minWidth: 38,
  //     paddingVertical: 6,
  //     paddingHorizontal: 8,
  //     borderRadius: 3,
  //     alignItems: 'center',
  //     backgroundColor: VALUE_BOX_GREEN,
  //   },

  //   valueText: {
  //     fontSize: 15,
  //     lineHeight: 18,
  //     color: '#111111',
  //     fontWeight: '700',
  //   },
  valueText: {
    fontSize: 15,
    lineHeight: ITEM_HEIGHT,
    color: '#111111',
    fontWeight: '700',
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },

  resetText: {
    fontSize: RFValue(12),
    color: '#0E0E0E',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cancelText: {
    marginRight: 20,
    fontSize: RFValue(12),
    color: '#111111',
    fontWeight: '400',
  },

  updateButton: {
    minWidth: 76,
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACTIVE_GREEN,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },

  updateButtonText: {
    fontSize: RFValue(12),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Replace the relevant styles:
  wheelWrapper: {
    width: 80,
    height: PICKER_HEIGHT,
    // overflow: 'hidden',
  },

  wheelScroll: {
    height: PICKER_HEIGHT,
    width: 80,
  },

  wheelContent: {
    paddingTop: PICKER_PADDING,
    paddingBottom: PICKER_PADDING,
  },

  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  wheelItemHighlight: {
    backgroundColor: VALUE_BOX_GREEN,
    borderRadius: 3,
    width: '100%',
  },

  wheelItemText: {
    fontSize: RFValue(13), // ← small ghost numbers
    color: '#D0D0D0',
    fontWeight: '500',
    // backgroundColor: '#4CAF50',
  },

  wheelItemSelected: {
    fontSize: RFValue(16), // ← selected value: medium, bold
    color: '#000000',
    fontWeight: '800',
    // opacity: 0, // hide the text — valueBox label shows it instead
  },

  wheelItemNear: {
    fontSize: RFValue(14), // 1 away: slightly bigger
    color: '#acacac',
    fontWeight: '600',
  },

  wheelItemFar: {
    fontSize: RFValue(12), // 2 away: smallest
    color: '#c9c9c9',
    fontWeight: '500',
  },

  selectionOverlay: {
    position: 'absolute',
    top: PICKER_PADDING,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 3,
    backgroundColor: 'rgba(216, 237, 210, 0.45)', // semi-transparent green
    //   borderWidth: 1.5,
    //   borderColor: '#4CAF50',
    zIndex: 1,
  },

  valueBox: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderRadius: 3,
    backgroundColor: VALUE_BOX_GREEN,
  },

  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PICKER_PADDING,
    zIndex: 2,
    // gradient-like fade using overlapping views isn't doable without LinearGradient
    // just use a semi-transparent white overlay
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PICKER_PADDING,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  updateButtonDisabled: {
    backgroundColor: '#88C98A', // lighter green when loading
    elevation: 0,
  },
});
