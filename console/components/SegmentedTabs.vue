<template>
  <div ref="wrap" class="relative inline-flex items-center gap-0 p-1 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700" role="tablist">
    <!-- sliding thumb -->
    <div v-show="width>0"
         class="absolute top-1 bottom-1 left-1 rounded-lg bg-white dark:bg-gray-700 shadow-sm transition-all duration-200"
         :style="{ transform: `translateX(${left - 10}px)`, width: (width + 10) + 'px' }"></div>

    <button v-for="(it, i) in items" :key="it.key"
            :id="`tab-${uid}-${it.key}`"
            role="tab"
            :aria-selected="modelValue === it.key"
            :tabindex="modelValue === it.key ? 0 : -1"
            @click="select(it.key)"
            @keydown.left.prevent="move(-1)"
            @keydown.right.prevent="move(1)"
            :ref="el => setBtnRef(i, el)"
            class="relative px-3 py-1 z-10 rounded-lg text-sm whitespace-nowrap transition-colors text-center"
            :class="modelValue === it.key
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            :style="btnStyle">
      {{ it.label }}
    </button>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onBeforeUnmount, watch, computed } from 'vue'
const props = defineProps({
  modelValue: { type: String, required: true },
  items: { type: Array, required: true }, // [{ key, label }]
  equalize: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])
const uid = Math.random().toString(36).slice(2)
function select(k){ if(k !== props.modelValue) emit('update:modelValue', k) }
function move(dir){
  const keys = (props.items || []).map(x => x.key)
  const idx = Math.max(0, keys.indexOf(props.modelValue))
  const next = (idx + dir + keys.length) % keys.length
  emit('update:modelValue', keys[next])
}

const wrap = ref(null)
const btnRefs = ref([])
function setBtnRef(i, el){
  btnRefs.value[i] = el
  // observe newly mounted buttons as they appear/change
  if(ro && el){ try{ ro.observe(el) }catch{} }
}
const left = ref(0)
const width = ref(0)
const maxW = ref(0)
const btnStyle = computed(() => (props.equalize && maxW.value > 0) ? { width: maxW.value + 'px' } : {})

const H_INSET = 4 // px

async function updateMetrics(){
  await nextTick()
  const widths = (btnRefs.value || []).map(el => el ? el.getBoundingClientRect().width : 0)
  const widest = Math.max(0, ...widths)
  if(props.equalize && widest && widest !== maxW.value){
    maxW.value = widest
    await nextTick()
  }
  const idx = (props.items || []).findIndex(it => it.key === props.modelValue)
  const wrapEl = wrap.value
  const btn = btnRefs.value[idx]
  if(!wrapEl || !btn){ width.value = 0; left.value = 0; return }
  const wr = wrapEl.getBoundingClientRect()
  const br = btn.getBoundingClientRect()
  const baseW = props.equalize && maxW.value ? maxW.value : br.width
  width.value = Math.max(0, baseW - H_INSET * 2)
  left.value = (br.left - wr.left) + H_INSET
}

let ro = null
function setupResizeObserver(){
  if(typeof ResizeObserver === 'undefined') return
  ro = new ResizeObserver(() => { updateMetrics() })
  if(wrap.value){ try{ ro.observe(wrap.value) }catch{} }
  for(const el of (btnRefs.value||[])) if(el){ try{ ro.observe(el) }catch{} }
}

onMounted(() => {
  setupResizeObserver()
  updateMetrics()
  window.addEventListener('resize', updateMetrics)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMetrics)
  if(ro){ try{ ro.disconnect() }catch{} ro = null }
})

watch(() => props.modelValue, updateMetrics)
watch(() => props.items, () => { updateMetrics(); setupResizeObserver() }, { deep: true })
</script>
