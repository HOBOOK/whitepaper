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

                    <div v-if="viewTab === 'editor'">
                        <textarea ref="editorRef" v-model="raw"
                            class="w-full h-[60vh] rounded-xl border border-gray-200 focus:outline-none  dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"></textarea>
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
                    <TocCard v-if="doc" :doc="doc" />
                </div>
                <div class="mb-2 flex justify-start fixed">
                    <button class="card py-6 p-3 btn rounded-full relative" @click="showComments = true"><app-icon
                            name="chat" size="24" />
                        <span v-if="comments && comments.length"
                            class="absolute -right-2 top-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-blue-600 border-2 border-white dark:border-gray-700 text-white text-xs">{{
                            comments.length }}</span>
                    </button>
                </div>
            </aside>
        </div>

        <!-- Comments Drawer -->
        <transition name="fade">
            <div v-if="showComments" class="fixed inset-0 z-50 border-t ">
                <div class="absolute inset-0" @click="showComments = false"></div>
                <div
                    class="absolute right-0 top-14 h-[calc(100vh-3.5rem)] w-[360px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl flex flex-col">
                    <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <div class="text-sm font-semibold">{{ $t('comments.title', { count: (comments || []).length }) }}
                        </div>
                        <button class="btn btn-sm" @click="showComments = false"><app-icon name="close" /></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-3">
                        <div v-for="c in comments" :key="c.id"
                            class="text-sm text-gray-700 dark:text-gray-200 border rounded-lg px-3 py-2 mb-2">
                            <div v-if="editCid !== c.id" class="whitespace-pre-wrap">{{ c.text }}</div>
                            <textarea v-else v-model="cEdit"
                                class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                            <div class="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                <span>{{ c.author || $t('common.anonymous') }} · {{ new Date(c.created).toLocaleString()
                                    }}</span>
                                <span class="flex-1"></span>
                                <button v-if="canManageComment(c) && editCid !== c.id" class="underline"
                                    @click="startEditComment(c)">{{ $t('comments.edit') }}</button>
                                <button v-if="canManageComment(c) && editCid !== c.id" class="underline"
                                    @click="removeComment(c)">{{ $t('comments.delete') }}</button>
                                <button v-if="editCid === c.id" class="underline" @click="saveComment(c)">{{
                                    $t('comments.save') }}</button>
                                <button v-if="editCid === c.id" class="underline" @click="cancelEditComment">{{
                                    $t('comments.cancel') }}</button>
                            </div>
                        </div>
                    </div>
                    <div class="p-3 border-t border-gray-200 dark:border-gray-800">
                        <div class="flex gap-2">
                            <input v-model="newComment" :placeholder="$t('comments.input_placeholder')"
                                class="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                @keyup.enter="addComment" />
                            <button class="btn" @click="addComment">{{ $t('comments.add') }}</button>
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
                                <button
                                    class="text-left w-full px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                    @click="loadVersion(v)">
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
                            <textarea v-if="verTab === 'raw'" v-model="verRaw"
                                class="h-full w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono"></textarea>
                            <div v-else class="prose max-w-none h-full overflow-y-auto">
                                <div v-html="verHtml"></div>
                            </div>
                        </div>
                        <div class="mt-3 flex gap-2">
                            <button class="btn" @click="closeHistory">{{ $t('history.close') }}</button>
                            <button class="btn btn-primary" v-if="admin" @click="restoreVersion">{{
                                $t('history.restore') }}</button>
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
import { nextTick, ref, computed, onMounted, watch } from 'vue'
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

const params = computed(() => route.params.slug)
const docPath = computed(() => Array.isArray(params.value) ? params.value.join('/') : String(params.value || ''))
const encDocPath = computed(() => (docPath.value || '').split('/').map(encodeURIComponent).join('/'))

const viewTab = ref('editor')
const editorTabs = computed(() => ([
    { key: 'editor', label: t('editor.editor') },
    { key: 'preview', label: t('editor.preview') }
]))

const { data: doc } = await useAsyncData(
    () => `doc-${docPath.value}`,
    async () => await queryContent('whitepaper').where({ _path: `/whitepaper/${docPath.value}` }).findOne(),
    { watch: [docPath] }
)

const isEditing = ref(false)
const raw = ref('')
const saveError = ref('')
const editorRef = ref(null)

const mdBody = computed(() => {
    const s = raw.value || ''
    const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
    return m ? s.slice(m[0].length) : s
})
const previewHtml = computed(() => mdRenderer ? mdRenderer.render(mdBody.value || '') : '')

async function startEdit() {
    const res = await $fetch(`/api/content/get`, { params: { path: docPath.value } })
    raw.value = res?.raw || ''
    isEditing.value = true
    viewTab.value = 'editor'
}
function cancelEdit() { isEditing.value = false }

async function saveEdit() {
    try {
        saveError.value = ''
        const headers = {}
        if (admin?.value && token?.value) headers['x-admin-pass'] = token.value
        await $fetch(`/api/content/update`, { method: 'POST', body: { path: docPath.value, raw: raw.value }, headers })
        isEditing.value = false
        const updated = await queryContent('whitepaper').where({ _path: `/whitepaper/${docPath.value}` }).findOne()
        doc.value = updated
    } catch (e) { saveError.value = (e && e.data && e.data.message) || t('editor.save_failed') }
}

useHead(() => ({
    title: doc.value?.title || 'Document',
    meta: [
        { name: 'description', content: doc.value?.description || doc.value?.excerpt || 'Whitepaper document' }
    ]
}))

// Helper to extract docId from raw front matter
function extractDocIdFromRaw(raw){
    const s = String(raw||'')
    const mm = s.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if(!mm) return ''
    const ff = mm[1]
    const m = ff.match(/(^|\n)docId\s*:\s*([^\n\r#]+)/)
    return m ? String(m[2]).trim() : ''
}

// Fetch docId once per path and cache
const { data: docIdData } = await useAsyncData(
    () => `docid-${docPath.value}`,
    async () => {
        try{ const r = await $fetch('/api/content/get', { params: { path: docPath.value } }); return extractDocIdFromRaw(r?.raw||'') }catch{ return '' }
    },
    { watch: [docPath] }
)
const docIdRef = computed(() => docIdData.value || '')

// Comments logic (docId-only)
const { data: comments } = await useAsyncData(
    () => `doc-comments-${docIdRef.value}`,
    async () => {
        const id = docIdRef.value
        if(!id) return []
        const r = await $fetch(`/api/comments`, { params: { docId: id } })
        return r?.comments || []
    },
    { watch: [docIdRef] }
)

const newComment = ref('')
const cErr = ref('')
const editCid = ref('')
const cEdit = ref('')
const myIp = ref('')

function headers() { return (admin?.value && token?.value) ? { 'x-admin-pass': token.value } : {} }
function canManageComment(c) { return (admin?.value) || (c?.creatorIp && myIp.value && c.creatorIp === myIp.value) }
function startEditComment(c) { editCid.value = c.id; cEdit.value = c.text }
function cancelEditComment() { editCid.value = ''; cEdit.value = '' }

async function addComment() {
    try {
        const text = (newComment.value || '').trim(); if (!text) return
        const id = docIdRef.value
        if(!id){ cErr.value = t('comments.failed'); return }
        const res = await $fetch(`/api/comments`, { method: 'POST', body: { docId: id, text }, headers: headers() })
        comments.value = [...(comments.value || []), res.comment]
        newComment.value = ''
    } catch (e) { cErr.value = (e && e.data && e.data.message) || t('comments.failed') }
}

async function saveComment(c) {
    try {
        const id = docIdRef.value
        if(!id){ cErr.value = t('comments.edit_failed'); return }
        await $fetch(`/api/comments/${c.id}`, { method: 'PUT', params: { docId: id }, body: { text: cEdit.value }, headers: headers() })
        const idx = (comments.value || []).findIndex(x => x.id === c.id)
        if (idx > -1) { comments.value[idx] = { ...comments.value[idx], text: cEdit.value } }
        editCid.value = ''; cEdit.value = ''
    } catch (e) { cErr.value = (e && e.data && e.data.message) || t('comments.edit_failed') }
}
async function removeComment(c) {
    try {
        const id = docIdRef.value
        if(!id){ cErr.value = t('comments.delete_failed'); return }
        await $fetch(`/api/comments/${c.id}`, { method: 'DELETE', params: { docId: id }, headers: headers() })
        comments.value = (comments.value || []).filter(x => x.id !== c.id)
    } catch (e) { cErr.value = (e && e.data && e.data.message) || t('comments.delete_failed') }
}

onMounted(async () => { try { const w = await $fetch('/api/whoami'); myIp.value = w.ip || '' } catch { } })

const showComments = ref(false)

// History logic
const showHistory = ref(false)
const versions = ref([])
const verRaw = ref('')
const verTab = ref('preview')
const selectedVerId = ref('')
const hErr = ref('')
const historyTabs = computed(() => ([
    { key: 'raw', label: t('history.raw') },
    { key: 'preview', label: t('history.preview') }
]))

const verBody = computed(() => {
    const s = verRaw.value || ''
    const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
    return m ? s.slice(m[0].length) : s
})
const verHtml = computed(() => mdRenderer ? mdRenderer.render(verBody.value || '') : '')
function openHistory() { showHistory.value = true; verTab.value = 'preview'; loadVersions() }
function closeHistory() { showHistory.value = false; verRaw.value = ''; selectedVerId.value = ''; hErr.value = '' }
async function loadVersions() {
    try { const r = await $fetch('/api/content/versions', { params: { slug: docPath.value } }); versions.value = r.items || [] } catch (e) { hErr.value = e?.data?.message || t('history.load_failed') }
}
async function loadVersion(v) {
    try {
        selectedVerId.value = v.id
        const r = await $fetch(`/api/content/versions/${v.id}`, { params: { slug: docPath.value } })
        verRaw.value = r.raw || ''
    } catch (e) { hErr.value = e?.data?.message || t('history.get_failed') }
}
async function restoreVersion() { try { if (!selectedVerId.value) throw new Error(t('history.no_selection')); await $fetch('/api/content/versions/restore', { method: 'POST', body: { slug: docPath.value, id: selectedVerId.value }, headers: headers() }); closeHistory(); await startEdit(); } catch (e) { hErr.value = e?.data?.message || e?.message || t('history.restore_failed') } }
function applyToEditor() {
    if (!verRaw.value) return
    const content = verRaw.value
    showHistory.value = false
    isEditing.value = true
    viewTab.value = 'editor'
    raw.value = content
    nextTick(() => { try { editorRef.value && editorRef.value.focus() } catch { } })
}

function formatTime(ms) {
    try {
        const l = i18nLocale?.value === 'en' ? 'en-US' : 'ko-KR'
        return new Date(ms || 0).toLocaleString(l, { dateStyle: 'medium', timeStyle: 'short' })
    } catch { return '' }
}
</script>
