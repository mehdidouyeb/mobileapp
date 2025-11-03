import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '../translations/en.json';
import es from '../translations/es.json';
import fr from '../translations/fr.json';
import de from '../translations/de.json';
import it from '../translations/it.json';
import pt from '../translations/pt.json';
import ru from '../translations/ru.json';
import ja from '../translations/ja.json';
import ko from '../translations/ko.json';
import zh from '../translations/zh.json';
import ar from '../translations/ar.json';
import hi from '../translations/hi.json';

const resources = {
  en: {
    translation: en,
  },
  es: {
    translation: es,
  },
  fr: {
    translation: fr,
  },
  de: {
    translation: de,
  },
  it: {
    translation: it,
  },
  pt: {
    translation: pt,
  },
  ru: {
    translation: ru,
  },
  ja: {
    translation: ja,
  },
  ko: {
    translation: ko,
  },
  zh: {
    translation: zh,
  },
  ar: {
    translation: ar,
  },
  hi: {
    translation: hi,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;
