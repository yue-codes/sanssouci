# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Proyecto: Sanssouci (antes «Camino del Flautista»; plan de 90 días + mapa de niveles y jefes + web en Astro)

> Empezó como traspaso de una conversación en claude.ai. Todo lo de aquí ya fue decidido con el usuario salvo la sección "Pendiente".
> El diseño técnico aprobado (fases 1–5) está en `docs/diseno-tecnico.md`.
> Se trabaja **por fases y con pausa de revisión al final de cada una**: no adelantes fases sin el visto bueno del usuario.
> **Lo que falta, paso a paso (empieza por aquí al retomar): `docs/hoja-de-ruta.md`.**

## Estado (actualízalo al cerrar cada fase)

| Fase | Estado |
|---|---|
| 1. Datos (`src/data`, esquemas, `pnpm verificar`) | ✅ hecha (commit `a70629b`) |
| 2. Documentos (`docs/`, `pnpm generar-docs`) | ✅ hecha (commit `5a31193`) |
| 3. Base de la web (Tailwind, Preact, layout, páginas de contenido) | ✅ hecha (pasos 0–6 y cierre, commits `ed4e419` a `457049d`). Dirección visual A + C, paleta «Bosque». Todas las páginas de contenido están hechas; `/panel`, `/entrar` y `/perfil` son de la fase 4. El adaptador de Cloudflare se instala cuando haga falta el modo servidor. |
| 4. Login y progreso (Supabase, migraciones, middleware, islas que guardan) | 🟡 **en curso**. Pasos 1, 2 y 4 de `docs/supabase.md` hechos: proyecto creado, `.env` verificado, instalados `@supabase/supabase-js`, `@supabase/ssr`, `@astrojs/cloudflare` y `wrangler` (adaptador en `astro.config.mjs`, salida estática por defecto + `prerender = false` en las páginas de progreso). Pasos 3 y 5 hechos: migraciones `progreso_inicial` y `permisos_minimos` aplicadas (cómo, en `docs/supabase.md` §5). Paso 6 con el código hecho (`src/lib/supabase.ts`, `src/middleware.ts`, `/auth/confirmar`, `/auth/salir`, `/entrar`; reglas en `docs/arquitectura.md` «Sesión y páginas de servidor»). Diseño de `/entrar` aprobado y login probado (el perfil se crea solo). `/panel` hecho con progreso real (`cargarProgresoUsuario`, `racha`, `hoyIso`); rediseñado después (ver fila siguiente). **Siguiente:** escribir progreso con Astro Actions (marcar día, logros, victorias, canciones), `/perfil` y que las páginas lean el progreso real; pasos a–g en `docs/hoja-de-ruta.md` §1. **Decidido el 3 nov 2026:** las 9 páginas leen el progreso con **Server Islands** (`server:defer`), así las imágenes se siguen optimizando al compilar; sin sesión, progreso vacío. **Paso a hecho y probado (3 nov 2026):** marcar y desmarcar días con Actions (`src/actions/index.ts`) y la primera Server Island (`sesion/MisionConProgreso.astro`). **Paso b hecho y probado:** logros desde el árbol (`conseguirLogro` / `quitarLogro`, isla `ArbolConProgreso`). **Paso c hecho y probado:** victorias con video (`registrarVictoria` / `anularVictoria`, isla `ArenaConProgreso`, que comparte el estado con la portada por `estadoJefe`). **Paso d hecho y probado:** avance por canción (`cambiarEstadoCancion`, `lib/estado-cancion.ts`, islas `CartaConProgreso` y `CatalogoConProgreso`). **Paso e hecho y probado:** `/perfil` (nombre, día 1 y llegada de la flauta; `validarPerfil`). **Paso f hecho (3 nov 2026):** todas las páginas leen el progreso real; `/`, `/mapa`, `/logros`, `/niveles/[id]` y `/calendario` pasaron a páginas de servidor (elegido por el usuario) con `progresoDeVisita` y `AvisoProgreso`; «faltan N días» del jefe en el navegador (`FaltanDias`); borrado `PROGRESO_EJEMPLO`. **Paso g cambiado (3 nov 2026):** sin Google; cuentas con correo y contraseña (`/entrar` con modos entrar / registro / recuperar, `/contrasena`, `lib/cuenta.ts`). Hecho y probado por el usuario; cerrar sesión también en `/perfil`. **Fase 4 completa salvo el commit/push; siguiente: fase 5** (`docs/hoja-de-ruta.md` §2). |
| Rediseño «Nocturno» (paleta «Cian») | ✅ **hecho y aprobado** (vistos buenos del 3 nov 2026). Base: tokens, solo tema oscuro, fuentes, imágenes con `astro:assets`, `motion` + Lenis, cabecera y pie. Las portadas con imagen usan `FondoPortada` (`components/ui/`). Detalle en `docs/arquitectura.md` («Colores, tipografía y tema», «Imágenes», «Movimiento» y una nota por página). |
| 5. Despliegue en Cloudflare Workers | ⏳ pendiente (pasos en `docs/hoja-de-ruta.md` §2) |

## 0. Estado técnico del repo y comandos

- **Astro 7** (`astro ^7.4.4`, Node `>=22.23.4`), TypeScript `strict`. **TypeScript 6** a propósito: `astro check` no admite TS 7 todavía.
- Comandos (no existe linter ni tests unitarios):
  - `pnpm build`: compila; es la verificación principal.
  - `pnpm astro check`: tipos y validación de los esquemas del contenido (incluidas las referencias rotas entre JSON).
  - `pnpm verificar`: reglas entre archivos que Zod no ve (cada video de `canciones.txt` aparece una sola vez, 90 días, 65 sesiones de 45 a 60 min, jueves y domingo de descanso, jefe ↔ nivel).
  - `pnpm auditar`: compila y revisa la accesibilidad del HTML de `dist/` (`scripts/auditar.mjs`). Pásalo al terminar páginas nuevas. Con el adaptador de Cloudflare las páginas prerenderizadas salen en `dist/client/` (el worker, en `dist/server/`); el script ya revisa esa carpeta. **Las páginas de servidor no salen ahí:** se auditan aparte (cómo, en `docs/arquitectura.md` «Accesibilidad»).
  - `pnpm optimizar-imagenes`: genera `src/assets/imagenes/` (WebP grande y `-mini`) desde `imagenes-originales/`. Las imágenes nuevas van en `imagenes-originales/`, nunca directo en `src/assets/`.
  - `pnpm generar-docs`: regenera `docs/mapa.md`, `docs/catalogo.md` y `docs/plan-90-dias.md` desde `src/data`. **Ojo:** el script no se llama `docs` porque `pnpm docs` es un comando propio de pnpm.
- Para editar `package.json` usa `pnpm pkg set …`, nunca `npm`.
- **Conflicto con `AGENTS.md`:** ese archivo (generado por Astro) sugiere arrancar `astro dev --background`. **Ignóralo:** nunca arranques el servidor de desarrollo.
- Ramas: se trabaja en `main` (sigue a `origin/main` en GitHub). El push lo hace el usuario (en esta terminal no hay credenciales de GitHub). Haz commits solo cuando el usuario lo pida.
- **Shell de las herramientas:** zsh. Entrecomilla las rutas con corchetes (`"src/pages/dias/[n].astro"`), o zsh las toma como patrón y el comando falla.

### Arquitectura de datos (decidida)

- **Contenido** (igual para todos): JSON en `src/data/` (`rutas`, `niveles`, `jefes`, `logros`, `canciones`, `extras`, `dias`). Cada archivo es un arreglo con `id` y se carga con el loader `file()` en `src/content.config.ts`. Las relaciones usan `reference()`, así que un id inexistente rompe el build. `z` se importa de `astro/zod` (Zod v4).
- **Los JSON son la fuente de verdad.** Los `.md` de `docs/` que dicen «generado» no se editan a mano. `docs/plan.md` (guías) y `docs/clasificar-cancion.md` (criterio para canciones nuevas) sí son manuales.
- **Lo derivable no se guarda:** la URL de YouTube sale de `youtubeId`; «reto de oído» = ninguna versión tiene `partitura` y alguna tiene `de-oido`.
- **Los ids son estables:** la base de datos de progreso los guarda. No los renombres.
- Regla de zona de una canción: va en la zona donde ya tienes lo que exige (dificultad 1–2 → nivel-2, 3 → 3, 4 → 4, 5 → 5, 6 → 6, 7–9 → 7, 10 → 8). Las canciones de jefe van en la zona de su jefe. Detalle en `docs/clasificar-cancion.md`.
- **Progreso** (por usuario): Supabase (Postgres + RLS). Tablas previstas: `perfiles` (incluye `fecha_inicio` y `fecha_llegada_flauta`), `dias_completados`, `logros_obtenidos`, `victorias_jefe` y `estado_canciones`, con migraciones en `supabase/migrations/`.

## 1. Sobre el usuario y cómo trabajar con él

- Tiene 30 años, habla español. Responde siempre en español.
- Es **principiante en programación y quiere aprender**: explica el **porqué** de cada decisión técnica y las buenas prácticas que apliques, sin volverlo un tutorial interminable.
- Sistema: Linux CachyOS, shell **fish** (ojo: la sintaxis de fish difiere de bash).
- Stack: **Astro (prioridad), Tailwind CSS y Preact.**
- Gestor de paquetes: **pnpm siempre**, nunca npm ni yarn.
- **NUNCA ejecutes `pnpm dev`.** Lo corre él. Para verificar, usa `pnpm build` / `pnpm astro check` si hace falta.
- Filosofía **DRY**: componentes pequeños y modulares, lógica reutilizable (hooks, utilidades), datos separados de la presentación.
- Diseño: moderno, profesional y equilibrado. Rico pero limpio, sin minimalismo extremo que dañe la usabilidad. Buenas prácticas actuales de UX/UI y accesibilidad.

## 2. Perfil musical y contexto

- De niño tocó lo básico de **saxofón alto** (ya no tiene el saxofón). En **guitarra** sabe acordes base y rasgueos básicos y la tiene a mano.
- **Lectura de partitura: casi desde cero.** Conoce los nombres de las notas pero lee muy despacio y olvidó las notas agudas. **Teoría desde cero.**
- 100% **autodidacta**, pero buscará un maestro presencial 1 clase por semana (en grupos y redes sociales).
- **Primera clase con maestro:** cambió el 2 de noviembre de 2026: será **cuando llegue la flauta** (≈ principios de diciembre, semana 5), no antes. En `src/data/dias.json` la ventana es la primera semana con flauta (días 29 a 34; el día 33 es el de referencia).
- Quiere aprender a **transcribir de oído usando la guitarra**.
- Quiere **grabar y publicar videos** (grabar es parte de cada jefe). **El equipo de grabación (cámara, micrófono, ajustes, manuales) queda fuera del proyecto: lo investiga él. No gastes recursos en eso.**
- Meta: ser un gran flautista traversa. Gusta de clásica, Ghibli, anime (openings, Vocaloid, Ado), videojuegos (Hollow Knight, Nier, Octopath, Tetris, Clair Obscur), folk (Wellerman, Bella Ciao).

### Horario (decidido)
- Práctica **lunes, martes, miércoles, viernes y sábado**, de **8:00 a 10:00 pm**, sesiones de **45 a 60 min**.
- **Descanso: jueves y domingo.**
- **Inicio: lunes 2 de noviembre de 2026 = Día 1.** El día 90 es el **sábado 30 de enero de 2027**.
- Zona horaria: America/Mexico_City.

### Flauta (decidido)
- Comprará la **Jean Paul FL-430** (~$7,000 MXN) **en aproximadamente 1 mes** (≈ principios de diciembre de 2026), con garantía y devolución. No comprará cabeza suelta antes.
- Datos verificados: plateada, agujeros abiertos con tapones (se toca con los tapones puestos), llave de sol desfasada y mecanismo de Mi dividido. Reseñas: buena relación precio-calidad pero con variación entre unidades (algún caso de zapatillas que no sellan y mecanismo algo lento).
- Plan: que el maestro la revise al recibirla (sellado, ajuste, afinación). Piensa **cambiarla en unos años** (señal típica: entre el año 2 y 3, la decide el maestro y su progreso).
- Se evaluaron Yamaha YFL-222HD y Jupiter JFL700R (~$15,000 MXN cada una); descartadas por precio por ahora.

## 3. Qué hay que producir

### 3.1 Plan y catálogo (hecho)
- `docs/plan.md`: reglas del juego, cuidado del cuerpo, guía de la FL-430 con las preguntas para la primera clase, y libros.
- `docs/mapa.md`, `docs/plan-90-dias.md` y `docs/catalogo.md`: generados desde `src/data`.
- Catálogo: 124 obras a partir de los 182 videos de `canciones.txt` (cifras al 2 nov 2026; crecen al añadir canciones) (metadatos sacados con `yt-dlp`). Lo que no es pieza para flauta traversa va en `extras.json`. Canciones nuevas: seguir `docs/clasificar-cancion.md`.

### 3.2 La web (fases 3–5)
- Decidido con el usuario: **Supabase** (login con **correo y contraseña**, registro abierto con confirmación por correo; el 3 nov 2026 sustituyó al enlace mágico y se descartó Google; Postgres con RLS), **Cloudflare Workers** (`@astrojs/cloudflare`, Astro en modo servidor) y **varios usuarios** (cada uno con su propio progreso).
- **El rendimiento no es prioridad:** usa **Preact a fondo** (páginas interactivas como componentes completos) y `@preact/signals` para el estado compartido entre islas.
- **Diseño:** el usuario quiere que impresione, con Tailwind (v4). La dirección visual ya está aprobada (ver 3.3). Para cambios visuales grandes, enséñale antes una muestra y espera su aprobación.
- Páginas previstas: `/`, `/entrar`, `/panel`, `/mapa`, `/arbol`, `/niveles/[id]`, `/jefes/[id]`, `/calendario`, `/dias/[n]`, `/logros`, `/canciones`, `/canciones/[id]`, `/perfil` y `/contrasena`. Middleware de sesión para las rutas privadas. Funciones puras en `src/lib/` (`estaDesbloqueado`, `estadoLogro`, `ordenZonaActual` y `racha`). Las páginas de cuenta (`/panel`, `/entrar`, `/perfil`, `/contrasena`) solo cargan datos; lo que se ve está en `src/components/cuenta/`.
- Las claves de Supabase van en `.env` (fuera de git; plantilla en `.env.example`: `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY`) y en los secretos de Cloudflare. Solo se usa la clave *publishable*; la *secret* nunca. RLS automática activada en el panel, pero cada migración activa RLS y crea sus reglas explícitamente. Detalle en `docs/supabase.md`.

### 3.3 Arquitectura del frontend (fase 3, ya en el código)

**Detalle completo y convenciones en `docs/arquitectura.md`** (estructura de carpetas, imports, tokens, documentación y nombres). Síguelo y actualízalo si cambia algo. Lo esencial:

- **Instalado:** Tailwind v4 (plugin de Vite en `astro.config.mjs`, sin `tailwind.config`), `@astrojs/preact` (Preact 11), `@preact/signals`, `lucide-preact` (iconos), `motion` + `lenis` (animación y scroll suave, vía `src/scripts/movimiento.ts`), `sharp` (imágenes al compilar) y fuentes de **Fontsource instaladas con `pnpm add`** (nunca Google Fonts): Instrument Serif (títulos, solo peso 400), Bricolage Grotesque (texto), Martian Mono (cifras y etiquetas) y Pixelify Sans (solo títulos cortos del árbol, clase `font-pixel`).
- **Imágenes:** originales en `imagenes-originales/`, optimizadas a mano con `pnpm optimizar-imagenes` hacia `src/assets/imagenes/` (cada una con su `mini`), catalogadas (alt, zona, jefe, ruta) en `src/config/imagenes.ts`; se pintan con `<Picture>` (AVIF + respaldo WebP).
- **Carpetas por dominio:** `src/components/{layout,ui,mapa,niveles,jefes,canciones,logros,calendario,sesion}`, lógica pura en `src/lib/`, scripts de página entera en `src/scripts/`, configuración del sitio (nombre, navegación, horario) en `src/config/sitio.ts`. Que un componente sea isla se decide al usarlo (`client:*`) y se indica en su cabecera.
- **Imports con alias `@/`** (→ `src/`, en `tsconfig.json`). `./` solo dentro de la misma carpeta; nunca `../`.
- **Dirección visual «Nocturno»** (elegida el 2 nov 2026 entre cuatro maquetas; sustituye a «Bosque») con **paleta «Cian»**, sacada de la imagen principal `anime-cian.webp` (el usuario la pidió así): noche índigo, texto rosa pálido, **cian como marca**, lavanda para lo disponible, menta para lo conseguido, rosa fuerte para los jefes. Las fotos cálidas llevan un velo cobalto (`.velo`). **Solo tema oscuro** (sin selector de tema). Toda la paleta en `src/styles/tokens.css`: paleta con nombre → semánticos.
- **Documentación del código:** cabecera `@file` / `@component` en cada archivo (en los `.tsx`, el JSDoc `@component` va justo encima de la función del componente), JSDoc (`@param`, `@returns`, `@example`) en todo lo exportado y comentario en cada prop. Comentarios internos solo para el porqué.
- **Funciones clave:** `cargarContenido()` en `src/lib/contenido.ts` (úsalo en vez de `getCollection` en cada página; tipo `Contenido`), `Progreso`, `estadoLogro`, `ordenZonaActual` y `estadoZona` en `src/lib/progreso.ts`, `construirSendero` / `siguientePaso` en `src/lib/mapa.ts`, `construirNodosArbol` en `src/lib/arbol.ts`, `logrosConEstado`, `usosDeLogros` y `avancePorCategoria` en `src/lib/logros.ts`, `jefesEnOrden` / `diaDelJefe` en `src/lib/jefes.ts`, `semanasDelPlan` / `hitosDelDia` / `sesionDeReferencia` en `src/lib/calendario.ts`, `resumirCancion` en `src/lib/canciones.ts`, filtros del catálogo en `src/lib/catalogo.ts`, URLs de YouTube en `src/lib/youtube.ts`, fechas en `src/lib/fechas.ts` y `duracion` en `src/lib/formato.ts`. **Una isla no puede importar (ni indirectamente) `@/lib/contenido`**, porque usa `astro:content`, que solo existe en el servidor: recibe datos planos por props (ver «Qué puede importar una isla» en `docs/arquitectura.md`). Progreso real: `progresoDeVisita(Astro.locals)` en `src/lib/progreso-usuario.ts` (nunca lanza; sin sesión, `PROGRESO_VACIO`) y el aviso `AvisoProgreso`; «hoy» con `diaDelPlanHoy` (`src/lib/fechas.ts`).
- **Estructura visual (de la fase 3, se mantiene): A + C.** `/mapa` como mapa del mundo que se sube de abajo arriba (zona → jefe como puerta con llaves → zona; lo cercano con detalle, lo lejano «en niebla») y `/arbol` como árbol de talentos estilo RPG (ramas = categorías de logro, líneas = `requiere`). En la portada, los 90 días son una partitura (`PartituraNoventaDias`).
- **Signals:** dentro de un componente usa `useSignal` y `useComputed`, no `signal` y `computed`.
- **«Hoy»:** en una página estática sería la fecha del build. Por eso lo que depende de «hoy» va en páginas de servidor (`diaDelPlanHoy`) o en una isla que lo calcula en el navegador (`FaltanDias`). Detalle en `docs/arquitectura.md` («Sesión y páginas de servidor»).
- **Accesibilidad mínima en cada componente:** foco visible, textos `sr-only` en los gráficos, `aria-*` en los controles y respeto de `prefers-reduced-motion`. Reglas completas en la sección «Accesibilidad» de `docs/arquitectura.md`.

## 4. Diseño del sistema estilo videojuego

- **Niveles (zonas)** de lo básico a lo avanzado, con **requisitos para pasar** de uno a otro.
- Cada nivel termina en un **jefe**: una canción de su lista con **condición de victoria clara**, por ejemplo tocarla completa y limpia con metrónomo a cierto tempo **y grabar el video** (grabar es parte de la victoria; los jefes incluyen grabación).
- **Logros** de técnica y hábitos: nombres de notas, primera octava, escalas, doble picado, tercera octava, vibrato, rachas de práctica, transcribir una melodía de oído, etc.
- Cada canción indica **qué desbloquear antes** (técnica o conocimiento).
- Debajo del juego hay un **temario serio**: lectura, teoría, respiración, sonido (embocadura), escalas, estudios y repertorio. El juego organiza el temario, no lo sustituye.
- **Jefes finales:** La Campanella y el Capricho 24 de Paganini, en un horizonte realista de **4 a 5+ años** (el mapa los pone en la zona 8).
- Ideas de rutas: clásicas, Ghibli, videojuegos, anime/Vocaloid/Ado. Pueden ser ramas del mapa que se cruzan.

### Estructura de cada sesión (45 a 60 min)
Calentamiento (aire/sonido) → escalas y técnica → estudios → repertorio motivador. Durante las semanas sin flauta, sustituir por lectura, teoría, respiración, oído y guitarra.

## 5. Fases de los primeros 90 días

- **Semanas 1 a 4 (2 nov a ~29 nov), sin flauta:** test inicial de lectura de notas (con foco en agudas), lectura desde cero con metrónomo, teoría (escalas mayores, armaduras, intervalos, ritmo), respiración y soplido sostenido, tabla de digitaciones "al aire", oído y transcripción con la guitarra, escuchar flautistas (Galway, Pahud, Rampal). **Primera clase: cuando llegue la flauta** (antes se había previsto entre el 21 y el 26 de noviembre).
- **Semanas 5 a 13 (≈ 30 nov a 30 ene), con flauta:** revisión de la flauta, sonido y embocadura (Trevor Wye, Practice Book vol. 1: Tono), primeras notas y escalas, primeras piezas fáciles de su lista (p. ej. Always With Me, Merry-Go-Round of Life, Tetris, Bella Ciao, Wellerman). **Tres jefes en los 90 días**, todos con grabación: jefe 0 (día 27, de oído y en guitarra), jefe 1 Wellerman (día 62) y jefe 2 Always With Me (día 90).
- Ajustar la fecha real de llegada de la flauta cuando la sepa.
- Libro más adelante: Taffanel & Gaubert.

## 6. Reglas para producir el plan (importante)

- **Sé honesto con los tiempos.** Del día 91 en adelante, el camino se define por **criterios de paso** (por ejemplo "escala de Re mayor a X tempo con sonido limpio"), con **estimaciones** de tiempo, **no fechas inventadas**. Su progreso real y su maestro lo cambiarán todo.
- No prometas que logrará lo muy avanzado en poco tiempo. Es realista que tarde años.
- Cuida el cuerpo: sesiones sin forzar labios ni respiración al inicio; no más de lo recomendado.
- Cuando haya maestro, **lo que él diga manda** sobre el plan.
- Si un dato es incierto, dilo.

## 7. Pendiente

Detalle técnico de lo que falta: `docs/hoja-de-ruta.md`. Datos que solo sabe el usuario:

- Confirmar la **fecha real de llegada de la flauta** cuando la compre.
- Fecha exacta de la primera clase (será al llegar la flauta, ≈ principios de diciembre).
- Lista de canciones: el usuario puede agregar más; clasificarlas con el mismo criterio.
