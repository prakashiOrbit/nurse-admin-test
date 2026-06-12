import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Modal } from 'react-native';
import SharedLogout from '../../../components/shared/ui/SharedLogout/SharedLogout';
import ConfirmLogout from './ConfirmLogout';
import { logoutAPI } from '../../../services/authService';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { clearAuthSession } from '../../../services/sessionService';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { closeDashboardStream } from '../../../services/streamService/dashboardStreamManager';

const LockIMG = require('../../../../assets/icons/lock.png');
const LogoutBTN = require('../../../../assets/icons/exit.png');
const ConfirmLogoutIMG = require('../../../../assets/icons/confirmLogout.png');
const Logout: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('userName').then(value => {
      if (mounted) {
        setEmail(value ?? '');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      closeDashboardStream();
      await logoutAPI();
      await clearAuthSession();

      navigation.reset({
        index: 0,
        routes: [{ name: 'NurseLogin' }],
      });

      Toast.show({
        type: 'success',
        text1: t('confirm_logout.logged_out'),
      });

      setShowConfirm(false);
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: t('confirm_logout.logout_failed'),
      });
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <View>
      <SharedLogout
        LockIMG={LockIMG}
        LogoutBTN={LogoutBTN}
        onLogoutPress={() => setShowConfirm(true)}
        onChangePasswordPress={() => {
          onClose();
          navigation.navigate('CreateNewPasswordAuthenticated', { email });
        }}
      />

      <Modal
        visible={showConfirm}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancel}>
          <Pressable onPress={e => e.stopPropagation()}>
            <ConfirmLogout
              onCancel={handleCancel}
              onConfirm={handleLogout}
              LogoutImage={ConfirmLogoutIMG}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default Logout;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
