<template>
  <ul class="space-y-1">
    <li v-for="(item, idx) in items" :key="idx">
      <template v-if="item._path">
        <NuxtLink
          :to="toFor(item)"
          :class="linkClass(item)"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <app-icon name="file-text" class="mr-2" />
          <span class="truncate">{{ item.title }}</span>
        </NuxtLink>
      </template>
      <template v-else>
        <div class="px-3 py-1.5 text-xs uppercase tracking-wide text-gray-500">{{ item.title }}</div>
      </template>
      <div v-if="item.children && item.children.length" class="ml-4 mt-1">
        <ContentNav :items="item.children" />
      </div>
    </li>
  </ul>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
const props = defineProps({ items: { type: Array, default: () => [] } })
const route = useRoute()

const toFor = (i) => {
  const seg = (i._path || '').split('/').filter(Boolean).pop() || ''
  return seg ? `/docs/${seg}` : '/'
}
const isActive = (i) => {
  const to = toFor(i)
  return to !== '/' && route.path.startsWith(to)
}
const linkClass = (i) => {
  const base = 'flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'
  return isActive(i) ? `${base} bg-blue-50 text-blue-700 dark:bg-blue-900/30` : base
}
</script>
