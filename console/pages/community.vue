<template>
  <div class="container-page">
    <div class="py-0 grid grid-cols-1 gap-6">
      <!-- Main: list or detail, with search and new post -->
      <section class="card p-6">
        <div v-if="!detail" class="mb-3 flex items-center gap-2">
          <input v-model="q" placeholder="검색" class="border rounded-lg px-3 py-2 text-sm text-gray-900 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" @keyup.enter="loadPosts"/>
          <button class="btn" @click="loadPosts"><app-icon name="search"/></button>
          <span class="flex-1"/>
          <button class="btn btn-primary "  @click="startNew">새 글</button>
        </div>

        <div v-if="err" class="text-xs text-red-600 mb-3">{{ err }}</div>

        <!-- Edit form (list context) -->
        <div v-if="!detail && editing" class="mb-6">
          <input v-model="form.title" placeholder="제목" class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <textarea v-model="form.body" placeholder="내용" class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm h-40 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          <div class="flex gap-2 mt-2">
            <button class="btn" @click="cancelEdit">취소</button>
            <button class="btn btn-primary" @click="savePost">저장</button>
          </div>
        </div>

        <!-- List table -->
        <div v-if="!detail">
          <div v-if="!editing && posts.length===0" class="text-sm text-gray-500">게시물이 없습니다. {{ admin ? '새 글 버튼을 눌러 첫 게시물을 작성해 보세요.' : '관리자 모드에서 새 글을 작성할 수 있습니다.' }}</div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500">
                  <th class="py-2 pr-3">제목</th>
                  <th class="py-2 px-3 w-24 text-center">작성자</th>
                  <th class="py-2 px-3 w-60 text-center">수정일</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in posts" :key="p.id" class="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" @click="openDetail(p)">
                  <td class="py-2 pr-3 font-medium">{{ p.title }} · <span class="text-gray-400 text-xs">({{ p.comments?.length || 0 }})</span> </td>
                  <td class="py-2 px-3 text-center">{{ p.author || 'anonymous' }}</td>
                  <td class="py-2 px-3 text-center">{{ new Date(p.updated).toLocaleString("ko-KR", { timeStyle: "short", dateStyle: "medium" }) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="my-3 flex items-center gap-2" v-if="!detail">
            <label class="text-xs text-gray-500">정렬</label>
            <select v-model="sort" class="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="updated">수정일</option>
              <option value="created">작성일</option>
              <option value="title">제목</option>
            </select>
            <select v-model="order" class="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
            <div class="flex-1"></div>
            <label class="text-xs text-gray-500">페이지</label>
            <button class="btn" :disabled="page===1" @click="prevPage">이전</button>
            <span class="text-xs text-gray-500">{{ page }} / {{ totalPages }}</span>
            <button class="btn" :disabled="page===totalPages" @click="nextPage">다음</button>
          </div>
        </div>

        <!-- Detail view -->
        <div v-else>
          <div class="mb-3 flex items-center gap-2">
            <button class="btn" @click="backToList">← 목록</button>
            <span class="text-xs text-gray-500">{{ detail.author || 'anonymous' }}</span>
            <span class="text-xs text-gray-500">· {{ new Date(detail.updated).toLocaleString() }}</span>
            <div class="flex-1"></div>
            <button v-if="canManagePost(detail)" class="btn" @click="editPost(detail)">편집</button>
            <button v-if="canManagePost(detail)" class="btn" @click="delPost(detail)">삭제</button>
          </div>

          <!-- Edit form in detail -->
          <div v-if="editing" class="mb-6">
            <input v-model="form.title" placeholder="제목" class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <textarea v-model="form.body" placeholder="내용" class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm h-40 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            <div class="flex gap-2 mt-2">
              <button class="btn" @click="cancelEdit">취소</button>
              <button class="btn btn-primary" @click="savePost">저장</button>
            </div>
          </div>

          <div v-else>
            <h1 class="text-xl font-bold mb-2">{{ detail.title }}</h1>
            <div class="prose whitespace-pre-wrap">{{ detail.body }}</div>
          </div>

          <div class="mt-6">
            <div class="text-sm font-semibold mb-2">댓글 {{ detail.comments?.length||0 }}</div>
            <div v-for="c in detail.comments" :key="c.id" class="text-sm text-gray-700 dark:text-gray-200 border rounded-lg px-3 py-2 mb-1">
              <div v-if="editCid!==c.id" class="whitespace-pre-wrap">{{ c.text }}</div>
              <textarea v-else v-model="cEdit" class="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              <div class="text-xs text-gray-500 flex items-center gap-2">
                <span>{{ c.author || 'anonymous' }} · {{ new Date(c.created).toLocaleString() }}</span>
                <span class="flex-1"></span>
                <button v-if="canManageComment(c)" class="underline" @click="startEditComment(c)" v-show="editCid!==c.id">수정</button>
                <button v-if="canManageComment(c)" class="underline" @click="removeComment(c)">삭제</button>
                <button v-if="editCid===c.id" class="underline" @click="saveComment(c)">저장</button>
                <button v-if="editCid===c.id" class="underline" @click="cancelEditComment">취소</button>
              </div>
            </div>
            <div class="flex gap-2 mt-2">
              <input v-model="reply[detail.id]" placeholder="댓글 입력" class="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" @keyup.enter="addComment(detail)"/>
              <button class="btn" @click="addComment(detail)">등록</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Community' })
import { useAdmin } from '@/composables/useAdmin'
const { admin, token } = useAdmin()

const q = ref('')
const posts = ref([])
const detail = ref(null)
const err = ref('')
const editing = ref(false)
const form = reactive({ id:'', title:'', body:'' })
const reply = reactive({})
const sort = ref('updated')
const order = ref('desc')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const editCid = ref('')
const cEdit = ref('')
const myIp = ref('')

function headers(){ return (admin?.value && token?.value) ? { 'x-admin-pass': token.value } : {} }

async function loadPosts(){
  try{
    const r = await $fetch('/api/community/posts',{ params:{ q:q.value, page: page.value, pageSize: pageSize.value, sort: sort.value, order: order.value }});
    posts.value = r.posts; total.value = r.total
  } catch(e){ err.value = (e && e.data && e.data.message) || '목록 로드 실패' }
}

function startNew(){ editing.value=true; detail.value=null; Object.assign(form,{ id:'', title:'', body:'' }) }
function cancelEdit(){ editing.value=false; if(detail.value) { Object.assign(form,{ id:'', title:'', body:'' }) } }
async function savePost(){
  try{
    if(form.id){
      const pid = form.id
      const idx = posts.value.findIndex(x => x.id === pid)
      const prev = idx > -1 ? { ...posts.value[idx] } : null
      const prevDetail = detail.value && detail.value.id===pid ? { ...detail.value } : null
      const now = Date.now()
      if(idx > -1){ posts.value[idx] = { ...posts.value[idx], title: form.title, body: form.body, updated: now } }
      if(detail.value && detail.value.id===pid){ detail.value = { ...detail.value, title: form.title, body: form.body, updated: now } }
      try{
        await $fetch(`/api/community/posts/${pid}`,{ method:'PUT', body:{ title: form.title, body: form.body }, headers: headers() })
      } catch (e){
        // revert on failure
        if(idx > -1 && prev){ posts.value[idx] = prev }
        if(prevDetail){ detail.value = prevDetail }
        throw e
      }
      editing.value=false
    } else {
      const res = await $fetch('/api/community/posts',{ method:'POST', body:{ title: form.title, body: form.body }, headers: headers() })
      const now = Date.now()
      const newPost = { id: res.id, title: form.title, body: form.body, author: 'anonymous', created: now, updated: now, comments: [] }
      posts.value = [newPost, ...posts.value]
      detail.value = newPost
      editing.value=false
    }
    // sync list silently
    await loadPosts()
  }catch(e){
    err.value = (e && e.data && e.data.message) || '저장 실패'
  }
}
function editPost(p){ editing.value=true; Object.assign(form, { id:p.id, title:p.title, body:p.body }) }
async function delPost(p){
  const idx = posts.value.findIndex(x => x.id === p.id)
  const removed = idx > -1 ? posts.value.splice(idx,1)[0] : null
  const prevDetail = detail.value
  if(prevDetail && prevDetail.id===p.id) detail.value = null
  try{
    await $fetch(`/api/community/posts/${p.id}`,{ method:'DELETE', headers: headers() })
    // sync list and pagination after delete
    if(posts.value.length===0 && page.value>1){ page.value-- }
    await loadPosts()
  }catch(e){
    // revert on failure
    if(removed){ posts.value.splice(idx,0,removed) }
    if(prevDetail && prevDetail.id===p.id) detail.value = prevDetail
    err.value = (e && e.data && e.data.message) || '삭제 실패'
  }
}

function canManageComment(c){
  if(admin?.value) return true
  return c.creatorIp && myIp.value && c.creatorIp === myIp.value
}
function startEditComment(c){ editCid.value = c.id; cEdit.value = c.text }
function cancelEditComment(){ editCid.value=''; cEdit.value='' }
async function saveComment(c){
  try{
    const pid = detail.value.id
    await $fetch(`/api/community/posts/${pid}/comments/${c.id}`,{ method:'PUT', body:{ text: cEdit.value }, headers: headers() })
    // optimistic UI update
    const idx = detail.value.comments.findIndex(x => x.id === c.id)
    if(idx > -1){
      detail.value.comments[idx] = { ...detail.value.comments[idx], text: cEdit.value }
    }
    // update list updated time locally
    const pIdx = posts.value.findIndex(x => x.id === pid)
    if(pIdx > -1){ posts.value[pIdx] = { ...posts.value[pIdx], updated: Date.now() } }
    editCid.value=''; cEdit.value=''
  } catch(e){ err.value = (e && e.data && e.data.message) || '댓글 수정 실패' }
}
async function removeComment(c){
  try{
    const pid = detail.value.id
    await $fetch(`/api/community/posts/${pid}/comments/${c.id}`,{ method:'DELETE', headers: headers() })
    // optimistic UI update: remove from detail
    detail.value.comments = (detail.value.comments||[]).filter(x => x.id !== c.id)
    // decrement count in list and update updated time
    const pIdx = posts.value.findIndex(x => x.id === pid)
    if(pIdx > -1){
      const cnt = Math.max(0, (posts.value[pIdx].comments?.length || 0) - 1)
      posts.value[pIdx] = { ...posts.value[pIdx], updated: Date.now(), comments: new Array(cnt) }
    }
  } catch(e){ err.value = (e && e.data && e.data.message) || '댓글 삭제 실패' }
}

async function addComment(p){
  try{
    const text = reply[p.id]; if(!text) return;
    const res = await $fetch(`/api/community/posts/${p.id}/comments`,{ method:'POST', body:{ text }, headers: headers() })
    reply[p.id]=''
    // update client state immediately
    if(detail.value && detail.value.id===p.id){
      detail.value.comments = [...(detail.value.comments||[]), res.comment]
    }
    await loadPosts()
  }catch(e){ err.value = (e && e.data && e.data.message) || '댓글 실패' }
}

function openDetail(p){ detail.value = p }
function backToList(){ detail.value = null }
function prevPage(){ if(page.value>1){ page.value--; loadPosts() } }
function nextPage(){ if(page.value<totalPages.value){ page.value++; loadPosts() } }

watch([sort, order], () => { page.value = 1; loadPosts() })
onMounted(async () => {
  await loadPosts()
  try{ const w = await $fetch('/api/whoami'); myIp.value = w.ip || '' }catch{}
})

function canManagePost(p){
  if(admin?.value) return true
  return p && p.creatorIp && myIp.value && p.creatorIp === myIp.value
}
</script>
