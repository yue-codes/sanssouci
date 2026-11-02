# Camino del Flautista

Plan de práctica de flauta traversa convertido en juego: zonas con requisitos, jefes con condiciones de victoria (que incluyen grabar el video), logros organizados como árbol de habilidades y un plan de 90 días, del 2 de noviembre de 2026 al 30 de enero de 2027. Debajo del juego hay un temario serio: lectura, teoría, respiración, sonido, escalas, estudios y repertorio.

## Stack

- [Astro 7](https://astro.build) con TypeScript estricto y content collections (los datos del juego son JSON validados con Zod).
- [Tailwind CSS v4](https://tailwindcss.com) con tokens de diseño propios.
- [Preact](https://preactjs.com) + `@preact/signals` para las partes interactivas («islas»).
- Próximamente: Supabase (inicio de sesión y progreso por usuario) y Cloudflare Workers (despliegue).

## Comandos

Siempre con **pnpm**.

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala las dependencias |
| `pnpm dev` | Servidor de desarrollo en `localhost:4321` |
| `pnpm build` | Compila el sitio en `dist/` (la verificación principal) |
| `pnpm astro check` | Comprueba tipos y valida los JSON contra sus esquemas |
| `pnpm verificar` | Reglas entre archivos que los esquemas no ven (videos únicos, 90 días, sesiones…) |
| `pnpm generar-docs` | Regenera `docs/mapa.md`, `docs/catalogo.md` y `docs/plan-90-dias.md` desde los JSON |

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/plan.md`](docs/plan.md) | El plan: reglas del juego, cuidado del cuerpo, guía de la flauta y libros |
| [`docs/mapa.md`](docs/mapa.md), [`docs/plan-90-dias.md`](docs/plan-90-dias.md), [`docs/catalogo.md`](docs/catalogo.md) | Generados desde los JSON: no se editan a mano |
| [`docs/clasificar-cancion.md`](docs/clasificar-cancion.md) | Cómo añadir una canción nueva al catálogo |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Estructura del código y convenciones (carpetas, imports, colores, documentación) |
| [`docs/diseno-tecnico.md`](docs/diseno-tecnico.md) | El diseño técnico aprobado al inicio y las fases del proyecto |
| [`CLAUDE.md`](CLAUDE.md) | Contexto, decisiones y estado del proyecto (para Claude Code) |

## Dónde está cada cosa

- **Contenido del juego:** `src/data/*.json` (la fuente de verdad) y sus esquemas en `src/content.config.ts`.
- **Lógica:** `src/lib/` (funciones puras, sin interfaz).
- **Interfaz:** `src/components/` (por dominio), `src/layouts/` y `src/pages/`.
- **Colores y fuentes:** `src/styles/tokens.css`.

Detalle en [`docs/arquitectura.md`](docs/arquitectura.md).
