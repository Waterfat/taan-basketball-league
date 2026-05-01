// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://waterfat.github.io',
  base: '/taan-basketball-league',
  trailingSlash: 'ignore',
  vite: {
    plugins: [tailwindcss()],
  },
});
