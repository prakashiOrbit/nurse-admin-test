import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Alert,
  I18nManager,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {RFValue} from 'react-native-responsive-fontsize';
import {scale, verticalScale} from '../utils/scaling';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, {LOCALE_STORAGE_KEY} from '../i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const LANGUAGES = [
  {code: 'en', key: 'languages.en'},
  {code: 'fr', key: 'languages.fr'},
  {code: 'de', key: 'languages.de'},
  {code: 'nl', key: 'languages.nl'},
  {code: 'it', key: 'languages.it'},
  {code: 'es', key: 'languages.es'},
  {code: 'cs', key: 'languages.cs'},
  {code: 'rm', key: 'languages.rm'},
  {code: 'ar', key: 'languages.ar'},
];

export const LanguageSheet: React.FC<Props> = ({visible, onClose}) => {
  const {t} = useTranslation();
  const currentLanguage = (i18n.language || 'en').split('-')[0];

  const handleSelect = async (code: string) => {
    const wasRTL = currentLanguage === 'ar';
    const willBeRTL = code === 'ar';
    await i18n.changeLanguage(code);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, code);
    if (wasRTL !== willBeRTL) {
      I18nManager.forceRTL(willBeRTL);
      onClose();
      Alert.alert(
        t('settings.restart_required'),
        t('settings.restart_required_msg'),
        [{text: t('common.done')}],
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.select_language')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>{t('common.done')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {LANGUAGES.map(lang => {
            const isSelected = currentLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={styles.langItem}
                onPress={() => handleSelect(lang.code)}>
                <Text style={[styles.langLabel, isSelected && styles.selectedLabel]}>
                  {t(lang.key)}
                </Text>
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '50%',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: RFValue(17, 812),
    fontWeight: '700',
    color: '#000',
  },
  closeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  closeText: {
    fontSize: RFValue(15, 812),
    color: '#4A90E2',
    fontWeight: '600',
  },
  list: {
    marginBottom: 10,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  langLabel: {
    fontSize: RFValue(15, 812),
    color: '#333',
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#4A90E2',
    fontWeight: '700',
  },
  checkMark: {
    fontSize: RFValue(16, 812),
    color: '#4A90E2',
    fontWeight: '700',
  },
});
