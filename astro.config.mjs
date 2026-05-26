import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind({
    // Отключаем базовые стили Tailwind в пользу кастомного импорта в global.css
    applyBaseStyles: false, 
  })],
});