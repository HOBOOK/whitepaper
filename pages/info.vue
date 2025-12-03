<template>
  <div class="container-page">
    <div class="grid grid-cols-1 lg:grid-cols-1 gap-6 py-0">
      <!-- 시스템 개요: 이 백서 사이트를 구동하는 시스템 정보 -->
      <section class="card p-8">
        <h1 class="text-2xl font-bold mb-3">시스템 개요</h1>
        <div class="prose">
          <p>이 사이트는 Nuxt 3와 @nuxt/content v2를 기반으로 정적/서버 렌더링을 지원하는 문서 시스템입니다. Tailwind CSS로 스타일링하며, 다크 모드와 검색, 목차(TOC), 관리자 편집 기능을 제공합니다.</p>

          <h3>기술 스택</h3>
          <ul>
            <li><strong>프레임워크</strong>: Nuxt 3</li>
            <li><strong>콘텐츠</strong>: @nuxt/content v2 (Markdown → Vue 렌더)</li>
            <li><strong>스타일</strong>: Tailwind CSS, NanumSquare 폰트</li>
            <li><strong>테마</strong>: @nuxtjs/color-mode (라이트/다크)</li>
          </ul>

          <h3>기능</h3>
          <ul>
            <li>사이드바 디렉터리 트리 자동 생성 (content/whitepaper 구조)</li>
            <li>우측 TOC 자동/동적 생성, 헤더 오프셋 스크롤</li>
            <li>검색 API(/api/search)로 제목/설명/본문 텍스트 검색</li>
            <li>관리자 모드: 문서 편집(탭 전환: Editor/Preview) 및 저장</li>
          </ul>

        </div>
      </section>

      <!-- 개발자 정보: 이 시스템을 개발한 개발자 소개 -->
      <section class="card p-8">
        <h1 class="text-2xl font-bold mb-3">개발자 정보</h1>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="(d, i) in devs" :key="i" class="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div class="flex items-center justify-between">
              <div class="text-base font-semibold">{{ d.name }}</div>
              <div class="text-xs text-gray-500">{{ d.role }}</div>
            </div>
            <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ d.bio }}</div>
            <div class="mt-2 flex gap-3 text-sm">
              <a v-if="d.email" :href="`mailto:${d.email}`" class="underline">{{ d.email }}</a>
              <a v-if="d.github" :href="d.github" target="_blank" class="underline">GitHub</a>
              <a v-if="d.site" :href="d.site" target="_blank" class="underline">Site</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Info' })

// 필요한 정보로 자유롭게 수정하세요.
const devs = [
  { name: '박경호', role: '팀장', bio: '바질컴퍼니 R&D Center · 플랫폼개발팀', email: 'ghp@vazilcompany.com', github: '', site: '' },
]
</script>
