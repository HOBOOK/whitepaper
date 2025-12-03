# Nuxt Whitepaper (Nuxt 2 + @nuxt/content + Vuetify)

A markdown-driven whitepaper website. No Tailwind required (avoids PostCSS/Tailwind 4 issues).

## Quick Start

```bash
# 1) Install
npm i

# 2) Dev
npm run dev

# 3) Build
npm run build

# 4) Static generate (optional)
npm run generate
```

## Structure

```
content/whitepaper/*.md  # Markdown pages
pages/*.vue              # Route pages
components/*.vue         # Shared components
layouts/default.vue      # App shell with sidebar and search
```

## Create a new page

Create `content/whitepaper/my-page.md`:

```md
---
title: My Page
slug: my-page
description: Short summary
position: 5
---

# My Page
Write in Markdown here.
```

Then access: `/docs/my-page`

## Why Nuxt 2 + Vuetify + @nuxt/content?
- Works with Vue 2 and your existing Vuetify 2 stack.
- No Tailwind/PostCSS conflicts.
- Markdown + full‑text search provided by @nuxt/content v1.
```

