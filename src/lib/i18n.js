import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import deTranslations from '../locales/de.json';
import enTranslations from '../locales/en.json';

const savedLanguage = localStorage.getItem('language') || 'de';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: deTranslations },
      en: { translation: enTranslations }
    },
    lng: savedLanguage,
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false // React already safes from XSS
    }
  });

export default i18n;
