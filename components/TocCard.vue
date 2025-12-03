<template>
  <div v-if="headings.length" class="card mb-6">
    <div class="px-4 pt-3 text-sm font-bold">On this page</div>
    <nav class="p-2">
      <a
        v-for="(h,idx) in headings"
        :key="idx"
        :href="'#' + h.id"
        class="block px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        :class="{ 'bg-blue-50 dark:bg-blue-900/20': activeId===h.id }"
        @click.prevent="scrollTo(h.id)"
      >
        <span :class="[
          h.depth===2 ? 'text-sm font-medium' : (h.depth===3 ? 'text-sm text-gray-600 dark:text-gray-400' : 'text-xs text-gray-500'),
          activeId===h.id ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
        ]">
          {{ h.text }}
        </span>
      </a>
    </nav>
  </div>
</template>

<script setup>
const props = defineProps({ doc: { type: Object, required: true } })
const headings = ref([])
const activeId = ref('')

function slugify(text){
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\uAC00-\uD7A3\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function buildFromDoc(){
  const toc = props.doc?.body?.toc || props.doc?.toc || []
  if(Array.isArray(toc) && toc.length){
    headings.value = toc.map(h => ({ id: h.id || h.slug || h._id, text: h.text, depth: h.depth }))
  }
}

function buildFromDOM(){
  if(!process.client) return
  const nodes = Array.from(document.querySelectorAll('.prose h2, .prose h3'))
  const list = []
  for(const el of nodes){
    const text = el.textContent || ''
    let id = el.id
    if(!id){ id = slugify(text); el.id = id }
    const depth = Number(el.tagName.substring(1)) || 2
    list.push({ id, text, depth })
  }
  headings.value = list
}

function rebuild(){
  headings.value = []
  buildFromDoc()
  if(!headings.value.length) buildFromDOM()
  // after headings are ready, compute active
  if(process.client){
    requestAnimationFrame(updateActive)
  }
}

onMounted(() => {
  rebuild()
  if(process.client){
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
  }
})
watch(() => props.doc, () => rebuild(), { deep: true })
onBeforeUnmount(() => {
  if(process.client){
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
})

const headerOffset = 84
let ticking = false
function onScroll(){
  if(!ticking){
    ticking = true
    requestAnimationFrame(() => { updateActive(); ticking = false })
  }
}
function updateActive(){
  if(!process.client || !headings.value.length) return
  const y = window.scrollY + headerOffset + 1
  let current = headings.value[0]?.id || ''
  for(const h of headings.value){
    const el = document.getElementById(h.id)
    if(!el) continue
    const top = el.getBoundingClientRect().top + window.scrollY
    if(top <= y){ current = h.id } else { break }
  }
  activeId.value = current
}

function scrollTo(id){
  if(!process.client) return
  const el = document.getElementById(id)
  if(!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - headerOffset
  window.scrollTo({ top: y, behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
  activeId.value = id
}
</script>
