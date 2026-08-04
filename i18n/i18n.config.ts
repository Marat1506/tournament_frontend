import ru from './locales/ru.json'
import en from './locales/en.json'
import es from './locales/es.json'

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'ru',
  messages: {
    ru,
    en,
    es,
  },
}))
