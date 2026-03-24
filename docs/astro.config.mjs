// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://0ktav.github.io',
  base: '/VeltryNora',
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ro', 'ru'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
