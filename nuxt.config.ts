import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['shadcn-nuxt'],

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },

  runtimeConfig: {
    // NUXT_ADMIN_TOKEN — reads the contributions at GET /api/reports.
    adminToken: '',
  },

  // Episode JSON files (written by `pnpm sync`) are bundled with the server
  // and loaded into SQLite at startup.
  nitro: {
    serverAssets: [{ baseName: 'episodes', dir: fileURLToPath(new URL('./data/episodes', import.meta.url)) }],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr', class: 'dark' },
      title: 'En boucle — les sons du podcast',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0c0b0a' },
        { name: 'description', content: 'Tous les morceaux conseillés dans En boucle, le podcast musical de TFTC, épisode par épisode, avec les liens d\'écoute.' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'><circle cx=\'16\' cy=\'16\' r=\'15\' fill=\'%23141210\'/><circle cx=\'16\' cy=\'16\' r=\'10\' fill=\'none\' stroke=\'%23f59e0b\' stroke-width=\'1.5\'/><circle cx=\'16\' cy=\'16\' r=\'3\' fill=\'%23f59e0b\'/></svg>',
        },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap',
        },
      ],
    },
  },
})
