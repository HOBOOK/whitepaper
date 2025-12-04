<template>
  <div class="container-page">
    <article class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-semibold">{{ $t('settings.order_title') }}</h1>
        <NuxtLink to="/" class="btn">{{ $t('common.done') }}</NuxtLink>
      </div>

      <div v-if="!admin" class="text-sm text-red-600">{{ $t('order.admin_only') }}</div>

      <div v-else>
        <div v-if="loading" class="text-sm text-gray-500">{{ $t('settings.loading') }}</div>
        <div v-else>
          <div class="text-xs text-gray-500 mb-2">{{ $t('order.drag_hint') }}</div>
          <ul @dragover.prevent @drop="onDrop"
              class="select-none">
            <li v-for="(it, idx) in items" :key="it.slug"
                class="flex items-center justify-between border rounded-lg px-3 py-2 mb-2 bg-white dark:bg-gray-800"
                :draggable="true"
                @dragstart="onDragStart(idx)"
                @dragenter.prevent="onDragEnter(idx)"
                @dragend="onDragEnd">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 text-center text-xs text-gray-500 cursor-grab"><app-icon name="drag" />{{ idx + 1 }}</div>
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{{ it.title || titleFromSlug(it.slug) }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ it.slug }}</div>
                </div>
              </div>
            </li>
          </ul>

          <div class="mt-4 flex gap-2">
            <button class="btn" @click="reload" :disabled="saving">{{ $t('settings.refresh') }}</button>
            <button class="btn btn-primary" @click="save" :disabled="saving || !items.length">{{ $t('settings.save') }}</button>
          </div>
          <div v-if="error" class="text-xs text-red-600 mt-2">{{ error }}</div>
          <div v-if="saved" class="text-xs text-green-600 mt-2">{{ $t('settings.saved') }}</div>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
import { useAdmin } from '@/composables/useAdmin'
import { refreshNuxtData } from '#app'
const { admin, token } = useAdmin()
const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const items = ref([])

let dragIndex = -1
function onDragStart(i){ dragIndex = i }
function onDragEnter(i){
  if(dragIndex === -1 || dragIndex === i) return
  const list = items.value.slice()
  const [moved] = list.splice(dragIndex, 1)
  list.splice(i, 0, moved)
  items.value = list
  dragIndex = i
}
function onDrop(){ dragIndex = -1 }
function onDragEnd(){ dragIndex = -1 }

function titleFromSlug(s){
  return (s||'').split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ')
}

async function load(){
  loading.value = true
  error.value = ''
  try{
    const list = await queryContent('whitepaper').where({ _partial: { $ne: true } }).only(['_path','title','position','slug']).find()
    // Documents 섹션과 동일하게 overview, developers 제외
    const filtered = list.filter(n => n.slug !== 'overview' && n.slug !== 'developers')
    // 현재 position 기준 정렬
    filtered.sort((a,b) => (a.position || 999) - (b.position || 999))
    items.value = filtered.map(n => ({ slug: n.slug, title: n.title || '', position: n.position || 999 }))
  }catch(e){ error.value = t('order.load_failed') }
  finally{ loading.value = false }
}

function reload(){ load(); saved.value = false }

async function save(){
  saving.value = true
  error.value = ''
  saved.value = false
  try{
    const order = items.value.map(it => it.slug)
    await $fetch('/api/content/order', { method: 'POST', body: { order }, headers: token?.value ? { 'x-admin-pass': token.value } : {} })
    await refreshNuxtData('navTree')
    saved.value = true
  }catch(e){
    error.value = (e && e.data && e.data.message) || t('order.save_failed')
  }finally{
    saving.value = false
  }
}

onMounted(load)
</script>
