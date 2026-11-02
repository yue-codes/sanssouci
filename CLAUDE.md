# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Proyecto: Camino del Flautista (plan de 90 días + mapa de niveles y jefes + web en Astro)

> Este archivo es el traspaso de una conversación larga en claude.ai a Claude Code.
> Léelo completo antes de hacer nada. Todo lo de aquí ya fue decidido con el usuario salvo la sección "Pendiente".
> Junto a este archivo debe estar `canciones.txt` (lista de ~190 títulos sacada de su lista de YouTube con yt-dlp).

## 0. Estado técnico del repo y comandos

- Proyecto recién creado con la plantilla **minimal de Astro 7** (`astro ^7.4.4`, Node `>=22.23.4`). Solo existe `src/pages/index.astro`; TypeScript en modo `strict` (`tsconfig.json` extiende `astro/tsconfigs/strict`).
- **Aún no instalados:** Tailwind CSS ni Preact. Añádelos con `pnpm astro add tailwind` / `pnpm astro add preact` cuando toque (y explica qué cambia en `astro.config.mjs`).
- **Aún no existen:** `canciones.txt`, `docs/`, `src/data/`. Si falta `canciones.txt` al llegar a la sección 3.2, pídeselo al usuario en vez de inventar la lista.
- Comandos:
  - `pnpm install` — dependencias.
  - `pnpm build` — compila a `dist/`; es la forma de verificar que todo funciona.
  - `pnpm astro check` — chequeo de tipos de `.astro`/TS (requiere `@astrojs/check` y `typescript`; si faltan, el propio comando ofrece instalarlos).
  - No hay linter ni tests configurados todavía.
- **Conflicto con `AGENTS.md`:** ese archivo (generado por Astro) sugiere arrancar `astro dev --background`. **Ignóralo:** aquí manda la regla de la sección 1, nunca arranques el servidor de desarrollo.
- Ramas: se trabaja en `master` (la principal declarada es `main`). Haz commits solo cuando el usuario lo pida.

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
- **Primera clase con maestro:** entre los días 20 y 25 del plan (≈ 21 a 26 de noviembre de 2026), **antes de que llegue la flauta**.
- Quiere aprender a **transcribir de oído usando la guitarra**.
- Quiere **grabar y publicar videos**. Equipo: **Canon R50** (cámara) y algo para grabar audio. Sugerir micrófono externo en una etapa posterior (no urge).
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

## 3. Qué hay que producir (en este orden)

### 3.1 Plan principal (documento Markdown, `docs/plan.md`)
1. **Mapa de niveles y jefes de todo el camino hasta el jefe final**, estilo videojuego (ver sección 4).
2. **Los 90 días día por día**, con fecha real (2-nov-2026 a 30-ene-2027), respetando el horario. Solo días de práctica llevan sesión; jueves y domingo marcados como descanso.
3. **Guía de grabación de videos** con la Canon R50 (encuadre, luz, audio) y cuándo sumar micrófono.
4. **Guía de la flauta**: qué revisar al recibirla y preguntas para la primera clase.

### 3.2 Catálogo de canciones (`src/data/songs.json` + versión legible en `docs/catalogo.md`)
- Partiendo de `canciones.txt`, **agrupar por obra única**. Hay muchas repetidas (versiones, solo partitura, interpretaciones). Por cada obra: versiones disponibles y para qué sirve cada una (partitura, referencia de interpretación, o "de oído").
- Las marcadas **"flute cover by ear"** no traen partitura: úsalas como **retos de transcripción con la guitarra**.
- Marcar aparte lo que no es pieza para flauta traversa (versiones de flauta dulce, violín, clips que son solo comentario o meme) y no clasificarlo como pieza.
- Por obra: **dificultad (1 a 10), nivel del mapa, técnica requerida, categoría** (clásica, Ghibli, videojuegos, anime/Vocaloid/Ado, folk, etc.) y si requiere algo previo.
- Piezas claramente muy avanzadas en su lista: La Campanella, Capricho 24 de Paganini, Czardas, Verano de Vivaldi, Badinerie, Concierto de Romberg, Danse Macabre, Introducción y Rondó Caprichoso, Estudio op.25 nº2 de Chopin, el arreglo de "Six Trillion Years" de gran virtuosismo.
- El usuario añadirá canciones después y quiere poder pedir "clasifícame esta nueva": deja una **plantilla/criterio de clasificación documentado** para hacerlo de forma consistente.

### 3.3 Datos para la web (`src/data/*.json`)
Niveles, jefes, logros, canciones y días del plan, en JSON con ids estables y relaciones (por ejemplo `requiere: [logro-id, ...]`), listos para leer desde Astro sin reescribir nada. Propón y explica un esquema.

### 3.4 La web en Astro (después de lo anterior)
- El usuario la hará **con Claude Code en terminal**. Antes de escribir código, propón la estructura y espera su visto bueno.
- Ideas ya mencionadas: seguimiento de progreso, niveles, jefes, logros, calendario de los 90 días. Persistencia sencilla (por ejemplo localStorage) al inicio.
- Considera Astro content collections con validación de esquema y explica por qué.

## 4. Diseño del sistema estilo videojuego

- **Niveles (zonas)** de lo básico a lo avanzado, con **requisitos para pasar** de uno a otro.
- Cada nivel termina en un **jefe**: una canción de su lista con **condición de victoria clara**, por ejemplo tocarla completa y limpia con metrónomo a cierto tempo **y grabar el video** (grabar es parte de la victoria; los jefes incluyen grabación).
- **Logros** de técnica y hábitos: nombres de notas, primera octava, escalas, doble picado, tercera octava, vibrato, rachas de práctica, transcribir una melodía de oído, etc.
- Cada canción indica **qué desbloquear antes** (técnica o conocimiento).
- Debajo del juego hay un **temario serio**: lectura, teoría, respiración, sonido (embocadura), escalas, estudios y repertorio. El juego organiza el temario, no lo sustituye.
- **Jefes finales:** La Campanella y el Capricho 24 de Paganini, en un horizonte realista de **3 a 5+ años**.
- Ideas de rutas: clásicas, Ghibli, videojuegos, anime/Vocaloid/Ado. Pueden ser ramas del mapa que se cruzan.

### Estructura de cada sesión (45 a 60 min)
Calentamiento (aire/sonido) → escalas y técnica → estudios → repertorio motivador. Durante las semanas sin flauta, sustituir por lectura, teoría, respiración, oído y guitarra.

## 5. Fases de los primeros 90 días

- **Semanas 1 a 4 (2 nov a ~29 nov), sin flauta:** test inicial de lectura de notas (con foco en agudas), lectura desde cero con metrónomo, teoría (escalas mayores, armaduras, intervalos, ritmo), respiración y soplido sostenido, tabla de digitaciones "al aire", oído y transcripción con la guitarra, escuchar flautistas (Galway, Pahud, Rampal). **Primera clase ≈ 21 a 26 de noviembre.**
- **Semanas 5 a 13 (≈ 30 nov a 30 ene), con flauta:** revisión de la flauta, sonido y embocadura (Trevor Wye, Practice Book vol. 1: Tono), primeras notas y escalas, primeras piezas fáciles de su lista (p. ej. Always With Me, Merry-Go-Round of Life, Tetris, Bella Ciao, Wellerman), **primer jefe** con grabación al final de los 90 días.
- Ajustar la fecha real de llegada de la flauta cuando la sepa.
- Libro más adelante: Taffanel & Gaubert.

## 6. Reglas para producir el plan (importante)

- **Sé honesto con los tiempos.** Del día 91 en adelante, el camino se define por **criterios de paso** (por ejemplo "escala de Re mayor a X tempo con sonido limpio"), con **estimaciones** de tiempo, **no fechas inventadas**. Su progreso real y su maestro lo cambiarán todo.
- No prometas que logrará lo muy avanzado en poco tiempo. Es realista que tarde años.
- Cuida el cuerpo: sesiones sin forzar labios ni respiración al inicio; no más de lo recomendado.
- Cuando haya maestro, **lo que él diga manda** sobre el plan.
- Si un dato es incierto, dilo.

## 7. Pendiente

- Confirmar la **fecha real de llegada de la flauta** cuando la compre.
- Fecha de la primera clase (cuando consiga maestro).
- Micrófono para grabar: decidir más adelante.
- Lista de canciones: el usuario puede agregar más; clasificarlas con el mismo criterio.
