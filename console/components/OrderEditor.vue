<template>
  <div>
    <div v-if="!admin" class="text-sm text-red-600">{{ $t('order.admin_only') }}</div>

    <div v-else>
      <div v-if="loading" class="text-sm text-gray-500">{{ $t('settings.loading') }}</div>
      <div v-else>
        <div class="text-xs text-gray-500 mb-2">{{ $t('order.drag_hint') }}</div>

        <div class="flex items-center gap-2 mb-3">
          <button class="btn btn-sm btn-primary p-2" @click="openCreateFolder">{{ $t('order.new_folder') || 'New Folder' }}</button>
        </div>

        <!-- Tree UI -->
        <div>
          <OrderTree :node="root" :depth="0" :admin="admin" :token="token" :node-order="folderOrders" @reordered="onReordered" @new-folder="openCreateFolder" />
        </div>

        <div class="mt-4 flex gap-2">
          <button class="btn" @click="reload" :disabled="saving">{{ $t('settings.refresh') }}</button>
        </div>
        <div v-if="error" class="text-xs text-red-600 mt-2">{{ error }}</div>
        <div v-if="saved" class="text-xs text-green-600 mt-2">{{ $t('settings.saved') }}</div>
      </div>
    </div>

    <!-- Create Folder Modal -->
    <transition name="fade">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="closeCreateFolder"></div>
        <div class="relative card p-5 w-full max-w-md">
          <div class="text-sm font-semibold mb-3">{{ $t('order.new_folder') || 'New Folder' }}</div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1">{{ $t('order.parent_path') || 'Parent folder (empty for root)' }}</label>
              <input v-model="targetParent" list="folder-options" class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. section/sub" />
              <datalist id="folder-options">
                <option v-for="p in folderOptions" :key="p" :value="p" />
              </datalist>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">{{ $t('order.folder_name') || 'Folder name' }}</label>
              <input v-model="newFolderName" class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. new-folder" @keyup.enter="confirmCreateFolder" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button class="btn" @click="closeCreateFolder">{{ $t('comments.cancel') || 'Cancel' }}</button>
            <button class="btn btn-primary" :disabled="!newFolderName" @click="confirmCreateFolder">{{ $t('settings.save') || 'Create' }}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
import OrderTree from '@/components/OrderTree.vue'
import { useAdmin } from '@/composables/useAdmin'
import { refreshNuxtData } from '#app'
const { admin, token } = useAdmin()
const { t } = useI18n()

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const root = reactive({ name: '', path: '', folders: [], leaves: [] })
const folderOrders = ref({})
provide('orderRootRef', ref(root))

const relFromPath = (p) => (p || '').replace(/^\/?whitepaper\//, '').replace(/^\//, '')
const folderOf = (rel) => (rel.split('/').slice(0,-1).join('/') || '')
const decodeSeg = (s) => { try { return decodeURIComponent(s) } catch { return s } }

function ensureFolderNode(parent, name, path){
  let node = parent.folders.find(f => f.path === path)
  if(!node){
    node = { type: 'folder', name, path, folders: [], leaves: [] }
    parent.folders.push(node)
  }
  return node
}

function buildTree(docs, folderOrders = {}){
  root.folders = []
  root.leaves = []
  for(const d of docs){
    const segs = (d.folder || '').split('/').filter(Boolean)
    let cur = root
    let acc = ''
    for(const seg of segs){
      acc += (acc ? '/' : '') + seg
      cur = ensureFolderNode(cur, decodeSeg(seg), acc)
    }
    cur.leaves.push({ path: d.path, title: d.title, position: d.position||999 })
  }
  
  // Apply saved folder/file order preferences
  const coll = new Intl.Collator('ko')
  function sortRec(node, parentKey = ''){
    const folders = node.folders || []
    const leaves = node.leaves || []
    const saved = folderOrders[parentKey] || []
    
    if(saved.length > 0){
      // Build maps for quick lookup
      const folderMap = new Map(folders.map(f => [(f.path || '').split('/').pop() + '/', f]))
      const leafMap = new Map(leaves.map(l => {
        const fileKey = (l.path || '').split('/').pop() || ''
        return [fileKey, l]
      }))
      
      // Reorder according to saved order
      const reordered = []
      const used = new Set()
      
      for(const key of saved){
        if(folderMap.has(key)){
          reordered.push(folderMap.get(key))
          used.add(key)
        } else if(leafMap.has(key)){
          reordered.push(leafMap.get(key))
          used.add(key)
        }
      }
      
      // Add remaining folders (alphabetically)
      folders.filter(f => !used.has((f.path || '').split('/').pop() + '/')).sort((a,b) => coll.compare(a.name||'', b.name||'')).forEach(f => reordered.push(f))
      
      // Add remaining leaves (by position then alphabetically)
      leaves.filter(l => {
        const fileKey = (l.path || '').split('/').pop() || ''
        return !used.has(fileKey)
      }).sort((a,b) => {
        const ap = a.position ?? 999, bp = b.position ?? 999
        if(ap !== bp) return ap - bp
        return coll.compare(a.title||'', b.title||'')
      }).forEach(l => reordered.push(l))
      
      node.folders = []
      node.leaves = []
      for(const item of reordered){
        if(item.folders !== undefined){
          node.folders.push(item)
        } else {
          node.leaves.push(item)
        }
      }
    } else {
      // Default: sort folders by name, leaves by position
      node.leaves.sort((a,b) => {
        const ap = a.position ?? 999, bp = b.position ?? 999
        if(ap !== bp) return ap - bp
        return coll.compare(a.title||'', b.title||'')
      })
      node.folders.sort((a,b) => coll.compare(a.name||'', b.name||''))
    }
    
    // Recurse into folders
    for(const f of node.folders || []){
      sortRec(f, f.path || '')
    }
  }
  sortRec(root, '')
}

async function load(){
  loading.value = true
  error.value = ''
  try{
    const list = await queryContent('whitepaper').where({ _partial: { $ne: true } }).only(['_path','title','position']).find()
    const mapped = list.map(n => {
      const rel = relFromPath(n._path||'')
      return { path: rel, title: n.title||'', position: n.position||999, folder: folderOf(rel) }
    })
    
    // Load folder order preferences
    try {
      const res = await $fetch('/api/content/folder-order')
      folderOrders.value = res?.orders || {}
    } catch {}
    
    buildTree(mapped, folderOrders.value)
  }catch(e){ error.value = t('common.error') || '에러' }
  finally{ loading.value = false }
}

function reload(){ load(); saved.value = false }
async function onReordered(){
  saved.value = true
  await Promise.all([
    load(), // reflect immediately in order editor
    refreshNuxtData('navTree') // refresh sidebar navigation
  ])
  setTimeout(() => saved.value = false, 1000)
}

// Refs used by folder creation modal
const showCreateModal = ref(false)
const targetParent = ref('')
const newFolderName = ref('')

// Build list of all existing folder paths for datalist
const folderOptions = computed(() => {
  const out = ['']
  function walk(node){ for(const f of node.folders||[]){ out.push(f.path || ''); walk(f) } }
  walk(root)
  return Array.from(new Set(out.filter(x => x !== undefined)))
})

function openCreateFolder(basePath){
  if(typeof basePath === 'string'){ targetParent.value = basePath }
  showCreateModal.value = true
}
function closeCreateFolder(){ showCreateModal.value = false }
async function confirmCreateFolder(){ await createFolder(); showCreateModal.value = false; newFolderName.value = '' }

async function createFolder(){
  try{
    const headers = (token && typeof token === 'object' && token.value) ? { 'x-admin-pass': token.value } : (typeof token === 'string' && token ? { 'x-admin-pass': token } : {})
    await $fetch('/api/content/folder/create', { method:'POST', body:{ parent: targetParent.value, name: newFolderName.value }, headers })
    await load()
  }catch(e){ alert((e && e.data && e.data.message) || 'Error') }
}

onMounted(load)
</script>
