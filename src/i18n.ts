import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {I18nManager} from 'react-native';

import en from './assets/locales/en.json';
import fr from './assets/locales/fr.json';
import de from './assets/locales/de.json';
import nl from './assets/locales/nl.json';
import it from './assets/locales/it.json';
import es from './assets/locales/es.json';
import cs from './assets/locales/cs.json';
import rm from './assets/locales/rm.json';
import ar from './assets/locales/ar.json';

export const LOCALE_STORAGE_KEY = 'preferred_locale';

i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    fr: {translation: fr},
    de: {translation: de},
    nl: {translation: nl},
    it: {translation: it},
    es: {translation: es},
    cs: {translation: cs},
    rm: {translation: rm},
    ar: {translation: ar},
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export const restoreLanguage = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) {
      const shouldBeRTL = stored === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
      }
      if (stored !== i18n.language) {
        await i18n.changeLanguage(stored);
      }
    }
  } catch {
    // AsyncStorage unavailable — fall back to default 'en'
  }
};

export default i18n;
