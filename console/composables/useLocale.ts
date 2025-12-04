// @ts-nocheck
export const useLocale = () => {
  const cookie = useCookie('locale', { sameSite: 'lax' })
  const locale = useState('app-locale', () => cookie.value || 'ko-KR')

  function applyDomLang(v){
    if (process.client && typeof document !== 'undefined') {
      const short = (v || 'en').split('-')[0]
      document.documentElement.setAttribute('lang', short)
    }
  }

  // Sync on change (client-safe)
  if (process.client) {
    const syncI18n = async (v) => {
      try {
        const { setLocale } = useI18n()
        await setLocale((v || 'ko-KR').startsWith('en') ? 'en' : 'ko')
      } catch {}
    }
    watch(locale, (v) => {
      cookie.value = v
      applyDomLang(v)
      syncI18n(v)
    })
    onMounted(() => { applyDomLang(locale.value); syncI18n(locale.value) })
  } else {
    // SSR: keep cookie only
    watch(locale, (v) => { cookie.value = v })
  }

  return { locale }
}
