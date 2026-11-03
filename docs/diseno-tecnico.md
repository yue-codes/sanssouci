> Diseño técnico aprobado por el usuario el 1-nov-2026 (copia versionada del plan de Claude Code).
> Estado de cada fase: ver la sección «Estado» de CLAUDE.md.
> Las cifras del análisis inicial (181 videos, unas 125 obras) son las de ese momento. La arquitectura del código tal como está hoy se describe en `docs/arquitectura.md`; donde este documento y aquel difieran, manda `docs/arquitectura.md`.

# Diseño: Sanssouci (contenido + datos + web)

## Contexto

Tienes un repo con la plantilla mínima de Astro 7 y `canciones.txt`, que son 181 videos de tu lista de YouTube. Ya saqué los metadatos reales de cada video con `yt-dlp` (canal, duración, descripción, etiquetas). Quieres tres cosas:

1. Clasificar las canciones y generar todo lo pactado en `CLAUDE.md`: el mapa de niveles y jefes, los 90 días, las guías y el catálogo.
2. Guardar la información de forma más profesional que unos `.md` sueltos.
3. Una web completa, con inicio de sesión, que guarde tu avance.

Decisiones que ya tomaste: **Supabase** (login y base de datos), **Cloudflare Workers** (alojamiento) y **varios usuarios** posibles.

Este documento es el diseño completo. No se escribe nada hasta que lo apruebes. Después se construye **por fases, con una pausa de revisión al final de cada una**.

---

## 1. Idea central: dos tipos de datos, dos lugares

| Tipo | Ejemplos | Dónde vive | Por qué |
|---|---|---|---|
| **Contenido** (igual para todos, cambia poco) | niveles, jefes, logros, canciones, los 90 días | Archivos JSON en el repo (`src/data/`), validados con **content collections** de Astro | Queda versionado en git, se revisa en cada commit, no necesita servidor y la validación detecta errores **al compilar** (por ejemplo, un `requiere` que apunta a un logro que no existe). |
| **Progreso** (distinto por usuario, cambia a diario) | días completados, logros obtenidos, jefes vencidos, estado de cada canción | **Supabase (Postgres)**, con seguridad por fila (RLS) | Cada usuario solo ve y modifica lo suyo. Se sincroniza entre dispositivos y escala a varias personas. |

Las dos partes se unen por **ids estables** (por ejemplo `logro-doble-picado`). La base de datos guarda «el usuario X obtuvo `logro-doble-picado`», no el texto del logro. Así puedes corregir descripciones o añadir canciones sin migrar la base de datos.

Esa es la «base de datos profesional»: el contenido con esquema validado y el progreso en Postgres.

---

## 2. Hallazgos de la lista (de los metadatos reales)

- Casi todo lo que parecía «sin flauta» **sí es flauta**; solo se ve en la descripción. Ejemplos: Primrose (banda con flauta), Swan Lake, Gate of Steiner, Liebesleid (Maxence Larrieu), Introducción y Rondó (Bouriakov), Estudio op. 25 nº 2 de Chopin (flauta, con respiración circular), y la medley de ロクデナシ.
- **De verdad sin flauta traversa:**
  - 20 Brothers: partitura de violín. Hay flauta en las líneas 19 y 169.
  - 91 Sayaka's Theme: sintetizador. Es la misma obra que *Decretum*, línea 90, que sí tiene flauta.
  - 113 y 114 Pavane de Fauré: orquesta. La flauta lleva la melodía.
  - 123 Zoltraak trío: arreglo de violín.
  - 152 四季折の羽: ensamble chino con dizi. Hay flauta en la 142.
  - 62 y 84: flauta dulce.
- **No son pieza:** 46 (meme de Haaland), 93 (meme de Carmen), 157 (ranking de Jasmine Choi; útil como recurso educativo). Las líneas 28, 47 y 51 son clips cortos de una obra real; quedan como versiones «clip» de esa obra.
- **Por identificar (te preguntaré):**
  - 86 «And she slayed» y 155 «Argh», de Monica Park: sin descripción.
  - 3 Mägo de Oz: sin descripción. Probablemente es flauta, pero no está confirmado.
- Resultado: unas **125 obras únicas** a partir de 181 videos.

---

## 3. Esquema de datos (`src/data/*.json` + `src/content.config.ts`)

Cada archivo es un arreglo de objetos con `id` y se carga con el loader `file()`. Las relaciones usan `reference()`, así que Astro **falla al compilar** si un id no existe. En Astro 7, `z` se importa de `astro/zod` (Zod v4); lo verifiqué en `node_modules/astro/dist/zod.d.ts`.

```
rutas.json      id, nombre, descripcion, color
niveles.json    id, orden, nombre, zona, resumen, temario{lectura,teoria,respiracion,sonido,escalas,estudios,repertorio},
                requisitosParaPasar: [ref logro], jefe: ref jefe, estimacion: "≈ 4–9 meses" (texto, no fecha)
jefes.json      id, nivel: ref, cancion: ref, version?: youtubeId, condicionVictoria{tempoBpm, criterios[], grabacion:true},
                requiere: [ref logro], final?: bool
logros.json     id, nombre, categoria (lectura|teoria|respiracion|sonido|tecnica|escalas|oido|habito|grabacion|repertorio),
                descripcion, criterio (verificable), requiere: [ref logro], nivelSugerido: ref
canciones.json  id, titulo, obra/franquicia, compositor?, categoria, ruta: ref, dificultad 1–10, nivel: ref,
                tecnicas: [ref logro], requiere: [ref logro], notas,
                versiones: [{ youtubeId, tituloVideo, canal, duracionSeg, usos:[partitura|referencia|de-oido|acompanamiento|tutorial|clip],
                              instrumentacion, dificultadArreglo?, nota? }]
extras.json     videos que no son pieza: id, youtubeId, tipo (flauta-dulce|meme|comentario|recurso|por-identificar), nota, obraRelacionada?
dias.json       id ("dia-01"), numero, fecha ISO, diaSemana, tipo (practica|descanso|festivo-opcional), fase (sin-flauta|con-flauta),
                semana, titulo, objetivo, bloques:[{tipo, minutos, actividad, recurso?}], logrosPosibles:[ref], jefe?: ref, notas?
```

- **Lo derivable no se guarda** (principio DRY). La URL del video se calcula a partir del `youtubeId`. «Es reto de oído» se calcula como «ninguna versión tiene partitura».
- Uso nombres en español para que los datos se lean de forma natural. Esto implica una corrección pendiente: `CLAUDE.md` pide `songs.json` y aquí lo llamo `canciones.json`, así que actualizaré `CLAUDE.md` para que coincida.

---

## 4. Mapa del juego

**Rutas** (ramas que se cruzan): Clásica · Ghibli · Videojuegos · Anime/Vocaloid/Ado/J-pop · Folk y mundo (folk, tango, cine/TV).

| # | Zona | Qué se domina (criterio de paso) | Jefe (con video) | Estimación |
|---|---|---|---|---|
| 0 | Pradera del Silencio (sin flauta) | Leer clave de sol con líneas adicionales, ritmo hasta corchea con puntillo, escalas mayores y armaduras en teoría, respiración, primera transcripción | **Enter Hallownest**: transcribir de oído y tocar en guitarra | Días 1–28 |
| 1 | Valle del Primer Aliento | Primer sonido estable, notas Si-La-Sol, registro grave, notas largas | **Wellerman** (registro grave) | ≈ día 62 |
| 2 | Aldea de las Melodías | Primera y segunda octava básica, escalas de Sol y Re mayor, picado simple | **Always With Me** | **Día 90** (30-ene-2027) |
| 3 | Bosque de las Escalas | Dos octavas sólidas, escalas mayores hasta 3 alteraciones, legato y staccato, Trevor Wye (Tono) a diario | **Merry-Go-Round of Life** | ≈ 4–9 meses |
| 4 | Ciudad del Ritmo | Semicorcheas, síncopa, escala cromática, todas las escalas mayores, escalas menores, tercera octava hasta Sol6 | **He's a Pirate** | ≈ 9–15 meses |
| 5 | Torre del Canto | Vibrato, tercera octava hasta Si6, dinámicas en todos los registros, Taffanel & Gaubert EJ 1 y 4 | **Por una Cabeza** | ≈ 1.5–2.5 años |
| 6 | Fortaleza de la Lengua | Doble y triple picado, velocidad, tercera octava completa | **Badinerie** (Bach) | ≈ 2–3 años |
| 7 | Ciudadela del Virtuoso | Repertorio de concierto: Romberg, Danse Macabre, Vivaldi | **Czardas** | ≈ 3–4+ años |
| 8 | Cumbre de Paganini | Virtuosismo extremo, respiración circular | **La Campanella** + **Capricho 24** (jefes finales) | ≈ 4–5+ años |

- **Retos secundarios:** las obras «de oído» (Karne Flute Covers y otras) son misiones de transcripción con la guitarra. Isabella's Lullaby y Enter Hallownest primero, porque son lentas.
- Del día 91 en adelante todo se mide por criterios de paso, no por fechas. Las estimaciones son orientativas y **lo que diga el maestro manda**.
- **~40 logros** con criterio verificable. Ejemplos: `logro-lectura-agudas`, `logro-primer-sonido`, `logro-escala-re-mayor-72bpm`, `logro-vibrato`, `logro-doble-picado`, `logro-racha-4-semanas`, `logro-primera-transcripcion`, `logro-primer-video-publicado`.

### Escala de dificultad 1–10 (criterio documentado para clasificar canciones nuevas)
| Nivel | Qué implica |
|---|---|
| 1–2 | Una octava en el registro grave o medio, figuras de negra y corchea, tempo lento |
| 3 | Uso de la segunda octava, puntillos, alteraciones sueltas |
| 4 | Dos octavas, semicorcheas a tempo moderado, síncopa |
| 5 | Toca la tercera octava, pasajes rápidos, saltos amplios |
| 6 | Tercera octava habitual, vibrato y expresión, J-pop rápido con modulaciones |
| 7 | Requiere doble picado o mucha velocidad (Cry Baby, Usseewa, Yoru ni Kakeru) |
| 8 | Repertorio avanzado (Badinerie, Danse Macabre, Romberg) |
| 9 | Virtuoso (Czardas, Verano de Vivaldi, Introducción y Rondó) |
| 10 | Extremo (La Campanella, Capricho 24, Estudio op. 25 nº 2, Six Trillion Years transcendental) |

Six Trillion Years se divide en dos obras: el cover normal (dificultad ≈ 7) y el arreglo transcendental (10).

> Honestidad: la dificultad se estima por la obra y el arreglo, no viendo cada partitura. El mismo tema varía mucho según el arreglo.

---

## 5. Los 90 días (`dias.json`)

- **65 sesiones** (lunes, martes, miércoles, viernes y sábado, de 20:00 a 22:00, 45–60 min) y **25 descansos** (jueves y domingo).
- **Festivos** marcados como sesión corta opcional: 25-dic y 1-ene. El 2-nov, Día de Muertos, es el día 1 y se mantiene con una sesión ligera.
- **Fase sin flauta**, semanas 1–4 (días 1–28):
  - Semana 1: test inicial de lectura y pentagrama.
  - Semana 2: ritmo y notas agudas.
  - Semana 3: armaduras, intervalos y digitación «al aire».
  - Semana 4: preparación y **jefe 0** (día 27).
- **Fase con flauta**, semanas 5–13 (días 29–90):
  - **Ventana de la primera clase:** la primera semana con flauta (días 29–34; día 33 de referencia), para que el maestro revise la flauta dentro del plazo de devolución. *Cambió el 2-nov-2026: antes eran los días 20–25.*
  - Revisión de la flauta, sonido solo con la cabeza en bloques cortos con descanso (para no marearte ni forzar los labios), Si-La-Sol y registro grave.
  - Segunda octava, Sol y Re mayor, picado.
  - **Jefe 1, Wellerman** (día 62). **Jefe 2, Always With Me** (día 90).
- Cada sesión sigue la estructura pactada: calentamiento → técnica/escalas → estudios → repertorio. Cada bloque lleva sus minutos.
- **La llegada de la flauta es una estimación** (30-nov). Si llega tarde, la fase con flauta se recorre por número de sesión: la web desplaza las fechas.

---

## 6. Documentos (`docs/`)

- `docs/plan.md`, escrito a mano: el mapa del juego (sección 4), una nota corta sobre grabar (el equipo de grabación queda fuera del proyecto), la guía de la flauta JP FL-430 (revisión al recibirla) y las preguntas para la primera clase.
- `docs/mapa.md`, `docs/catalogo.md` y `docs/plan-90-dias.md` se **generan** con `scripts/generar-docs.mjs` a partir de los JSON (`pnpm generar-docs`). Así hay una sola fuente de verdad: si cambias un dato, regeneras los documentos y no se desincronizan.
- `docs/clasificar-cancion.md`: la plantilla y el criterio para que pidas «clasifícame esta nueva».

---

## 7. La web

**Stack:** Astro 7 en modo servidor con `@astrojs/cloudflare`, Tailwind CSS v4, Preact (para las «islas» interactivas), `@supabase/supabase-js` + `@supabase/ssr` (sesión en cookies) y `@astrojs/check`.

**Páginas:**
| Ruta | Contenido |
|---|---|
| `/` | Inicio: qué es y acceso |
| `/entrar` | Inicio de sesión con correo y contraseña, crear cuenta y recuperar la contraseña (cambió el 3 nov 2026: antes, enlace mágico y Google) |
| `/panel` | Hoy: la sesión del día, racha, nivel actual, próximo jefe |
| `/mapa` | El camino como sendero: zona → jefe → zona, con su estado (bloqueada, actual, superada); lo cercano con detalle y lo lejano «en niebla» |
| `/arbol` | Árbol de talentos estilo RPG: ramas = categorías de logro, líneas = requisitos (conseguido, disponible, bloqueado) |
| `/niveles/[id]` | Detalle de cada nivel: temario, requisitos y jefe |
| `/jefes/[id]` | Detalle de cada jefe; en su página se registra la victoria con el link al video |
| `/calendario` | Los 90 días |
| `/dias/[n]` | Detalle de un día; ahí se marca la sesión como hecha, con minutos y notas |
| `/logros` | Lista de logros |
| `/canciones` y `/canciones/[id]` | Catálogo con filtros por ruta, dificultad, nivel y «de oído»; versiones con video incrustado |
| `/perfil` | Datos de tu cuenta |

- **Rendimiento:** las páginas de contenido se **prerenderizan**, porque son estáticas y muy rápidas. Las que muestran progreso se renderizan en el servidor. Un **middleware** comprueba la sesión y protege `/panel` y `/perfil`.
- **Organización del código:** ver `docs/arquitectura.md` (carpetas por dominio, funciones puras en `src/lib/`, islas de Preact indicadas en su cabecera). En la fase 4 se añadirán el cliente de Supabase en `src/lib/` y la función `racha(dias)`; `estaDesbloqueado` y `ordenZonaActual` (el «nivel actual») ya existen.

**Tablas en Supabase** (todas con `user_id` y RLS `auth.uid() = user_id`):
```
perfiles(id = auth.users.id, nombre, fecha_inicio, fecha_llegada_flauta)
dias_completados(user_id, dia_id, completado_en, minutos, notas)
logros_obtenidos(user_id, logro_id, obtenido_en, evidencia_url?)
victorias_jefe(user_id, jefe_id, video_url, tempo_logrado, vencido_en)
estado_canciones(user_id, cancion_id, estado: pendiente|aprendiendo|dominada, actualizado_en)
```
- `fecha_inicio` y `fecha_llegada_flauta` van por usuario: así el calendario sirve a otras personas y se ajusta cuando sepas la fecha real.
- El esquema se guarda como migraciones SQL en `supabase/migrations/`, versionadas en git.
- Las claves de Supabase van en `.env`, que no se sube a git, y en los secretos de Cloudflare. Configuración del proyecto y variables: `docs/supabase.md`.

**Diseño visual:** que se sienta videojuego. La fase 3 fijó la estructura (mapa del mundo que se sube de abajo arriba + árbol de talentos estilo RPG) con la paleta «Bosque». El 2 nov 2026 se cambió a la dirección **«Nocturno»** con paleta **«Cian»** (sacada de la imagen principal), **solo tema oscuro**: noche índigo, cian como marca, lavanda para lo disponible, menta para lo conseguido y rosa para los jefes. Tokens en `src/styles/tokens.css`; detalle y una nota por página en `docs/arquitectura.md`. Se mantienen la tipografía legible, el buen contraste, el foco visible para el teclado y el diseño que funciona primero en el móvil.

---

## 8. Fases de ejecución (con pausa de revisión en cada una)

1. **Datos:** `src/data/*.json`, `src/content.config.ts` y la instalación de `@astrojs/check`. Pausa para que revises la clasificación y me digas qué son las líneas 3, 86 y 155.
2. **Documentos:** `docs/plan.md`, `scripts/generar-docs.mjs` y los `.md` generados; actualización de `CLAUDE.md` con las decisiones nuevas. Pausa.
3. **Base de la web:** añadir Tailwind y Preact (el adaptador de Cloudflare se aplazó a cuando haga falta el modo servidor); layout, navegación y las páginas de contenido sin login. Pausa.
4. **Login y progreso:** proyecto de Supabase (lo creas tú en su web; te guío paso a paso), migraciones, middleware y las islas para marcar progreso. Pausa.
5. **Despliegue en Cloudflare Workers**, con una guía para ti.

Hago commits por fase solo si me los pides.

## Verificación

- `pnpm astro check`: comprueba tipos y valida los esquemas. Detecta referencias rotas entre JSON.
- `pnpm build`: compila todo el sitio, incluido el modo servidor de Cloudflare.
- Un script de comprobación verifica que:
  - cada video de `canciones.txt` aparezca exactamente una vez en `canciones.json` o `extras.json`;
  - haya 90 días, 65 de práctica, con jueves y domingo como descanso y el 30-ene-2027 como día 90.
- **No ejecuto `pnpm dev`.** Tú revisas la web en el navegador y me dices qué ves.
