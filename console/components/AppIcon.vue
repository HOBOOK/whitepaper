<template>
  <span :style="{ display: 'inline-flex', lineHeight: 0 }" aria-hidden="true">
    <svg v-if="name==='home'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11l9-7 9 7" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 21V11h6v10" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 21H3" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else-if="name==='megaphone'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 11v2a3 3 0 003 3h1l2 4h2l-1.5-3" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 8v8l-8-3H9a3 3 0 01-3-3 3 3 0 013-3h4l8-3v4z" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else-if="name==='scale'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3v3" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <path d="M6 6h12" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <path d="M7 6l-4 7a4 4 0 008 0L7 6z" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round"/>
      <path d="M17 6l4 7a4 4 0 11-8 0l4-7z" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round"/>
      <path d="M12 21V6" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='book'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <path d="M20 22H6.5A2.5 2.5 0 014 19.5V5.5A2.5 2.5 0 016.5 3H20v19z" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else-if="name==='clock'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" :stroke="color" :stroke-width="strokeWidth"/>
      <path d="M12 7v5l3 3" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else-if="name==='file-text'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round"/>
      <path d="M14 2v6h6" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round"/>
      <path d="M16 13H8M16 17H8M10 9H8" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='external-link'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3h7v7" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 14L21 3" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <path d="M21 14v7h-7" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <path d="M3 10v11h11" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='search'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" :stroke="color" :stroke-width="strokeWidth"/>
      <path d="M20 20l-3-3" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='sun'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" :stroke="color" :stroke-width="strokeWidth"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='moon'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else-if="name==='info'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" :stroke="color" :stroke-width="strokeWidth"/>
      <path d="M12 10v6" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <circle cx="12" cy="7" r="1" :fill="color" />
    </svg>
    <svg v-else-if="name==='menu'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M3 12h18M3 18h18" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='chat'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 9h8M8 12h5" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='account'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.5" :stroke="color" :stroke-width="strokeWidth"/>
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <svg v-else-if="name==='settings'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7h5.5M12.5 7H20" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <circle cx="10" cy="7" r="1.6" :stroke="color" :stroke-width="strokeWidth" fill="none"/>
      <path d="M4 12h3.5M9.5 12H20" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <circle cx="8.5" cy="12" r="1.6" :stroke="color" :stroke-width="strokeWidth" fill="none"/>
      <path d="M4 17h9.5M16.5 17H20" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <circle cx="15" cy="17" r="1.6" :stroke="color" :stroke-width="strokeWidth" fill="none"/>
    </svg>
    <svg v-else-if="name==='drag'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="7" r="1" :fill="color"/>
      <circle cx="15" cy="7" r="1" :fill="color"/>
      <circle cx="9" cy="12" r="1" :fill="color"/>
      <circle cx="15" cy="12" r="1" :fill="color"/>
      <circle cx="9" cy="17" r="1" :fill="color"/>
      <circle cx="15" cy="17" r="1" :fill="color"/>
    </svg>
    <svg v-else-if="name==='close'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
      <path d="M18 6L6 18" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"/>
    </svg>
    <!-- New chevron icons for collapsible folders -->
    <svg v-else-if="name==='chevron-right'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 6l6 6-6 6" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg v-else-if="name==='chevron-down'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9l6 6 6-6" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>
</template>

<script>
export default {
  name: 'AppIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 18 },
    color: { type: String, default: 'currentColor' },
    strokeWidth: { type: [Number, String], default: 1.8 }
  }
}
</script>
