<template>
  <div>
    <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <!-- Top bar -->
      <header
        class="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div class="container-page xl:max-w-7xl 2xl:max-w-7xl flex items-center h-14">
          <button
            class="lg:hidden mr-2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="drawer = !drawer" aria-label="Toggle Menu">
            <app-icon name="menu" />
          </button>
          <NuxtLink to="/" class="flex items-center">
            <img src="/logo.png" alt="logo" class="h-8 w-8 mr-2">
            <div class="leading-tight">
              <div class="text-sm font-semibold">트윈 Whitepaper</div>
            </div>
          </NuxtLink>
          <div class=" px-2 py-1 ml-2 hidden sm:block text-xs text-gray-500">Philosophy · Principles · Playbook</div>
          <div class="flex-1"></div>
          <button
            class="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 z-50"
            @click="toggleDark" aria-label="Toggle Theme">
            <app-icon :name="color.preference === 'dark' ? 'moon' : 'sun'" />
          </button>
        </div>
      </header>

      <!-- Body: sidebar inside main layout -->
      <div class="flex-1">
        <div class="container-page px-0 xl:max-w-7xl 2xl:max-w-7xl py-8 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-6">
          <!-- Sidebar (desktop) as placeholder -->
          <aside ref="asideRef" class="hidden lg:block relative z-40 w-60 lg:w-[15rem]">
            <!-- Fixed panel aligned to aside -->
            <div class="hidden lg:flex fixed flex-col text-sm pt-6"
                 :style="{ top: headerH + 'px', left: (sidebarReady ? (sidebarLeft + 'px') : '-9999px'), width: '15rem', height: `calc(100vh - ${headerH}px)` }">
              <div class="px-4 pb-2 pt-2">
                <search-box @search="onSearch" />
              </div>
              <div class="px-2 py-2">
                <NuxtLink to="/" :class="[navClass('/'), 'rounded-lg']">
                  <app-icon name="home" class="mr-2" />
                  <span>{{ $t('nav.home') }}</span>
                </NuxtLink>
                <NuxtLink to="/info" :class="[navClass('/info'), 'rounded-lg']">
                  <app-icon name="info" class="mr-2" />
                  <span>{{ $t('nav.info') }}</span>
                </NuxtLink>
                <NuxtLink to="/community" :class="[navClass('/community'), 'rounded-lg']">
                  <app-icon name="chat" class="mr-2" />
                  <span>{{ $t('nav.community') }}</span>
                </NuxtLink>
                <NuxtLink to="/settings" :class="[navClass('/settings'), 'rounded-lg']">
                  <app-icon name="settings" class="mr-2" />
                  <span>{{ $t('nav.settings') }}</span>
                </NuxtLink>
              </div>
              <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 flex flex-col flex-1 min-h-0">
                <div class="text-[10px] uppercase tracking-wide text-gray-500 mb-1 px-3">{{ $t('nav.documents') }}</div>
                <div class="px-2 pr-3 flex-1 min-h-0 overflow-y-auto overscroll-contain text-sm leading-snug">
                  <ClientOnly>
                    <content-nav :items="tree" />
                  </ClientOnly>
                </div>
              </div>
              <div class="py-1 my-3 mx-3 card border-gray-200 dark:border-gray-800">
                <button class="btn w-full btn-sm" @click="openAdmin"><app-icon name="account" class="mr-2" /> {{ $t('common.admin_mode') }}</button>
              </div>
            </div>
          </aside>

          <!-- Main content -->
          <main class="min-w-0">
            <slot />

            <div class="fixed bottom-0 left-0 py-2 right-0 z-20 backdrop-blur">
              <div class="text-center text-xs text-gray-500">
                © {{ new Date().getFullYear() }} Whitepaper
              </div>
            </div>
          </main>
        </div>
      </div>

      <!-- Mobile drawer -->
      <transition name="fade">
        <div v-if="drawer" class="fixed inset-0 z-40 lg:hidden">
          <div class="absolute inset-0 bg-black/40" @click="drawer = false"></div>
          <nav
            class="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-3 overflow-y-auto text-sm">
            <div class="flex items-center mb-3">
              <NuxtLink to="/" class="flex items-center" @click.native="drawer = false">
                <img src="/logo.png" alt="logo" class="h-8 w-8 mr-2">
                <div class="text-sm font-semibold">트윈 Whitepaper</div>
              </NuxtLink>
            </div>
            <search-box class="mb-2" @search="onSearch" />
            <NuxtLink to="/" :class="[navClass('/') , 'rounded-lg']" @click="drawer = false">
              <app-icon name="home" class="mr-2" /><span>{{ $t('nav.home') }}</span>
            </NuxtLink>
            <NuxtLink to="/info" :class="[navClass('/info'), 'rounded-lg']" @click="drawer = false">
              <app-icon name="info" class="mr-2" /><span>{{ $t('nav.info') }}</span>
            </NuxtLink>
            <NuxtLink to="/community" :class="[navClass('/community'), 'rounded-lg']" @click="drawer = false">
              <app-icon name="chat" class="mr-2" /><span>{{ $t('nav.community') }}</span>
            </NuxtLink>
            <NuxtLink v-if="admin" to="/settings" :class="[navClass('/settings'), 'rounded-lg']" @click="drawer = false">
              <app-icon name="settings" class="mr-2" /><span>{{ $t('nav.settings') }}</span>
            </NuxtLink>
          </nav>
        </div>
      </transition>

      <!-- Admin modal -->
      <transition name="fade">
        <div v-if="adminModal" class="fixed inset-0 z-50 flex items-center justify-center">
          <div class="absolute inset-0 bg-black/40" @click="adminModal = false"></div>
          <div class="relative card p-5 w-full max-w-sm">
            <div class="text-sm font-semibold mb-2">Enter admin password</div>
            <input v-model="pass" type="password"
              class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div class="mt-3 flex justify-end gap-2">
              <button class="btn" @click="adminModal = false">Cancel</button>
              <button class="btn btn-primary" @click="confirmAdmin">Confirm</button>
            </div>
            <div v-if="error" class="text-xs text-red-600 mt-2">{{ error }}</div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'
import SearchBox from '@/components/SearchBox.vue'
import ContentNav from '@/components/ContentNav.vue'
import { useRuntimeConfig } from '#app'
import { useAdmin } from '@/composables/useAdmin'
const color = useColorMode()
const route = useRoute()
const drawer = ref(false)
const { admin: adminState, token: tokenState, enable } = useAdmin()
const admin = computed(() => adminState.value)
const token = computed(() => tokenState.value)
const adminModal = ref(false)
const pass = ref('')
const error = ref('')

function titleFromSeg(seg) {
  return (seg || '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

// Build hierarchical navigation tree from content paths, excluding info-only docs
const { data: tree } = await useAsyncData('navTree', async () => {
  const list = await queryContent('whitepaper')
    .where({ _partial: { $ne: true } })
    .only(['_path', 'title', 'position', 'slug'])
    .find()
  const filtered = list.filter(n => n.slug !== 'overview' && n.slug !== 'developers')

  const root = []
  const map = new Map()
  const relPath = (p) => (p || '').replace(/^\/?whitepaper\//, '').replace(/^\//, '').replace(/\/$/, '')
  const decodeSeg = (s) => { try { return decodeURIComponent(s) } catch { return s } }

  for (const n of filtered) {
    const rel = relPath(n._path || '')
    const segsEnc = rel.split('/').filter(Boolean)
    let parent = root
    let keyPath = ''
    for (let i = 0; i < segsEnc.length - 1; i++) {
      keyPath += (keyPath ? '/' : '') + segsEnc[i]
      if (!map.has(keyPath)) {
        const node = { title: decodeSeg(segsEnc[i]), key: keyPath, _path: null, children: [] }
        map.set(keyPath, node)
        parent.push(node)
      }
      parent = map.get(keyPath).children
    }
    const leafTitle = n.title || decodeSeg(segsEnc[segsEnc.length - 1])
    const leaf = { title: leafTitle, _path: n._path, position: n.position || 999, children: [] }
    parent.push(leaf)
  }

  // Load folder order preferences
  let folderOrders = {}
  try{
    const res = await $fetch('/api/content/folder-order')
    folderOrders = res?.orders || {}
  }catch{}

  // Sort children within each folder by position (leaf docs), then title; folders by saved order or title
  const coll = new Intl.Collator('ko')
  function sortRec(nodes, parentKey=''){
    const folders = nodes.filter(n => !n._path)
    const leaves = nodes.filter(n => n._path)

    // Saved mixed children order e.g., ['chapter-1/','intro','guide'] where '/' suffix marks folder key seg
    const saved = folderOrders[parentKey] || []

    // If saved order exists, use it for mixed folder/file ordering
    if(saved.length > 0){
      // Build maps for quick lookup
      const folderMap = new Map(folders.map(f => [(f.key||'').split('/').pop() + '/', f]))
      const leafMap = new Map(leaves.map(l => {
        const path = (l._path||'').replace(/^\/?whitepaper\//,'')
        const key = (path.split('/').pop()||'').replace(/\.md$/,'')
        return [key, l]
      }))

      // Reorder nodes according to saved order, using alphabetical for unlisted items
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
      
      // Add remaining folders (alphabetically sorted)
      folders.filter(f => !used.has((f.key||'').split('/').pop() + '/')).sort((a,b) => coll.compare(a.title||'', b.title||'')).forEach(f => reordered.push(f))
      
      // Add remaining leaves (by position then alphabetically)
      leaves.filter(l => {
        const path = (l._path||'').replace(/^\/?whitepaper\//,'')
        const key = (path.split('/').pop()||'').replace(/\.md$/,'')
        return !used.has(key)
      }).sort((a,b) => {
        const ap = a.position ?? 999, bp = b.position ?? 999
        if(ap !== bp) return ap - bp
        return coll.compare(a.title||'', b.title||'')
      }).forEach(l => reordered.push(l))
      
      nodes.splice(0, nodes.length, ...reordered)
    } else {
      // Default behavior: folders first, then leaves (for backward compatibility)
      folders.sort((a,b) => coll.compare(a.title||'', b.title||''))
      leaves.sort((a,b) => {
        const ap = a.position ?? 999, bp = b.position ?? 999
        if(ap !== bp) return ap - bp
        return coll.compare(a.title||'', b.title||'')
      })
      nodes.splice(0, nodes.length, ...folders, ...leaves)
    }
    folders.forEach(f => { if(f.children && f.children.length) sortRec(f.children, f.key) })
  }
  sortRec(root, '')

  return root
})

watch(() => route.fullPath, () => { drawer.value = false })

function onSearch(q) { navigateTo({ path: '/search', query: { q } }) }
function toggleDark() { color.preference = color.preference === 'dark' ? 'light' : 'dark' }
function openAdmin() { adminModal.value = true; pass.value = ''; error.value = '' }
function confirmAdmin() {
  if (!pass.value) { error.value = 'Please enter password'; return }
  enable(pass.value)
  adminModal.value = false
}

const baseNav = 'flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800'
function navClass(path) {
  const active = path === '/' ? (route.path === '/') : route.path.startsWith(path)
  return active ? `${baseNav} bg-blue-50 text-blue-700 dark:bg-blue-900/30` : `${baseNav}`
}

const asideRef = ref(null)
const sidebarLeft = ref(0)
const headerH = 56 // h-14
const sidebarReady = ref(false)
function updateSidebarLeft() {
  if (!asideRef.value) return
  const rect = asideRef.value.getBoundingClientRect()
  sidebarLeft.value = rect.left + window.scrollX
}
onMounted(() => {
  updateSidebarLeft()
  sidebarReady.value = true
  window.addEventListener('resize', updateSidebarLeft)
})
onBeforeUnmount(() => { window.removeEventListener('resize', updateSidebarLeft) })

const { locale: i18nLocale } = useI18n()
import { useLocale } from '@/composables/useLocale'
const { locale } = useLocale()
watch(locale, (v) => { i18nLocale.value = (v || 'ko-KR').startsWith('en') ? 'en' : 'ko' }, { immediate: true })
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
