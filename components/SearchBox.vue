<template>
  <div class="flex gap-2">
    <div class="relative flex-1">
      <input
        v-model="query"
        type="text"
        placeholder="검색어를 입력하세요."
        class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keyup.enter="$emit('search', query)"
      />
      <span class="absolute left-3 top-2.5 text-gray-500"><app-icon name="search"/></span>
    </div>
  </div>
</template>
<script>
import AppIcon from '@/components/AppIcon.vue'
export default {
  name:'SearchBox',
  components:{ AppIcon },
  data:()=>({query:''})
}
</script>
