// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        '@nuxt/content',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/color-mode',
        '@nuxtjs/i18n'
    ],
    app: {
        head: {
            titleTemplate: '%s · Platform Whitepaper',
            title: 'Home',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                { name: 'description', content: 'Platform Whitepaper' }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
            ]
        }
    },
    css: [
        '~/assets/css/tailwind.css'
    ],
    tailwindcss: {
        cssPath: '~/assets/css/tailwind.css'
    },
    colorMode: { classSuffix: '' },
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {}
        }
    },
    content: {
        documentDriven: false,
        highlight: false,
        markdown: {
            anchorLinks: false
        }
    },
    nitro: {
        compatibilityDate: '2025-12-03'
    },
    typescript: {
        strict: true,
        shim: false
    },
    runtimeConfig: {
        adminPassword: (globalThis as any).process?.env?.ADMIN_PASSWORD || 'vazil523320!',
        public: {
            adminEnabled: true
        }
    },
    i18n: {
        locales: [
            { code: 'ko', iso: 'ko-KR', name: 'Korean', file: 'ko.json' },
            { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
        ],
        defaultLocale: 'ko',
        langDir: 'locales',
        lazy: true,
        strategy: 'no_prefix',
        detectBrowserLanguage: false,
        fallbackLocale: 'ko'
    }
})
