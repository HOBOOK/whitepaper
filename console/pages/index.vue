<template>
  <div class="container-page">
    <div class="grid grid-cols-1 lg:[grid-template-columns:minmax(0,1fr)_15rem] gap-6 py-0">
      <div class="space-y-6">
        <section class="card p-8">
          <h1 class="text-4xl font-extrabold bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent mb-3">{{ $t('home.title_main') }}</h1>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            {{ $t('home.subtitle') }}
          </p>

          <div class="card p-2 mb-6">
            <div class="flex gap-2">
              <input
                v-model="homeQuery"
                type="text"
                :placeholder="$t('home.search_placeholder')"
                class="flex-1 rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:bg-gray-100"
                @keyup.enter="goSearch"
              />
              <button class="btn btn-primary" @click="goSearch"><app-icon name="search"/></button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <NuxtLink to="/docs/manifesto" class="card p-4 hover:shadow">
              <div class="flex items-center text-base font-semibold mb-1"><app-icon name="megaphone" class="mr-2"/> {{ $t('home.cards.manifesto.title') }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ $t('home.cards.manifesto.desc') }}</div>
            </NuxtLink>
            <NuxtLink to="/docs/principles" class="card p-4 hover:shadow">
              <div class="flex items-center text-base font-semibold mb-1"><app-icon name="scale" class="mr-2"/> {{ $t('home.cards.principles.title') }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ $t('home.cards.principles.desc') }}</div>
            </NuxtLink>
            <NuxtLink to="/docs/playbook" class="card p-4 hover:shadow">
              <div class="flex items-center text-base font-semibold mb-1"><app-icon name="book" class="mr-2"/> {{ $t('home.cards.playbook.title') }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ $t('home.cards.playbook.desc') }}</div>
            </NuxtLink>
            <NuxtLink to="/docs/roadmap" class="card p-4 hover:shadow">
              <div class="flex items-center text-base font-semibold mb-1"><app-icon name="clock" class="mr-2"/> {{ $t('home.cards.roadmap.title') }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ $t('home.cards.roadmap.desc') }}</div>
            </NuxtLink>
          </div>
        </section>

        <section class="card p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">{{ $t('home.featured') }}</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NuxtLink
              v-for="(d,i) in featured"
              :key="i"
              :to="`/docs/${d.slug}`"
              class="card p-4 hover:shadow"
            >
              <div class="text-base font-semibold">{{ d.title }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">{{ d.description }}</div>
              <div class="text-sm text-gray-500 line-clamp-3">{{ d.excerpt }}</div>
            </NuxtLink>
          </div>
        </section>
      </div>

      <aside class="toc-sticky">
        <section class="card p-4">
          <div class="text-sm font-semibold mb-3">{{ $t('home.updates') }}</div>
          <ul class="space-y-3">
            <li v-for="(d,idx) in updates" :key="idx">
              <div class="font-medium text-sm">{{ d.title }}</div>
              <div class="text-xs text-gray-400">{{ d.date }}</div>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
const homeQuery = ref('')
function goSearch(){
  navigateTo({ path: '/search', query: { q: homeQuery.value } })
}
const { data: featured } = await useAsyncData('featured', async () => {
  return await queryContent('whitepaper')
    .where({ featured: { $eq: true } })
    .only(['title','slug','description','excerpt'])
    .find()
})

const { data: updates } = await useAsyncData('updates', async () => {
  const doc = await queryContent().where({ _path: '/changelog' }).findOne()
  if(!doc || !doc.body) return []
  const lines = []
  function extractText(node){
    if(!node) return ''
    if(node.type === 'text' && node.value) return node.value
    let s = ''
    if(Array.isArray(node.children)) for(const c of node.children) s += extractText(c)
    return s
  }
  function collect(node){
    if(!node) return
    if(node.type === 'element' && (node.tag === 'ul' || node.tag === 'ol')){
      for(const li of (node.children||[])){
        const t = extractText(li).trim()
        if(t) lines.push(t)
      }
    }
    if(Array.isArray(node.children)) for(const c of node.children) collect(c)
  }
  collect(doc.body)
  const mapped = lines.map(l => {
    const m = l.match(/^(\d{4}-\d{2}-\d{2})\s*[:\-–]\s*(.+)$/)
    return m ? { date: m[1], title: m[2] } : { date: '', title: l }
  })
  return mapped.slice(0,6)
})
useHead({ title: 'Home' })
</script>
