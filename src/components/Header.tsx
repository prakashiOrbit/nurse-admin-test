import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { fontScale, scale, verticalScale } from '../utils/scaling';
import Logout from '../screens/Auth/Logout/Logout';
import { getSharedStyles } from '../styles/sharedStyles';
import { useResponsive } from '../utils/responsive';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { LanguageSheet } from './LanguageSheet';

const MenuIconbutton = require('../../assets/icons/Group2.png');

export const Header = ({ onMenuPress }: { onMenuPress: () => void }) => {
  const { t } = useTranslation();
  const [showLogout, setShowLogout] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { isTablet } = useResponsive();
  const shared = useMemo(() => getSharedStyles(isTablet), [isTablet]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
    };

    updateTime();

    const now = new Date();
    const seconds = now.getSeconds();
    const delay = (60 - seconds) * 1000;

    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const getFormattedDate = () =>
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const titleStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(18) : RFValue(16),
      fontWeight: 'bold',
      paddingLeft: isTablet ? scale(4) : 0,
    }),
    [isTablet],
  );

  const dateStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14) : RFValue(12),
      marginRight: scale(8),
    }),
    [isTablet],
  );

  const timeStyle = useMemo(
    () => ({
      fontSize: isTablet ? RFValue(14) : RFValue(12),
    }),
    [isTablet],
  );

  const menuIconStyle = useMemo(
    () => ({
      width: scale(30),
      height: verticalScale(30),
      marginRight: 10,
      resizeMode: 'contain',
      marginLeft: isTablet ? 0 : 15,
      marginTop: 10,
      marginBottom: 4,
    }),
    [isTablet],
  );

  const headerStyle = useMemo(
    () => ({
      width: '100%',
      height: verticalScale(60),
      flexDirection: 'row',
      paddingTop: verticalScale(18),
      paddingHorizontal: isTablet ? scale(14) : scale(20),
      justifyContent: 'space-between',
      backgroundColor: '#f9f9f8',
    }),
    [isTablet],
  );

  const wrapperStyle = useMemo(
    () => ({
      zIndex: 10, // important on iOS
      paddingTop: isTablet ? scale(4) : scale(0),
      paddingLeft: isTablet ? scale(4) : scale(0),
    }),
    [isTablet],
  );

  return (
    <View style={wrapperStyle}>
      <View style={headerStyle}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onMenuPress}>
            <Image source={MenuIconbutton} style={menuIconStyle} />
          </Pressable>
          <Text style={titleStyle}>{t('header.app_title')}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={dateStyle}>{getFormattedDate()}</Text>
          <Text style={timeStyle}>{currentTime}</Text>
          <Pressable onPress={() => setShowLangSheet(true)} style={styles.globeBtn} hitSlop={8}>
            <Text style={styles.globeIcon}>🌐</Text>
          </Pressable>
        </View>
      </View>
      <LanguageSheet visible={showLangSheet} onClose={() => setShowLangSheet(false)} />

      {/* {showLogout && (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowLogout(false)}
          />

          <View style={styles.logoutPanel}>
            <Logout onClose={() => setShowLogout(false)} />
          </View>
        </>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10, // important on iOS
  },
  header: {
    width: '100%',
    height: verticalScale(60),
    flexDirection: 'row',
    paddingTop: verticalScale(18),
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: scale(30),
    height: verticalScale(30),
    marginRight: 10,
    resizeMode: 'contain',
    marginLeft: 15,
    marginTop: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
  },
  date: {
    fontSize: fontScale(14),
    marginRight: scale(8),
  },
  time: {
    fontSize: fontScale(14),
  },
  globeBtn: {
    marginLeft: scale(8),
    padding: scale(2),
  },
  globeIcon: {
    fontSize: RFValue(16),
  },

  /* Overlay */
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  logoutPanel: {
    position: 'absolute',
    top: verticalScale(55),
    left: scale(20),
    zIndex: 20,
  },
});
