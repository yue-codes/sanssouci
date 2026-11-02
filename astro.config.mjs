// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import preact from '@astrojs/preact';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Sin `output: 'server'`: todas las páginas se prerenderizan (HTML estático)
  // salvo las que declaren `export const prerender = false` (las de progreso).
  // El adaptador es el que permite esas páginas de servidor en Cloudflare Workers.
  // `imageService: "compile"`: las imágenes de `src/assets` se optimizan con sharp AL COMPILAR
  // (AVIF/WebP en varios tamaños). Sin esto, el adaptador usaría Cloudflare Images,
  // un servicio aparte (de pago) que habría que configurar en la cuenta.
  adapter: cloudflare({ imageService: "compile" }),

  // Variables de entorno validadas al compilar: si falta una o tiene mal formato,
  // el build falla con un mensaje claro. Se importan desde `astro:env/client`.
  // Son públicas a propósito (la clave publishable no protege nada: lo hace RLS).
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'client', access: 'public', url: true, endsWith: '.supabase.co' }),
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({ context: 'client', access: 'public', startsWith: 'sb_publishable_' }),
    },
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [preact()]
});
