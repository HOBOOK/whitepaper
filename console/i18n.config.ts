import defineI18nConfig from '@nuxtjs/i18n'
import ko from './i18n/locales/ko.json'
import en from './i18n/locales/en.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ko',
  fallbackLocale: 'ko',
  messages: { ko, en }
}))
