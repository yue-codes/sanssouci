# Fase 6: metodología sin maestro, después del día 90 y «¿cuándo puedo tocarla?»

> Propuesta del 3 nov 2026, **aprobada y construida el mismo día** (el usuario autorizó todo: «autorizado todo con tus consejos»). Lo que queda pendiente está en `docs/hoja-de-ruta.md` §0b.

## Decisiones del usuario (3 nov 2026)

| Tema | Decisión |
|---|---|
| Horario después del día 90 | Aún no lo sabe → el diseño debe permitir cambiarlo sin rehacer nada (se mantiene 5 días de 45–60 min). |
| Rutina después del día 90 | Lo decide Claude → **semanas tipo por zona** (ver 6.3). |
| Maestro | **Casi no existirá.** El plan debe funcionar sin él: Claude se encarga del temario y los criterios. |
| Clásicas recomendadas | **Todas** al catálogo. |
| Mejoras de metodología | **Aplicarlas todas.** |
| Tocar con otros | Aún no lo sabe (no cambia nada por ahora). |
| Inicio | **Empieza mañana, miércoles 4 nov 2026** (aún no ha hecho ninguna sesión). |
| Nuevo | Ver en un sitio de fácil acceso **cuándo podrá tocar cada canción** (ver 6.5). |
| Arranque (elegido) | **Opción A:** semana 0 el 4, el 6 y el 7 de nov; **día 1 = lunes 9 nov 2026**, día 90 = sábado 6 feb 2027. |
| «¿Cuándo puedo tocarla?» (elegido) | **A** (próximas en el panel) + **C** (aviso al conseguir un logro) + **D** (línea de tiempo `/repertorio`). Sin la fecha en cada carta (B) ni la insignia (E). |

---

## Riesgos: lo que se rompería si se hace sin cuidado

| # | Riesgo | Dónde | Cómo se evita |
|---|---|---|---|
| R1 | **La fecha de inicio vive en dos sitios.** `/`, `/mapa`, `/calendario`, `/niveles/[id]` y «faltan N días» en `/jefes/[id]` calculan «hoy» con la fecha del día 1 de `dias.json`; `/panel` y `/perfil` usan la `fecha_inicio` de tu perfil. Si cambian por separado, el panel dice «día 3» y el mapa «día 1». | `pages/*`, `FaltanDias.tsx` | 6.0: mover las dos a la vez y que `/perfil` avise si no coinciden. |
| R2 | `pnpm verificar` tiene fijos: 90 días, 65 sesiones, día 90 = 30 ene 2027. | `scripts/verificar-datos.mjs` | Derivar la fecha final del día 1 (día 1 + 89) en vez de escribirla a mano. |
| R3 | **Festivos ligados a fechas** (25 dic y 1 ene) y la nota del Día de Muertos del día 1. Al mover las fechas caen en otro día del plan. | `dias.json` | Script que reprograma y vuelve a marcar los festivos por fecha. |
| R4 | Días marcados como hechos **en las pruebas** (fase 4) quedarían en tu progreso. | Supabase, `dias_completados` | Desmarcarlos en la web antes de empezar (botón «deshacer» de cada día). |
| R5 | El esquema de `dias` solo admite del 1 al 90 (`numero.max(90)`). Lo de después del 90 no cabe ahí. | `content.config.ts` | Colección nueva (`semanas`), sin tocar `dias`. |
| R6 | **El maestro aparece en 22 textos de datos** (logros, jefes, niveles y días), en criterios como «el maestro lo aprueba», y en un bloque `clase` (días 29–34). Sin maestro, esos logros no se podrían conseguir nunca. | `logros`, `jefes`, `niveles`, `dias.json`, `docs/plan.md` | 6.1: cambiar cada criterio por una prueba que puedas comprobar tú solo. |
| R7 | Cada canción nueva necesita **un video** (`versiones.min(1)`), una línea en `canciones.txt` y aparecer una sola vez (lo comprueba `verificar`). | `canciones.json`, `canciones.txt` | 6.4: buscar cada video con `yt-dlp` y seguir `docs/clasificar-cancion.md`. |
| R8 | Los **ids son estables** (los guarda la base de datos). Renombrar uno borra tu progreso de ese elemento. | todos los JSON | Solo se **añaden** ids; los existentes solo cambian de texto o de requisitos. |
| R9 | Añadir requisitos a un logro existente puede dejar **bloqueado** uno que ya tienes (el servidor respeta `requiere`). | `logros.json`, `actions/` | Hoy no tienes logros, así que no pasa nada. Desde mañana, solo añadir requisitos a logros de zonas que aún no alcanzas. |
| R10 | Una categoría de logro nueva sería **una rama nueva del árbol** (cambio visual grande). | `CATEGORIAS_LOGRO`, `/arbol` | Los estudios entran en las ramas existentes (`tecnica`, `sonido`, `repertorio`). |
| R11 | Los documentos generados quedan desfasados. | `docs/mapa.md`, `catalogo.md`, `plan-90-dias.md` | `pnpm generar-docs` al final de cada subfase con datos. |

**Comprobación al cerrar cada subfase:** `pnpm verificar`, `pnpm astro check`, `pnpm build` y `pnpm auditar` (y las páginas de servidor aparte, como dice `docs/arquitectura.md`).

---

## 6.0 Arranque (urgente: antes de tu primera sesión)

**Problema:** el plan dice día 1 = lunes 2 nov, y tú empiezas el miércoles 4. Opciones:

| Opción | Cómo queda | A favor | En contra |
|---|---|---|---|
| **A. Semana 0 y día 1 = lunes 9 nov** (recomendada) | Todo el plan se mueve 7 días (día 90 = sábado 6 feb 2027). El 4, el 6 y el 7 de nov haces una **«semana 0» de arranque**: preparar las apps (metrónomo, afinador, musictheory.net), la primera respiración y conocer la web. | Se mueve todo en bloque: días de la semana, descansos, semanas del calendario y 65 sesiones intactos. Empiezas mañana igual. | El test inicial del día 1 llega el lunes 9. La flauta (≈ semana 5) se esperaría hacia el 7 dic. |
| B. Día 1 = miércoles 4 nov | Se reescriben todas las fechas. | Empiezas por el día 1 mañana mismo. | 90 días desde un miércoles dan **64 sesiones** (hay que fusionar dos), la semana 1 queda partida y cambian el verificador y el calendario. Más riesgo. |
| C. Seguir con el 2 nov y saltar los días 1–2 | Mañana harías el día 3. | No se toca nada. | Pierdes el test inicial y la base de la semana 1. No recomendable. |

**Con A se hace:**
1. Script `scripts/reprogramar-dias.mjs <lunes>`: reescribe `fecha`, `diaSemana` y festivos en `dias.json`; queda para usarlo otra vez si hiciera falta.
2. `verificar`: día 1 en lunes y día 90 = día 1 + 89 (sin fecha fija).
3. Contenido de la semana 0: 3 sesiones cortas, **fuera** de los 90 días (en la portada y en el panel como «Antes de empezar»).
4. Tú: en `/perfil`, día 1 = 9 nov; desmarcar los días de prueba (R4).
5. `/perfil` avisa si tu `fecha_inicio` no coincide con la del plan (R1).
6. Actualizar CLAUDE.md, `docs/plan.md` y la hoja de ruta con las fechas nuevas.

---

## 6.1 Metodología sin maestro

Principio nuevo (sustituye a «lo que diga el maestro manda»): **tú te evalúas con pruebas objetivas** (metrónomo, afinador y grabación). Si algún día tomas una clase, lo que diga ese maestro sigue mandando sobre el plan.

**Protocolo de autoevaluación** (sustituye a «el maestro lo aprueba»):
1. **Grabar** la prueba (video frontal; de lado para la postura).
2. **Escucharla al día siguiente**, no en caliente.
3. **Compararla** con la versión de referencia.
4. **Lista de comprobación** según la prueba:
   - sonido: ¿aire en el sonido? ¿cortes?
   - afinación: ± cents con el afinador
   - pulso: con el metrónomo
   - postura: hombros, muñecas, cabeza
5. Si dudas, **no lo marques**: repítelo otra semana.

**Cambios en los datos:**
- Cada criterio con «maestro» pasa a una prueba medible. Ejemplos:
  - **Vibrato:** «pulsos regulares de 4 y 6 por negra a 60, comprobados en la grabación y en la gráfica del afinador».
  - **Respiración circular:** «30 s sin corte audible en la grabación».
  - **La Campanella y el Capricho 24:** «Aprobada por tu maestro» → «grabación completa sin cortes, comparada con la referencia en 3 escuchas».
- Los bloques `clase` de los días 29–34 pasan a `revision`: autoevaluación de la flauta y de la embocadura.
- **Dos mínimos que sí recomiendo hacer con alguien** (honestidad: sin ellos hay riesgos que no puedes ver solo):
  1. **Revisión de la flauta por un técnico** de instrumentos de viento (o la tienda) **dentro del plazo de devolución**. Es el logro «Flauta revisada» y no hace falta un maestro. Una fuga en una zapatilla no la detecta un principiante.
  2. **Opcional, muy recomendable:** una clase suelta **«de chequeo»** de embocadura y postura en la semana 5, y otra cada 2–3 meses. Son los vicios más difíciles de corregir después. Quedará como logro opcional, sin bloquear nada.
- `docs/plan.md`: la regla 5 se reescribe, las preguntas de la primera clase pasan a «si tomas una clase suelta» y se añaden el protocolo y las **señales para parar** (dolor que no se va en un día, mareo que no se pasa, labios que tiemblan).

**Estudios dentro del juego** (sin maestro, alguien tiene que elegirlos). Libros de dominio público en IMSLP, salvo Wye y Moyse, que se compran:

| Zona | Estudios por defecto | Cómo entra al juego |
|---|---|---|
| 1–2 | Trevor Wye, *Tono* (notas largas) | Ya está en el temario |
| 2–3 | Gariboldi, *58 Ejercicios* op. 89 y *20 Estudios pequeños* op. 131 | Logro «Gariboldi I» (estudios 1–10) |
| 3–4 | Moyse, *De la sonorité* (cap. 1) | Logro de sonido |
| 4 | Köhler, op. 33 libro 1 | Logro «Köhler I» |
| 5 | Taffanel & Gaubert (ya está), Köhler libro 2 | Logros existentes y uno nuevo |
| 6–7 | Andersen, op. 41 | Logro «Andersen» |

---

## 6.2 Mejoras de la metodología (aplicar todas)

| # | Mejora | Cambio concreto |
|---|---|---|
| 1 | **Afinador desde la zona 1** | Logro nuevo «Afinado» en la zona 1–2 (notas largas a ±20 cents), que se endurece por zona (±15 en la 3, ±10 en la 5). |
| 2 | **Repertorio vivo** | Logro de hábito «Repertorio vivo»: repasar una pieza vencida cada semana durante 8 semanas. Bloque `repaso` en las semanas tipo. |
| 3 | **Estudios por defecto** | Tabla de 6.1. |
| 4 | **Validación** | Protocolo de autoevaluación (6.1). |
| 5 | **Oído en todas las zonas** | Logros de oído por zona: intervalos de oído, dictado de 4 compases, una transcripción por zona (más larga en cada una). |
| 6 | **Zona 7 completa** | Criterios nuevos: escalas en terceras, arpegios en todas las tonalidades y resistencia (obra de ≥ 8 min sin perder el sonido). |
| 7 | **Postura** | Logro «Postura revisada» por video, en la zona 1 y repetible. |

Todo se **añade** (R8). Los logros nuevos llevan `nivelSugerido` y caen en ramas existentes del árbol (R10).

---

## 6.3 Después del día 90: semanas tipo por zona

- **Colección nueva `semanas`** (`src/data/semanas.json`): una **semana tipo por zona** (de la 2 a la 8), con 5 sesiones (lunes, martes, miércoles, viernes y sábado) y los **mismos bloques** que `dias` (calentamiento → técnica/escalas → estudios → repertorio, más oído y repaso), de 45–60 min.
- **Cada 4 semanas, el sábado es de revisión:** grabarte, comprobar los criterios de la zona con el protocolo y elegir el foco del mes.
- **En la web, desde el día 91:**
  - el panel enseña **«Tu sesión de hoy»** según tu zona actual y el día de la semana;
  - página nueva `/rutina` con la semana tipo de tu zona.
- **Horario flexible:** si cambias el horario, solo cambian las semanas tipo (por ejemplo, de 60 a 75 min); el resto de la web no se toca.
- **Hoy, después del día 90**, la web dice «Los 90 días terminaron» y no hay misión diaria. Esto lo resuelve.
- Urgencia: baja. Hace falta antes del 6 feb 2027 (con la opción A).

---

## 6.4 Clásicas nuevas (todas)

Por cada obra: buscar un video de flauta (mejor con partitura o pista) con `yt-dlp`, clasificarla con `docs/clasificar-cancion.md`, añadirla a `canciones.txt` y pasar `verificar`. Las zonas son estimadas y la clasificación final sigue el criterio documentado.

| Zona aprox. | Obra |
|---|---|
| 2 | Grieg, *La mañana* · Dvořák, *Largo* (Nuevo Mundo) |
| 2–3 | Bach/Petzold, *Minueto en Sol* |
| 3 | Händel, *Ombra mai fu* |
| 3–4 | Gluck, *Danza de los espíritus bienaventurados* · Bizet, *Minueto* (L'Arlésienne) |
| 4 | Fauré, *Sicilienne* op. 78 · Bach, *Siciliano* BWV 1031 |
| 4–5 | Gossec, *Tambourin* · Händel, *Sonatas* HWV 363b y 359b |
| 5 | Massenet, *Meditación de Thaïs* · Mozart, *Andante en Do* K. 315 |
| 5–6 | Debussy, *Syrinx* · Telemann, *12 Fantasías* |
| 6–7 | Bach, *Partita en la menor* BWV 1013 · Mozart, *Concierto en Sol* K. 313 |
| 7 | Chaminade, *Concertino* op. 107 · Doppler, *Fantasía pastoral húngara* |
| 7–8 | Poulenc, *Sonata* |
| 8 | Ibert, *Concierto* |

Efecto: las zonas 2–4 pasan de 0–1 clásicas a varias, y la ruta Clásica tiene camino continuo de la zona 2 a la 8.

---

## 6.5 «¿Cuándo puedo tocarla?»

**Dato nuevo (función pura en `src/lib/`):** para cada canción se calcula **cuándo estará a tu alcance**.
- Si todos sus logros aparecen en los 90 días, el **día estimado** es el primer día en que el plan te da todos sus requisitos (siguiendo también los requisitos de los requisitos).
- Si no, su **zona** con la estimación de esa zona.

Comprobado con los datos actuales:
- Wellerman, ≈ día 29
- 8 canciones de la zona 2 (Bella Ciao, Always With Me, La Llorona…), ≈ día 41
- 19 de la zona 3, ≈ día 69
- el resto, por zona

Es una estimación: con progreso real manda lo que te falta de verdad («te falta 1 logro: Sol mayor»).

**Opciones de dónde verlo** (se pueden combinar):

| # | Opción | Dónde | Qué ves |
|---|---|---|---|
| A | **«Próximas canciones»** | `/panel` (lo primero que abres) | Las 3–5 canciones más cerca de abrirse, con el logro que falta y su día estimado, más las recién desbloqueadas. |
| B | **Día estimado en cada carta** | `/canciones` y la ficha de cada canción | Bajo el candado: «≈ día 41 · 13 dic» o «Zona 4 · ≈ 9–15 meses». |
| C | **Aviso al conseguir un logro** | Árbol y misión del día | «¡Desbloqueaste Bella Ciao y 3 más!», con la celebración (`Estallido`). |
| D | **Línea de tiempo «Tu repertorio»** | Página `/repertorio` (o una sección del calendario) | Las canciones colocadas sobre los 90 días y después por zona, como un camino que se abre. |
| E | **Insignia en la cabecera** | Todas las páginas | Icono de nota con el número de canciones nuevas por ver. |

Construido: **A**, **C** y **D**; además, `/repertorio` quedó en la navegación de la cabecera.

Recomendación: **A + B + C**. Son lo más útil con menos piezas nuevas; D es la más vistosa y E la más visible. Antes de construir, muestra visual para aprobar (regla de CLAUDE.md para cambios visuales grandes).

---

## Orden propuesto (pausa de revisión al final de cada uno)

1. **6.0 Arranque**: hoy, antes de tu primera sesión.
2. **6.1 + 6.2 Metodología sin maestro y mejoras**: datos y documentos, sin cambios visuales.
3. **6.5 «¿Cuándo puedo tocarla?»**: lo que más usarás desde ya.
4. **6.4 Clásicas nuevas**: más trabajo de búsqueda; se nota en las zonas 2–4.
5. **6.3 Después del día 90**: hace falta antes de febrero.
