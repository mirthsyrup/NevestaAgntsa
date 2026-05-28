import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://mirthsyrup.github.io',
  base: '/NevestaAgntsa',
  integrations: [tailwind({
    // Отключаем базовые стили Tailwind в пользу кастомного импорта в global.css
    applyBaseStyles: false, 
  })],
});