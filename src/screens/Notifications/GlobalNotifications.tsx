import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getGlobalRaisedAlarm } from '../../services/alarmService';
import { Icons } from '../../../assets';
import { fontScale, scale, verticalScale } from '../../utils/scaling';
import { useResponsive } from '../../utils/responsive';
import { getSharedStyles } from '../../styles/sharedStyles';
import { RFValue } from 'react-native-responsive-fontsize';

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

// const getBgColorByPriority = (priority: number) => {
//   switch (priority) {
//     case 0:
//       return '#f7e3dc'; // critical
//     case 1:
//       return '#f7f3dc'; // high
//     case 2:
//       return '#e6f1ff'; // medium
//     case 3:
//       return '#e6f1ff'; // low
//     default:
//       return '#f0f0f0'; // default
//   }
// };

const getParameterKey = (violatedParameter?: string): string => {
  if (!violatedParameter) return '';
  const [key] = violatedParameter.split(':');
  return key.trim().toUpperCase();
};

const getParameterIcon = (
  key: string,
): React.FC<{ width?: number; height?: number; fill?: string }> => {
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
      return Icons.default;
  }
};

type GlobalNotificationsProps = {
  width?: number;
  alerts: any[];
  onNotificationClick?: () => void;
};

export const GlobalNotifications: React.FC<GlobalNotificationsProps> = ({
  width,
  alerts,
  onNotificationClick,
}) => {
  const { isTablet, wp, hp } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollHeight, setScrollHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  // const [alerts, setAlerts] = useState<any[]>([]);

  const indicatorSize = (scrollHeight / contentHeight) * scrollHeight;
  const scrollableContentHeight = contentHeight - scrollHeight;
  const thumbScrollRange = scrollHeight - indicatorSize;

  const translateY = scrollY.interpolate({
    inputRange: [0, scrollableContentHeight > 0 ? scrollableContentHeight : 1],
    outputRange: [0, thumbScrollRange > 0 ? thumbScrollRange : 0],
    extrapolate: 'clamp',
  });

  const iconBoxStyle = useMemo(
    () => ({
      width: isTablet? scale(35): scale(30),
      height: isTablet? scale(35): scale(30),
      justifyContent: 'center',
      alignItems: 'center',
    }),
    [isTablet],
  );

  return (
    <View style={[styles.container, width ? { width } : {}]}>
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        onLayout={e => setScrollHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(w, h) => setContentHeight(h)}
      >
        {alerts.map((item, index) => {
          const paramKey = getParameterKey(item.violatedParameter);
          const IconComponent = getParameterIcon(paramKey);
          const priorityColor = getColorByPriority(item.priority);
          // const bgColor = getBgColorByPriority(item.priority);

          return (
            <TouchableOpacity
              key={index}
              style={[styles.bedItem, { borderLeftColor: priorityColor }]}
              onPress={() => {
                onNotificationClick?.();
                // also trigger any other logic like opening the bed info if needed
              }}
            >
              <View style={styles.column}>
                <Text style={styles.bedCode} numberOfLines={2}>
                  {item.bedCode || '-'}
                </Text>

                <View style={iconBoxStyle}>
                  <IconComponent width={isTablet? 34: 24} height={isTablet? 34: 24} fill={priorityColor} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {contentHeight > scrollHeight && (
        <View style={styles.scrollBarTrack}>
          <Animated.View
            style={[
              styles.scrollBarThumb,
              {
                height: indicatorSize,
                transform: [{ translateY }],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#eef5f0',
    borderRightWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    // borderTopRightRadius: 10,
    // borderBottomRightRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingRight: 5,
  },
  bedItem: {
    width: '90%',
    minHeight: verticalScale(55),
    backgroundColor: '#f9f9f9',
    marginVertical: 8,
    // borderTopLeftRadius: 3,
    // borderBottomLeftRadius: 3,
    borderLeftWidth: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    elevation: 2,
  },
  bedCode: {
    fontWeight: 'bold',
    fontSize: RFValue(12, 812),
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    maxWidth: '100%',
  },

  svgWrapper: {
    marginTop: 4,
  },
  scrollBarTrack: {
    width: scale(4),
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    alignSelf: 'stretch',
  },
  scrollBarThumb: {
    width: scale(4),
    backgroundColor: '#4CAE51',
    borderRadius: 3,
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },

  iconBox: {
    width: scale(30),
    height: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
