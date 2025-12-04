<template>
  <div class="container-page">
    <article class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-semibold">{{ $t('settings.title') }}</h1>
      </div>

      <SegmentedTabs v-model="tab" :items="tabsI18n" class="mb-4" />

      <div v-if="tab==='order'">
        <OrderEditor />
      </div>
      <div v-else>
        <div class="space-y-5">
          <section>
            <div class="text-sm font-semibold mb-2">{{ $t('settings.theme') }}</div>
            <div class="flex items-center gap-2">
              <label class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
                <input type="radio" class="accent-blue-600" name="theme" value="light" v-model="theme" />
                <span class="text-sm">{{ $t('settings.theme_light') }}</span>
              </label>
              <label class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
                <input type="radio" class="accent-blue-600" name="theme" value="dark" v-model="theme" />
                <span class="text-sm">{{ $t('settings.theme_dark') }}</span>
              </label>
              <label class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer">
                <input type="radio" class="accent-blue-600" name="theme" value="system" v-model="theme" />
                <span class="text-sm">{{ $t('settings.theme_system') }}</span>
              </label>
            </div>
          </section>

          <section>
            <div class="text-sm font-semibold mb-2">{{ $t('settings.language') }}</div>
            <select v-model="locale" class="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none">
              <option value="ko-KR">한국어</option>
              <option value="en-US">English</option>
            </select>
          </section>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import OrderEditor from '@/components/OrderEditor.vue'
import SegmentedTabs from '@/components/SegmentedTabs.vue'
import { useLocale } from '@/composables/useLocale'
const tab = ref('order')
const { t, locale: i18nLocale } = useI18n()
const tabsI18n = computed(() => [
  { key: 'order', label: t('settings.tabs.order') },
  { key: 'general', label: t('settings.tabs.general') }
])

// Theme binding
const color = useColorMode()
const theme = computed({
  get: () => color.preference,
  set: (v) => { color.preference = v }
})

// Language binding
const { locale } = useLocale()
watch(locale, (v) => { i18nLocale.value = (v || 'ko-KR').startsWith('en') ? 'en' : 'ko' }, { immediate: true })
</script>
