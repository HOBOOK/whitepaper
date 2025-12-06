<template>
  <ul class="space-y-1">
    <li v-for="(item, idx) in items" :key="idx">
      <template v-if="item._path">
        <div
          class="rounded-lg"
          :draggable="!!admin"
          @dragstart="admin && onLeafDragStart(item)"
          @dragenter.prevent="admin && onLeafDragEnter(item)"
          @dragover.prevent
          @dragend="admin && onLeafDragEnd()"
          @drop.prevent="admin && onLeafDrop(item)"
        >
          <NuxtLink
            :to="toFor(item)"
            :class="linkClass(item)"
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            <app-icon name="file-text" class="mr-2" />
            <span class="truncate">{{ item.title }}</span>
          </NuxtLink>
        </div>
      </template>
      <template v-else>
        <button
          type="button"
          class="w-full flex items-center px-3 py-1.5 text-xs uppercase tracking-wide text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          @click="toggle(groupKey(item))"
        >
          <app-icon :name="isOpen(groupKey(item)) ? 'chevron-down' : 'chevron-right'" class="mr-1" />
          <span class="truncate text-left">{{ item.title }}</span>
        </button>
      </template>
      <transition name="fade" mode="out-in">
        <div v-if="(item.children && item.children.length) && isOpen(groupKey(item))" class="ml-4 mt-1">
          <ContentNav :items="item.children" :base="childBase(item)" :depth="depth+1" />
        </div>
      </transition>
    </li>
  </ul>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
import { refreshNuxtData } from '#app'
import { useAdmin } from '@/composables/useAdmin'
const { admin: adminState, token: tokenState } = useAdmin()
const admin = computed(() => adminState.value)
const token = computed(() => tokenState.value)

const props = defineProps({ items: { type: Array, default: () => [] }, base: { type: String, default: '' }, depth: { type: Number, default: 0 } })
const route = useRoute()

const relFromPath = (p) => (p || '').replace(/^\/?whitepaper\//, '').replace(/^\//, '')
const encSeg = (s) => { try { return encodeURIComponent(decodeURIComponent(s)) } catch { return encodeURIComponent(String(s)) } }
const enc = (rel) => rel.split('/').filter(Boolean).map(encSeg).join('/')

const toFor = (i) => {
  const rel = relFromPath(i._path || '')
  return rel ? `/docs/${enc(rel)}` : '/'
}
const isActive = (i) => {
  const rel = relFromPath(i._path || '')
  const to = rel ? `/docs/${enc(rel)}` : '/'
  return to !== '/' && route.path.startsWith(to)
}
const linkClass = (i) => {
  const base = 'flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'
  return isActive(i) ? `${base} bg-blue-50 text-blue-700 dark:bg-blue-900/30` : `${base}`
}

// Collapsible groups
const openState = useState('nav-open', () => ({}))
const keySafe = (s) => encSeg(String(s || ''))
const groupKey = (g) => {
  const prefix = (props.base || '').split('/').filter(Boolean).map(keySafe).join('/')
  const here = keySafe(g?.title || '')
  return prefix ? `${prefix}/${here}` : here
}
const childBase = (g) => groupKey(g)

function isOpen(key){
  const folderPath = key ? `/docs/${key}` : '/'
  const auto = route.path.startsWith(folderPath)
  const state = openState.value[key]
  return typeof state === 'boolean' ? state : auto
}
function toggle(key){ openState.value[key] = !isOpen(key) }

// Drag and drop reorder (within same folder)
const dnd = useState('nav-dnd', () => ({ dragging: null, over: null }))
const leafRel = (it) => relFromPath(it._path || '')
const leafFolderRel = (it) => {
  const segs = leafRel(it).split('/').filter(Boolean)
  return segs.slice(0, props.depth).join('/')
}
const leavesAtLevel = () => props.items.filter(x => x && x._path)
const leavesRelList = () => leavesAtLevel().map(leafRel)
const leafIndex = (it) => leavesRelList().indexOf(leafRel(it))

function onLeafDragStart(it){
  const folder = leafFolderRel(it)
  const index = leafIndex(it)
  dnd.value.dragging = { path: leafRel(it), folder, index }
}
function onLeafDragEnter(it){ dnd.value.over = { index: leafIndex(it), folder: leafFolderRel(it) } }
function onLeafDragEnd(){ dnd.value.dragging = null; dnd.value.over = null }

async function onLeafDrop(it){
  const drag = dnd.value.dragging
  const over = { index: leafIndex(it), folder: leafFolderRel(it) }
  if(!drag || drag.folder !== over.folder) { onLeafDragEnd(); return }
  const list = leavesRelList()
  if(drag.index < 0 || over.index < 0 || drag.index === over.index){ onLeafDragEnd(); return }
  const [moved] = list.splice(drag.index,1)
  list.splice(over.index,0,moved)
  try{
    await $fetch('/api/content/order', { method:'POST', body:{ order: list }, headers: (admin?.value && token?.value) ? { 'x-admin-pass': token.value } : {} })
    await refreshNuxtData('navTree')
  }catch(e){ console.error('reorder failed', e) }
  onLeafDragEnd()
}
</script>

<style>
.fade-enter-active,.fade-leave-active{ transition: opacity .15s ease; }
.fade-enter-from,.fade-leave-to{ opacity:0; }
</style>
