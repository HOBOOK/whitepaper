<template>
  <div class="select-none">
    <!-- Folder header (shown for non-root folders) -->
        <div v-if="depth > 0" class="flex items-center gap-1 px-1 py-1.5 text-xs uppercase tracking-wide text-gray-500 transition-all duration-150 rounded-lg"
          :class="isDragOverThisFolder ? 'bg-blue-200 dark:bg-blue-900/50' : ''"
          @dragover.prevent
          @drop.prevent="isAdmin && onDropIntoFolder()"
          :draggable="isAdmin"
          @dragstart="isAdmin && onDragStartHeader($event)"
          @dragend="isAdmin && onDragEnd()">
      <button type="button" class="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-300" @click="toggle">
        <app-icon :name="isOpen ? 'chevron-down' : 'chevron-right'" class="mr-1" />
        <span class="truncate">{{ node.name || $t('order.root') }}</span>
      </button>
      <span class="flex-1"></span>
      <button v-if="isAdmin" class="btn btn-xs" @click.stop="$emit('new-folder', node.path || '')">+</button>
    </div>

    <transition name="fade" mode="out-in">
      <div v-show="depth === 0 || isOpen" :class="depth>0 ? 'ml-3' : ''"
           @dragenter.prevent="onDragEnterContainer"
           @dragleave.prevent="onDragLeaveContainer"
           @drop.prevent="onContainerDrop()">
        <!-- Drop area for root folder (always available) -->
        <div v-if="isAdmin && depth === 0" 
             class="mb-3 p-3 border-2 border-dashed rounded-lg transition-all duration-150"
             :class="isDragOverThisFolder ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'"
             @dragover.prevent="isDragOverThisFolder = true">
          <div class="text-center text-xs text-gray-500">{{ $t('order.drag_hint') || 'Drag items here' }}</div>
        </div>

        <!-- Drop area to move into this folder (top) -->
        <div v-if="isAdmin && depth > 0" 
             class="h-2 transition-colors duration-150 rounded"
             :class="isDragOverThisFolder ? 'bg-blue-400 dark:bg-blue-500' : 'bg-transparent'"
             @dragover.prevent></div>

        <!-- Combined list of folders and leaves -->
        <ul v-if="(node.folders && node.folders.length) || (node.leaves && node.leaves.length)" class="space-y-0">
          <!-- Render folders and leaves mixed together -->
          <template v-for="(item, itemIdx) in mixedChildren" :key="item.key">
            <!-- Drop zone above item -->
            <li v-if="isAdmin"
                class="h-3 transition-all duration-150 rounded cursor-pointer"
                :class="isDragOverDropZone === itemIdx ? 'bg-green-400 dark:bg-green-500' : 'bg-transparent'"
                @dragover.prevent="isDragOverDropZone = itemIdx"
                @dragenter.prevent="isDragOverDropZone = itemIdx"
                @dragleave.prevent="isDragOverDropZone = -1"
                @drop.prevent="onDropBetweenItems(itemIdx)"></li>
            
            <!-- Folder item -->
            <li v-if="item.type === 'folder'"
                class="transition-all duration-150 rounded-lg border-2 border-transparent"
                :class="isDragOverItem === itemIdx ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 shadow-md' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'"
                @dragover.prevent="onDragOverItem(itemIdx)"
                @dragleave.prevent="onDragLeaveItem(itemIdx)"
                @drop.prevent="onDropOnItem(itemIdx)">
              <OrderTree :node="item.node" 
                         :depth="depth+1" 
                         :admin="admin" 
                         :token="token" 
                         :node-order="nodeOrder"
                         :draggable="isAdmin"
                         @reordered="$emit('reordered')"
                         @dragstart="onDragStartFromChild"
                         @dragend="onDragEnd" />
            </li>
            
            <!-- Leaf (file) item -->
            <li v-else
                class="flex items-center justify-between border dark:border-gray-600 rounded-lg px-3 py-2 transition-all duration-150"
                :class="[isDragOverItem === itemIdx ? 'bg-blue-200 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 shadow-md' : 'bg-white dark:bg-gray-800']"
                :draggable="isAdmin"
                @dragstart="isAdmin && onDragStartItem(itemIdx)"
                @dragover.prevent="onDragOverItem(itemIdx)"
                @dragleave.prevent="onDragLeaveItem(itemIdx)"
                @drop.prevent="isAdmin && onDropOnItem(itemIdx)"
                @dragend="isAdmin && onDragEnd()">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 text-center text-xs text-gray-500 cursor-grab"><app-icon name="drag" /></div>
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{{ item.node.title || titleFromSlug(lastSeg(item.node.path)) }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ item.node.path }}</div>
                </div>
              </div>
            </li>
            </template>
            <!-- Final drop zone after last item -->
            <li v-if="isAdmin"
              class="h-3 transition-all duration-150 rounded cursor-pointer"
              :class="isDragOverDropZone === mixedChildren.length ? 'bg-green-400 dark:bg-green-500' : 'bg-transparent'"
              @dragover.prevent="isDragOverDropZone = mixedChildren.length"
              @dragenter.prevent="isDragOverDropZone = mixedChildren.length"
              @dragleave.prevent="isDragOverDropZone = -1"
              @drop.prevent="onDropBetweenItems(mixedChildren.length)"></li>
        </ul>        <!-- Drop area to move item up to parent folder -->
        <div v-if="isAdmin && depth > 0" 
             class="h-2 transition-colors duration-150 rounded"
             :class="isDragOverParent ? 'bg-green-400 dark:bg-green-500' : 'bg-transparent'"
             @dragover.prevent></div>
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
  token: { type: [String, Object], default: '' },
  nodeOrder: { type: Object, default: () => ({}) } // folderOrders from parent
})
const emit = defineEmits(['reordered','new-folder'])

const { t } = useI18n()

const isAdmin = computed(() => !!(props.admin && typeof props.admin === 'object' ? props.admin.value : props.admin))
const openState = useState('order-open', () => ({}))
const isOpen = computed(() => openState.value[props.node.path] ?? (props.depth < 2))
function toggle(){ openState.value[props.node.path] = !isOpen.value }

// Drag state
const drag = useState('order-dnd', () => ({ type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1, mixedIndex: undefined }))

// Local unified children order (persisted separately from folders/leaves)
const localChildrenOrder = ref(null)

const getLocalOrder = () => {
  if(!localChildrenOrder.value) return null
  return localChildrenOrder.value
}

// Watch nodeOrder changes to reset local cache
watch(() => props.nodeOrder, () => {
  localChildrenOrder.value = null
}, { deep: true })

const initializeLocalOrder = () => {
  if(!localChildrenOrder.value){
    // Build initial order from current folders and leaves
    const folders = props.node.folders || []
    const leaves = props.node.leaves || []
    const saved = props.nodeOrder[props.node.path || ''] || []
    
    const order = []
    
    if(saved.length > 0){
      // Build maps
      const folderMap = new Map(folders.map(f => [(f.path || '').split('/').pop() + '/', f]))
      const leafMap = new Map(leaves.map(l => {
        const fileKey = (l.path || '').split('/').pop() || ''
        return [fileKey, l]
      }))
      
      // Apply saved order
      const used = new Set()
      for(const key of saved){
        if(folderMap.has(key)){
          order.push({ type: 'folder', path: folderMap.get(key).path })
          used.add(key)
        } else if(leafMap.has(key)){
          order.push({ type: 'leaf', path: leafMap.get(key).path })
          used.add(key)
        }
      }
      
      // Add remaining folders
      for(const folder of folders){
        const folderKey = (folder.path || '').split('/').pop() + '/'
        if(!used.has(folderKey)){
          order.push({ type: 'folder', path: folder.path })
        }
      }
      
      // Add remaining leaves
      for(const leaf of leaves){
        const fileKey = (leaf.path || '').split('/').pop() || ''
        if(!used.has(fileKey)){
          order.push({ type: 'leaf', path: leaf.path })
        }
      }
    } else {
      // No saved order: just use current order
      for(const folder of folders){
        order.push({ type: 'folder', path: folder.path })
      }
      for(const leaf of leaves){
        order.push({ type: 'leaf', path: leaf.path })
      }
    }
    
    localChildrenOrder.value = order
  }
}

// Visual feedback for drag over states
const isDragOverLeaf = ref(-1)
const isDragOverFolder = ref(-1)
const isDragOverItem = ref(-1)
const isDragOverDropZone = ref(-1)
const isDragOverThisFolder = ref(false)
const isDragOverParent = ref(false)

// Mixed children (folders + leaves) for unified drag&drop
const mixedChildren = computed(() => {
  initializeLocalOrder()
  const order = getLocalOrder()
  if(!order) return []
  
  const items = []
  for(let i = 0; i < order.length; i++){
    const orderItem = order[i]
    let node = null
    let index = -1
    
    if(orderItem.type === 'folder'){
      const folderIdx = (props.node.folders || []).findIndex(f => f.path === orderItem.path)
      if(folderIdx >= 0){
        node = props.node.folders[folderIdx]
        index = folderIdx
      }
    } else {
      const leafIdx = (props.node.leaves || []).findIndex(l => l.path === orderItem.path)
      if(leafIdx >= 0){
        node = props.node.leaves[leafIdx]
        index = leafIdx
      }
    }
    
    if(node){
      items.push({ 
        type: orderItem.type, 
        node, 
        key: orderItem.type + '-' + orderItem.path, 
        index,
        path: orderItem.path
      })
    }
  }
  
  return items
})

// Leaf reordering within same folder

// Container drag handlers (for better drag state management)
let dragOverCounter = 0
function onDragEnterContainer(){
  dragOverCounter++
  isDragOverThisFolder.value = true
}

function onDragLeaveContainer(){
  dragOverCounter--
  if(dragOverCounter <= 0){
    isDragOverThisFolder.value = false
    isDragOverLeaf.value = -1
    isDragOverFolder.value = -1
    isDragOverParent.value = false
    dragOverCounter = 0
  }
}

function onDragOverFolder(idx){
  isDragOverFolder.value = idx
}

function onDragStartHeader(event){
  event.stopPropagation()
  drag.value = { type: 'folder', fromFolder: parentPath(props.node.path), path: props.node.path, leafIndex: -1, folderIndex: -1, mixedIndex: undefined }
}

function onDragStartItem(itemIdx){
  const item = mixedChildren.value[itemIdx]
  if(item?.type === 'leaf'){
    drag.value = { type: 'leaf', fromFolder: props.node.path, path: item.node.path, leafIndex: item.index, folderIndex: -1, mixedIndex: itemIdx }
  } else if(item?.type === 'folder'){
    // For folder: can reorder within same parent OR move to another folder
    drag.value = { type: 'folder', fromFolder: props.node.path, path: item.node.path, leafIndex: -1, folderIndex: item.index, mixedIndex: itemIdx }
  }
}

function onDragOverItem(itemIdx){
  isDragOverItem.value = itemIdx
  // Only visual feedback, actual reordering happens on drop
}

function onDragLeaveItem(itemIdx){
  if(isDragOverItem.value === itemIdx){
    isDragOverItem.value = -1
  }
}

async function onDropOnItem(itemIdx){
  isDragOverItem.value = -1
  if(!drag.value.type) return
  
  const targetItem = mixedChildren.value[itemIdx]
  if(!targetItem) return
  
  try {
    if(drag.value.type === 'leaf' && drag.value.fromFolder !== props.node.path){
      // Move file into target folder
      if(targetItem.type === 'folder'){
        await moveFile(drag.value.path, targetItem.node.path)
      }
    } else if(drag.value.type === 'leaf' && drag.value.fromFolder === props.node.path){
      // Reorder leaves within same folder
      initializeLocalOrder()
      const order = getLocalOrder()
      if(order){
        const draggedIdx = drag.value.mixedIndex
        if(draggedIdx !== undefined && draggedIdx !== itemIdx){
          const [moved] = order.splice(draggedIdx, 1)
          order.splice(itemIdx, 0, moved)
          await saveMixedChildrenOrder()
        }
      }
    } else if(drag.value.type === 'folder' && drag.value.fromFolder === props.node.path){
      // Reorder folders within same parent
      initializeLocalOrder()
      const order = getLocalOrder()
      if(order){
        // If mixedIndex is undefined, find it by matching path
        let draggedIdx = drag.value.mixedIndex
        if(draggedIdx === undefined){
          draggedIdx = mixedChildren.value.findIndex(item => item.path === drag.value.path)
        }
        if(draggedIdx !== undefined && draggedIdx !== itemIdx && draggedIdx >= 0){
          const [moved] = order.splice(draggedIdx, 1)
          order.splice(itemIdx, 0, moved)
          await saveMixedChildrenOrder()
        }
      }
    } else if(drag.value.type === 'folder' && drag.value.fromFolder !== props.node.path && targetItem.type === 'folder'){
      // Move folder into target folder
      await moveFolder(drag.value.path, targetItem.node.path)
    }
  } finally {
    drag.value = { type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1, mixedIndex: undefined }
    isDragOverItem.value = -1
  }
}

async function onDropBetweenItems(insertIdx){
  isDragOverDropZone.value = -1
  if(!drag.value.type) return
  
  try {
    // Only handle reordering within same folder
    if(drag.value.fromFolder === props.node.path){
      initializeLocalOrder()
      const order = getLocalOrder()
      if(order){
        // If mixedIndex is undefined, find it by matching path
        let draggedIdx = drag.value.mixedIndex
        if(draggedIdx === undefined){
          draggedIdx = mixedChildren.value.findIndex(item => item.path === drag.value.path)
        }
        if(draggedIdx !== undefined && draggedIdx !== insertIdx && draggedIdx !== insertIdx - 1 && draggedIdx >= 0){
          const [moved] = order.splice(draggedIdx, 1)
          
          // Calculate correct insert position
          let correctIdx = insertIdx
          if(draggedIdx < insertIdx){
            correctIdx = insertIdx - 1
          }
          
          order.splice(correctIdx, 0, moved)
          await saveMixedChildrenOrder()
        }
      }
    } else if(drag.value.type === 'folder'){
      // Moving folder from another parent to this folder at specific position
      // First move the folder, then reorder
      await moveFolder(drag.value.path, props.node.path)
    }
  } finally {
    drag.value = { type: null, fromFolder: '', path: '', leafIndex: -1, folderIndex: -1, mixedIndex: undefined }
  }
}
function onContainerDrop(){
  isDragOverThisFolder.value = false
  if(!drag.value.type) return
  onDropIntoFolder()
}

function onDragStartFromChild(event){
  // Forward drag events from child OrderTree components
  if(event.type === 'dragstart'){
    event.stopPropagation()
  }
}

function onDragLeaveFolder(cidx){
  if(isDragOverFolder.value === cidx){
    isDragOverFolder.value = -1
  }
}

// Move into this folder (drop zone on folder header or top area)
async function onDropIntoFolder(){
  isDragOverThisFolder.value = false
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
  isDragOverParent.value = false
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
  initializeLocalOrder()
  const order = getLocalOrder()
  if(!order) return
  
  // Build order array for API
  const orderArray = order.map(item => {
    const name = item.path.split('/').pop() || ''
    return item.type === 'folder' ? name + '/' : name
  })
  
  const folderPath = props.node.path || ''
  
  try {
    await $fetch('/api/content/folder-order', { 
      method:'POST', 
      body:{ folder: folderPath, order: orderArray }, 
      headers: authHeader() 
    })
    
    // Refresh nav tree in background without blocking UI
    refreshNuxtData('navTree').catch(e => console.error('[OrderTree] Failed to refresh navTree:', e))
  } catch (e) {
    console.error('[OrderTree] Failed to save order:', e)
    return
  }
  emit('reordered')
}

function authHeader(){
  if(props.token && typeof props.token === 'object' && props.token.value){ return { 'x-admin-pass': props.token.value } }
  if(props.token && typeof props.token === 'string'){ return { 'x-admin-pass': props.token } }
  return {}
}

async function moveFile(from, toFolder){
  await $fetch('/api/content/move', { method:'POST', body:{ from, toFolder }, headers: authHeader() })
  // Refresh nav tree in background without blocking UI
  refreshNuxtData('navTree').catch(e => console.error('[OrderTree] Failed to refresh navTree:', e))
  emit('reordered')
}
async function moveFolder(fromFolderPath, toFolder){
  // Prevent moving folder to the same parent (no-op)
  const fromParent = parentPath(fromFolderPath)
  if(fromParent === toFolder){
    console.log('[OrderTree] Folder already in target parent, skipping move')
    return
  }
  
  await $fetch('/api/content/move-folder', { method:'POST', body:{ from: fromFolderPath, toFolder }, headers: authHeader() })
  // Optimistic update: remove folder from old parent and add under new parent
  const seg = (fromFolderPath.split('/').pop() || '')
  removeFolderFromTree(rootRef.value, fromFolderPath)
  addFolderToTree(rootRef.value, toFolder, seg)
  // Refresh nav tree in background without blocking UI
  refreshNuxtData('navTree').catch(e => console.error('[OrderTree] Failed to refresh navTree:', e))
  emit('reordered')
  isDragOverFolder.value = -1
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

function onDragEnd(){
  isDragOverLeaf.value = -1
  isDragOverFolder.value = -1
  isDragOverItem.value = -1
  isDragOverDropZone.value = -1
  isDragOverThisFolder.value = false
  isDragOverParent.value = false
  dragOverCounter = 0
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
