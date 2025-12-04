<template>
  <div class="container-page">
    <div class="py-8">
      <div class="card p-4 mb-4">
        <div class="flex gap-2">
          <input
            v-model="q"
            type="text"
            placeholder="Search"
            class="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="doSearch"
          />
          <button class="btn btn-primary" @click="doSearch"><app-icon name="search"/></button>
        </div>
        <div v-if="err" class="text-xs text-red-600 mt-2">{{ err }}</div>
      </div>

      <div v-if="!loading && results.length===0" class="text-gray-500">No results.</div>

      <div v-if="loading" class="text-gray-500">Searching…</div>

      <div class="grid grid-cols-1 gap-3">
        <NuxtLink
          v-for="(r, i) in results"
          :key="i"
          class="card p-4 hover:shadow"
          :to="toFor(r)"
        >
          <div class="text-base font-semibold">{{ r.title }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-300">{{ r.description }}</div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const q = ref('')
const results = ref([])
const loading = ref(false)
const err = ref('')

onMounted(() => {
  q.value = route.query.q || ''
  if(q.value) doSearch()
})

function toFor(r){
  if (!r._path) return '/'

  // "/whitepaper" 제거
  const cleaned = r._path.replace(/^\/whitepaper\/?/, '')

  // 나머지 전체 경로를 docs 밑으로
  return `/docs/${cleaned}`
}

let timer
async function doSearch(){
  clearTimeout(timer)
  timer = setTimeout(async () => {
    try{
      loading.value = true; err.value=''
      const res = await $fetch('/api/search', { params: { q: q.value } })
      results.value = res?.hits || []
    }catch(e){ err.value = (e && e.data && e.data.message) || 'Search failed' }
    finally{ loading.value = false }
  }, 200)
}

useHead({ title: 'Search' })
</script>
