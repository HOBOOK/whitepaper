<template>
  <div class="container-page">
    <div class="grid grid-cols-1 lg:[grid-template-columns:minmax(0,1fr)_15rem] gap-6 py-0">
      <article class="card p-8">
        <div class="flex items-center gap-2 mb-3">
          <span class="flex-1"></span>
          <button class="btn" @click="openHistory">{{ $t('history.button') }}</button>
          <button class="btn" @click="startEdit" v-if="!isEditing">{{ $t('editor.edit') }}</button>
        </div>
        <div v-if="isEditing">
          <SegmentedTabs v-model="viewTab" :items="editorTabs" class="mb-3" />

          <div v-if="viewTab==='editor'">
            <textarea ref="editorRef" v-model="raw" class="w-full h-[60vh] rounded-xl border border-gray-200 focus:outline-none  dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"></textarea>
          </div>
          <div v-else class="prose min-h-[60vh]">
            <div v-html="previewHtml"></div>
          </div>

          <div class="mt-3 flex gap-2">
            <button class="btn" @click="cancelEdit">{{ $t('editor.cancel') }}</button>
            <button class="btn btn-primary" @click="saveEdit">{{ $t('editor.save') }}</button>
          </div>
          <div v-if="saveError" class="text-xs text-red-600 mt-2">{{ saveError }}</div>
        </div>
        <div v-else class="prose">
          <ContentRenderer v-if="doc" :value="doc" />
        </div>
      </article>
      <aside>
 
        <div class="toc-sticky">
          <TocCard v-if="doc" :doc="doc"/>
        </div>
        <div class="mb-2 flex justify-start fixed">
          <button class="card py-6 p-3 btn  rounded-full relative" @click="showComments=true"><app-icon name="chat" size="24"/> 
          <span v-if="comments && comments.length" class="absolute -right-2 top-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 border-2 border-white dark:border-gray-700  text-white text-xs">{{ comments.length }}</span>
          </button>
        </div>
      </aside>
    </div>

    <!-- Comments Drawer -->
    <transition name="fade">
      <div v-if="showComments" class="fixed inset-0 z-50 border-t ">
        <div class="absolute inset-0" @click="showComments=false"></div>
        <div class="absolute right-0 top-14 h-[calc(100vh-3.5rem)] w-[360px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl flex flex-col">
          <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div class="text-sm font-semibold">댓글 {{ (comments||[]).length }}</div>
            <button class="btn btn-sm" @click="showComments=false"><app-icon name="close"/></button>
          </div>
          <div class="flex-1 overflow-y-auto p-3">
            <div v-for="c in comments" :key="c.id" class="text-sm text-gray-700 dark:text-gray-200 border rounded-lg px-3 py-2 mb-2">
              <div v-if="editCid!==c.id" class="whitespace-pre-wrap">{{ c.text }}</div>
              <textarea v-else v-model="cEdit" class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              <div class="text-xs text-gray-500 flex items-center gap-2 mt-1">
                <span>{{ c.author || 'anonymous' }} · {{ new Date(c.created).toLocaleString() }}</span>
                <span class="flex-1"></span>
                <button v-if="canManageComment(c) && editCid!==c.id" class="underline" @click="startEditComment(c)">수정</button>
                <button v-if="canManageComment(c) && editCid!==c.id" class="underline" @click="removeComment(c)">삭제</button>
                <button v-if="editCid===c.id" class="underline" @click="saveComment(c)">저장</button>
                <button v-if="editCid===c.id" class="underline" @click="cancelEditComment">취소</button>
              </div>
            </div>
          </div>
          <div class="p-3 border-t border-gray-200 dark:border-gray-800">
            <div class="flex gap-2">
              <input v-model="newComment" placeholder="댓글 입력" class="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" @keyup.enter="addComment"/>
              <button class="btn" @click="addComment">등록</button>
            </div>
            <div v-if="cErr" class="text-xs text-red-600 mt-2">{{ cErr }}</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- History Modal -->
    <transition name="fade">
      <div v-if="showHistory" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="closeHistory"></div>
        <div class="relative card p-5 w-full max-w-5xl h-[85vh] flex">
          <div class="w-72 pr-3 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            <div class="text-sm font-semibold mb-2">{{ $t('history.versions') }}</div>
            <ul>
              <li v-for="v in versions" :key="v.id">
                <button class="text-left w-full px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" @click="loadVersion(v)">
                  <div class="text-xs font-mono truncate">{{ v.id }}</div>
                  <div class="text-[11px] text-gray-500">{{ formatTime(v.mtime) }}</div>
                </button>
              </li>
            </ul>
          </div>
          <div class="flex-1 pl-3 flex flex-col min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <div class="text-sm font-semibold">{{ $t('history.preview') }}</div>
              <span class="flex-1"></span>
              <SegmentedTabs v-model="verTab" :items="historyTabs" />
            </div>
            <div class="flex-1 min-h-0">
              <textarea v-if="verTab==='raw'" v-model="verRaw" class="h-full w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono"></textarea>
              <div v-else class="prose max-w-none h-full overflow-y-auto">
                <div v-html="verHtml"></div>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <button class="btn" @click="closeHistory">{{ $t('history.close') }}</button>
              <button class="btn btn-primary" v-if="admin" @click="restoreVersion">{{ $t('history.restore') }}</button>
              <button class="btn" @click="applyToEditor">{{ $t('history.apply') }}</button>
            </div>
            <div v-if="hErr" class="text-xs text-red-600 mt-2">{{ hErr }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { nextTick, ref, computed, onMounted } from 'vue'
import SegmentedTabs from '@/components/SegmentedTabs.vue'
import { ContentRenderer } from '#components'
import TocCard from '@/components/TocCard.vue'
import { useAdmin } from '@/composables/useAdmin'
const route = useRoute()
const { admin, token } = useAdmin()
const { t, locale: i18nLocale } = useI18n()

let mdRenderer = null
onMounted(async () => {
  const mod = await import('markdown-it')
  mdRenderer = new mod.default({ html: false, linkify: true, breaks: true })
})

const viewTab = ref('editor')
const editorTabs = computed(() => [
  { key: 'editor', label: t('editor.editor') },
  { key: 'preview', label: t('editor.preview') }
])

const { data: doc } = await useAsyncData(
  () => `doc-${route.params.slug}`,
  async () => await queryContent('whitepaper').where({ slug: route.params.slug }).findOne(),
  { watch: [() => route.params.slug] }
)

const isEditing = ref(false)
const raw = ref('')
const saveError = ref('')

const mdBody = computed(() => {
  const s = raw.value || ''
  const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return m ? s.slice(m[0].length) : s
})
const previewHtml = computed(() => mdRenderer ? mdRenderer.render(mdBody.value || '') : '')

async function startEdit(){
  const res = await $fetch(`/api/content/get`, { params: { slug: route.params.slug } })
  raw.value = res?.raw || ''
  isEditing.value = true
  viewTab.value = 'editor'
}
function cancelEdit(){ isEditing.value = false }

async function saveEdit(){
  try{
    saveError.value = ''
    const headers = {}
    if (admin?.value && token?.value) headers['x-admin-pass'] = token.value
    await $fetch(`/api/content/update`, { method: 'POST', body: { slug: route.params.slug, raw: raw.value }, headers })
    isEditing.value = false
    const updated = await queryContent('whitepaper').where({ slug: route.params.slug }).findOne()
    doc.value = updated
  }catch(e){ saveError.value = (e && e.data && e.data.message) || t('editor.save_failed') }
}

useHead(() => ({
  title: doc.value?.title || 'Document',
  meta: [
    { name: 'description', content: doc.value?.description || doc.value?.excerpt || 'Whitepaper document' }
  ]
}))

// Comments logic
const { data: comments } = await useAsyncData(
  () => `doc-comments-${route.params.slug}`,
  async () => {
    const r = await $fetch(`/api/docs/${route.params.slug}/comments`)
    return r?.comments || []
  },
  { watch: [() => route.params.slug] }
)
const newComment = ref('')
const cErr = ref('')
const editCid = ref('')
const cEdit = ref('')
const myIp = ref('')

function headers(){ return (admin?.value && token?.value) ? { 'x-admin-pass': token.value } : {} }
function canManageComment(c){ return (admin?.value) || (c?.creatorIp && myIp.value && c.creatorIp === myIp.value) }
function startEditComment(c){ editCid.value = c.id; cEdit.value = c.text }
function cancelEditComment(){ editCid.value=''; cEdit.value='' }

async function addComment(){
  try{
    const text = (newComment.value||'').trim(); if(!text) return
    const res = await $fetch(`/api/docs/${route.params.slug}/comments`,{ method:'POST', body:{ text }, headers: headers() })
    comments.value = [...(comments.value||[]), res.comment]
    newComment.value=''
  }catch(e){ cErr.value = (e && e.data && e.data.message) || '댓글 실패' }
}
async function saveComment(c){
  try{
    await $fetch(`/api/docs/${route.params.slug}/comments/${c.id}`,{ method:'PUT', body:{ text: cEdit.value }, headers: headers() })
    const idx = (comments.value||[]).findIndex(x => x.id === c.id)
    if(idx>-1){ comments.value[idx] = { ...comments.value[idx], text: cEdit.value } }
    editCid.value=''; cEdit.value=''
  }catch(e){ cErr.value = (e && e.data && e.data.message) || '댓글 수정 실패' }
}
async function removeComment(c){
  try{
    await $fetch(`/api/docs/${route.params.slug}/comments/${c.id}`,{ method:'DELETE', headers: headers() })
    comments.value = (comments.value||[]).filter(x => x.id !== c.id)
  }catch(e){ cErr.value = (e && e.data && e.data.message) || '댓글 삭제 실패' }
}

onMounted(async () => { try{ const w = await $fetch('/api/whoami'); myIp.value = w.ip || '' }catch{} })

const showComments = ref(false)

// History logic
const showHistory = ref(false)
const versions = ref([])
const verRaw = ref('')
const verTab = ref('preview')
const selectedVerId = ref('')
const hErr = ref('')
const historyTabs = computed(() => [
  { key: 'raw', label: t('history.raw') },
  { key: 'preview', label: t('history.preview') }
])

const verBody = computed(() => {
  const s = verRaw.value || ''
  const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return m ? s.slice(m[0].length) : s
})
const verHtml = computed(() => mdRenderer ? mdRenderer.render(verBody.value || '') : '')
function openHistory(){ showHistory.value = true; verTab.value='preview'; loadVersions() }
function closeHistory(){ showHistory.value = false; verRaw.value=''; selectedVerId.value=''; hErr.value='' }
async function loadVersions(){
  try{ const r = await $fetch('/api/content/versions', { params: { slug: route.params.slug } }); versions.value = r.items || [] }catch(e){ hErr.value = e?.data?.message || t('history.load_failed') }
}
async function loadVersion(v){
  try{
    selectedVerId.value = v.id
    const r = await $fetch(`/api/content/versions/${v.id}`, { params: { slug: route.params.slug } })
    verRaw.value = r.raw || ''
  }catch(e){ hErr.value = e?.data?.message || t('history.get_failed') }
}
async function restoreVersion(){ try{ if(!selectedVerId.value) throw new Error(t('history.no_selection')); await $fetch('/api/content/versions/restore', { method: 'POST', body: { slug: route.params.slug, id: selectedVerId.value }, headers: headers() }); closeHistory(); await startEdit(); }catch(e){ hErr.value = e?.data?.message || e?.message || t('history.restore_failed') } }
function applyToEditor(){
  if(!verRaw.value) return
  const content = verRaw.value
  // close history first for clear UX
  showHistory.value = false
  isEditing.value = true
  viewTab.value = 'editor'
  raw.value = content
  nextTick(() => { try{ editorRef.value && editorRef.value.focus() }catch{} })
}

function formatTime(ms){
  try{
    const l = i18nLocale?.value === 'en' ? 'en-US' : 'ko-KR'
    return new Date(ms||0).toLocaleString(l, { dateStyle: 'medium', timeStyle: 'short' })
  }catch{ return '' }
}
</script>
