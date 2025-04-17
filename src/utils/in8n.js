import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "login": "Login",
      "welcome": "Welcome",
      "description": "This is a translation example."
    }
  },
  ko: {
    translation: {
      "login": "로그인",
      "welcome": "환영합니다",
      "description": "이것은 번역 예제입니다."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ko", // 기본 언어 설정
    fallbackLng: "ko",
    interpolation: {
      escapeValue: false, // React에서 XSS를 방지하기 위한 설정
    },
  });

export default i18n;
