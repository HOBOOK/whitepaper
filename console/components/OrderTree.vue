<template>
  <div class="select-none">
    <div v-if="depth > 0" class="flex items-center gap-1 px-1 py-1.5 text-xs uppercase tracking-wide text-gray-500"
         :draggable="isAdmin"
         @dragover.prevent
         @drop.prevent="isAdmin && onDropIntoFolder()">
      <button type="button" class="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-300" @click="toggle">
        <app-icon :name="isOpen ? 'chevron-down' : 'chevron-right'" class="mr-1" />
        <span class="truncate">{{ node.name || $t('order.root') }}</span>
      </button>
      <span class="flex-1"></span>
      <button v-if="isAdmin" class="btn btn-xs" @click.stop="$emit('new-folder', node.path || '')">+</button>
    </div>

    <transition name="fade" mode="out-in">
      <div v-show="depth === 0 || isOpen" :class="depth>0 ? 'ml-3' : ''">
        <!-- Drop area to move into this folder (top) -->
        <div v-if="isAdmin" class="h-2" @dragover.prevent @drop.prevent="onDropIntoFolder()"></div>

        <!-- Leaves for this folder -->
        <ul v-if="node.leaves && node.leaves.length" @dragover.prevent class="mb-2">
          <li v-for="(it, idx) in node.leaves" :key="it.path"
              class="flex items-center justify-between border dark:border-gray-600 rounded-lg px-3 py-2 mb-2 bg-white dark:bg-gray-800"
              :draggable="isAdmin"
              @dragstart="isAdmin && onDragStartLeaf(idx)"
              @dragenter.prevent="isAdmin && onDragEnterLeaf(idx)"
              @drop.prevent="isAdmin && onDropLeaf()"
              @dragend="isAdmin && onDragEnd()">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 text-center text-xs text-gray-500 cursor-grab"><app-icon name="drag" /></div>
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{{ it.title || titleFromSlug(lastSeg(it.path)) }}</div>
                <div class="text-xs text-gray-500 truncate">{{ it.path }}</div>
              </div>
            </div>
          </li>
        </ul>

        <!-- Child folders (draggable reorder) -->
        <ul v-if="node.folders && node.folders.length" class="mt-1">
          <li v-for="(child, cidx) in node.folders" :key="child.path"
              :draggable="isAdmin"
              @dragstart="isAdmin && onDragStartFolder(cidx)"
              @dragenter.prevent="isAdmin && onDragEnterFolder(cidx)"
              @drop.prevent="isAdmin && onDropFolder()"
              @dragend="isAdmin && onDragEnd()">
            <OrderTree :node="child" :depth="depth+1" :admin="admin" :token="token" @reordered="$emit('reordered')" />
          </li>
        </ul>

        <!-- Drop area to move item up to parent folder -->
        <div v-if="isAdmin && depth > 0" class="h-2" @dragover.prevent @drop.prevent="onDropToParent()"></div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
import { refreshNuxtData } from '#app'

defineOptions({ name: 'OrderTree' })

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  admin: { type: [Boolean, Object], default: false },
  token: { type: [String, Object], default: '' }
})
const emit = defineEmits(['reordered','new-folder'])

const { t } = useI18n()

const isAdmin = computed(() => !!(props.admin && typeof props.admin === 'object' ? props.admin.value : props.admin))
const openState = useState('order-open', () => ({}))
const isOpen = computed(() => openState.value[props.node.path] ?? (props.depth < 2))
function toggle(){ openState.value[props.node.path] = !isOpen.value }

// Drag state
const drag = useState('order-dnd', () => ({ type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1 }))

// Leaf reordering within same folder
function onDragStartLeaf(i){ drag.value = { type: 'leaf', fromFolder: props.node.path, path: props.node.leaves[i].path, leafIndex: i, folderIndex: -1 } }
function onDragEnterLeaf(i){
  // If dragging within same folder, reorder optimistically
  if(drag.value.type === 'leaf' && drag.value.fromFolder === props.node.path){
    if(drag.value.leafIndex === -1 || drag.value.leafIndex === i) return
    const list = props.node.leaves.slice()
    const [moved] = list.splice(drag.value.leafIndex, 1)
    list.splice(i, 0, moved)
    props.node.leaves.splice(0, props.node.leaves.length, ...list)
    drag.value.leafIndex = i
    return
  }
  // For cross-folder, just remember the target index (don't reorder yet)
  drag.value.leafIndex = i
}
async function onDropLeaf(){
  // Same-folder reorder → persist mixed order
  if(drag.value.type === 'leaf' && drag.value.fromFolder === props.node.path){
    await saveMixedChildrenOrder()
  } else if(drag.value.type === 'leaf' && drag.value.fromFolder !== props.node.path){
    // Cross-folder move: move into this folder and place at hovered index
    const from = drag.value.path
    const idx = drag.value.leafIndex
    await moveFile(from, props.node.path || '')
    // Build new mixed children order with the moved file inserted at idx
    const keys = [
      ...(props.node.folders || []).map(f => (f.path.split('/').pop() || '') + '/'),
      ...(props.node.leaves || []).map(l => (l.path.split('/').pop() || ''))
    ]
    const fileKey = (from.split('/').pop() || '')
    if(idx >= 0 && idx <= keys.length){
      // insert before file at idx (folders are first in keys, we need to map idx among file positions)
      // Compute file positions subset to map idx correctly
      const fileKeys = (props.node.leaves || []).map(l => (l.path.split('/').pop() || ''))
      const clamped = Math.min(Math.max(idx, 0), fileKeys.length)
      fileKeys.splice(clamped, 0, fileKey)
      const mixed = [
        ...(props.node.folders || []).map(f => (f.path.split('/').pop() || '') + '/'),
        ...fileKeys
      ]
      await $fetch('/api/content/folder-order', { method:'POST', body:{ folder: props.node.path || '', order: mixed }, headers: authHeader() })
    } else {
      // append to end of files
      const mixed = [
        ...(props.node.folders || []).map(f => (f.path.split('/').pop() || '') + '/'),
        ...(props.node.leaves || []).map(l => (l.path.split('/').pop() || '')),
        fileKey
      ]
      await $fetch('/api/content/folder-order', { method:'POST', body:{ folder: props.node.path || '', order: mixed }, headers: authHeader() })
    }
    await refreshNuxtData('navTree')
    emit('reordered')
  }
  drag.value = { type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1 }
}

// Move into this folder (drop zone on folder header or top area)
async function onDropIntoFolder(){
  if(!drag.value.type) return
  try{
    if(drag.value.type === 'leaf'){
      await moveFile(drag.value.path, props.node.path)
    }else if(drag.value.type === 'folder'){
      await moveFolder(drag.value.path, props.node.path)
    }
  } finally {
    drag.value = { type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1 }
  }
}

// Move to parent folder (drop zone at bottom when depth>0)
async function onDropToParent(){
  if(!drag.value.type) return
  const parent = parentPath(props.node.path)
  try{
    if(drag.value.type === 'leaf'){
      await moveFile(drag.value.path, parent)
    }else if(drag.value.type === 'folder'){
      await moveFolder(drag.value.path, parent)
    }
  } finally {
    drag.value = { type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1 }
  }
}

async function saveMixedChildrenOrder(){
  const childKeys = [
    ...(props.node.folders || []).map(f => (f.path.split('/').pop() || '') + '/'),
    ...(props.node.leaves || []).map(l => (l.path.split('/').pop() || ''))
  ]
  await $fetch('/api/content/folder-order', { method:'POST', body:{ folder: props.node.path || '', order: childKeys }, headers: authHeader() })
  await refreshNuxtData('navTree')
  emit('reordered')
}

function authHeader(){
  if(props.token && typeof props.token === 'object' && props.token.value){ return { 'x-admin-pass': props.token.value } }
  if(props.token && typeof props.token === 'string'){ return { 'x-admin-pass': props.token } }
  return {}
}

async function moveFile(from, toFolder){
  await $fetch('/api/content/move', { method:'POST', body:{ from, toFolder }, headers: authHeader() })
  await saveMixedChildrenOrder()
}
async function moveFolder(fromFolderPath, toFolder){
  await $fetch('/api/content/move-folder', { method:'POST', body:{ from: fromFolderPath, toFolder }, headers: authHeader() })
  // Optimistic update: remove folder from old parent and add under new parent
  const seg = (fromFolderPath.split('/').pop() || '')
  removeFolderFromTree(rootRef.value, fromFolderPath)
  addFolderToTree(rootRef.value, toFolder, seg)
  await refreshNuxtData('navTree')
  emit('reordered')
}

const rootRef = inject('orderRootRef', ref(null))

function removeFolderFromTree(node, path){
  if(!node) return false
  const idx = (node.folders||[]).findIndex(f => f.path === path)
  if(idx >= 0){ node.folders.splice(idx,1); return true }
  for(const f of node.folders||[]){ if(removeFolderFromTree(f, path)) return true }
  return false
}
function addFolderToTree(node, parentPath, seg){
  if((node.path||'') === (parentPath||'')){
    const newNode = { name: seg, path: parentPath ? `${parentPath}/${seg}` : seg, folders: [], leaves: [] }
    node.folders.push(newNode)
    return true
  }
  for(const f of node.folders||[]){ if(addFolderToTree(f, parentPath, seg)) return true }
  return false
}

// Helpers
function parentPath(p){
  const segs = (p||'').split('/').filter(Boolean)
  segs.pop()
  return segs.join('/')
}

function titleFromSlug(s){ return (s||'').split('-').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ') }
const lastSeg = (rel) => (rel.split('/').pop() || '')
function folderForLeaf(leaf){
  const base = props.node.path || ''
  const name = (leaf.path.split('/').pop() || '')
  return base ? `${base}/${name}` : name
}
</script>

<style>
.fade-enter-active,.fade-leave-active{ transition: opacity .15s ease; }
.fade-enter-from,.fade-leave-to{ opacity:0; }
</style>
