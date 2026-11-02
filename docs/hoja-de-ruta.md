# Hoja de ruta: lo que falta

> Escrito el 2 nov 2026 al cerrar la sesión del rediseño, para retomar en otra sesión sin redescubrir nada.
> El estado corto vive en la tabla «Estado» de `CLAUDE.md`; aquí está el **detalle de cada paso pendiente**: qué hacer, dónde, cómo y cómo comprobarlo.
> Al terminar un paso, márcalo aquí (✅ y fecha) y actualiza `CLAUDE.md`.

## 0. Al abrir la próxima sesión

1. `git status`. Lo último de la sesión anterior **ya tiene commit** (refactor `FondoPortada` y esta hoja):
   - `src/components/ui/FondoPortada.astro` (nuevo) y su uso en 10 portadas: las capas de fondo repetidas (imagen, velo y degradados) pasan a un componente.
   - La documentación de esta hoja, `docs/arquitectura.md` (FondoPortada) y `docs/diseno-tecnico.md` (el diseño visual decía «Bosque» y modo claro).
   - Verificado: `pnpm astro check` 0 errores, `pnpm build` y `pnpm auditar` sin problemas (239 páginas).
   - Si `git status` muestra cambios, pregunta al usuario antes de seguir.
2. Vistos buenos pendientes del rediseño: `/niveles/[id]`, `/logros`, `/canciones`, `/canciones/[id]`, `/panel` y `/entrar`.
   - `/panel` y `/entrar` solo se vieron con datos de ejemplo (páginas de prueba temporales). El usuario debe mirarlos con su sesión en `pnpm dev`.
   - **No ejecutes `pnpm dev` tú.**

## 1. Fase 4: terminar el progreso real

El login con enlace mágico ya funciona. Las tablas existen con RLS (`supabase/migrations/`): `perfiles`, `dias_completados`, `logros_obtenidos`, `victorias_jefe` y `estado_canciones`. **Falta todo lo que escribe** en ellas y que las páginas lean el progreso real.

### Decisión 1: cómo se escribe (recomendado: Astro Actions)

**Astro Actions** (`src/actions/index.ts`, `defineAction` + `astro/zod`):

- **Qué son:** funciones del servidor que una isla llama como si fueran funciones normales (`await actions.marcarDia({ … })`).
- **Por qué encajan aquí:**
  - Se ejecutan en el worker con `context.locals.supabase`, que ya trae la sesión de la cookie, así que RLS aplica sola.
  - Validan la entrada con Zod antes de tocar la base de datos.
  - No exponen nada nuevo en el navegador.
  - Funcionan aunque la página que contiene la isla sea estática: la acción vive en su propia ruta de servidor.
- **Alternativa:** un cliente de Supabase en el navegador (`createBrowserClient` de `@supabase/ssr`). También es seguro gracias a RLS, pero reparte la lógica entre el servidor y el cliente.

**Por comprobar al empezar:** que las Actions de Astro 7 funcionan con `@astrojs/cloudflare` y la salida estática por defecto. Prueba mínima: una acción que devuelva `usuario.id`.

### Decisión 2: cómo leen el progreso las páginas (decidir CON el usuario)

Hoy 9 páginas usan `PROGRESO_EJEMPLO` (progreso inventado, `src/lib/ejemplo.ts`): `/`, `/mapa`, `/arbol`, `/logros`, `/canciones`, `/canciones/[id]`, `/jefes/[id]`, `/dias/[n]` y `/niveles/[id]`. Solo `/panel` lee el real.

| Opción | Cómo | A favor | En contra |
|---|---|---|---|
| **A. Modo servidor** | `export const prerender = false` y `cargarProgresoUsuario` (vacío o de ejemplo si no hay sesión), como `/panel`. | Poco código: las páginas ya reciben un `Progreso`, solo cambia de dónde sale. «Hoy» se calcula en cada visita. | Cada visita hace consultas a Supabase. En servidor las imágenes **no se optimizan** (el worker no tiene `sharp`). Pesan poco: todas menos dos ≤ 240 KB; `anime-dorada.webp` 393 KB y `anime-cian.webp` (la de la portada) 840 KB. Se pierden AVIF y tamaños. |
| **B. Estático + progreso en el navegador** | Las páginas siguen estáticas; una isla pide el progreso al cargar (Action `leerProgreso`) y repinta. | Imágenes optimizadas, páginas rápidas. | Mucho trabajo: buena parte del mapa, los logros y las zonas son `.astro` sin JavaScript y habría que pasarlos a islas. Parpadeo de «ejemplo → real». |

**Recomendación:**
- **A** para las páginas con mucho progreso (`/mapa`, `/arbol`, `/logros`, `/niveles/[id]`, `/jefes/[id]`, `/dias/[n]`).
- `/canciones` y la portada pueden quedarse estáticas y enseñar el progreso de ejemplo con su aviso. O pasar también a A, por coherencia.

Cuida que la página sin sesión siga funcionando (contenido para todos, progreso vacío o de ejemplo con el aviso «entra para llevar el tuyo»).

### Pasos, por orden

| # | Paso | Dónde | Cómo comprobarlo | Estado |
|---|---|---|---|---|
| a | **Marcar un día como hecho** (minutos y notas opcionales). Al llegar a «¡Misión cumplida!» en `MisionDelDia`, botón «Guardar en mi progreso»; si no hay sesión, enlace a `/entrar?siguiente=/dias/n`. Upsert en `dias_completados` (la clave `(user_id, dia_id)` lo permite). Opción de deshacer. | `src/actions/` (`marcarDia`, `desmarcarDia`), `components/sesion/MisionDelDia.tsx`, `pages/dias/[n].astro` | Marcar un día → en `/panel` sube «sesiones hechas», la racha y la nota de la partitura. | ⏳ |
| b | **Conseguir logros** (y quitarlos, por si fue un error). Hoy el árbol solo tiene una demo que no guarda (`alternar` en `ArbolTalentos.tsx`). Conectar ese botón y el de la ficha (`DetalleTalento`) a una Action. Respetar `requiere`: el servidor no deja conseguir un logro bloqueado (`estadoLogro`). Opcional: `evidencia_url` (https). | `src/actions/` (`conseguirLogro`, `quitarLogro`), `logros/arbol/ArbolTalentos.tsx`, `DetalleTalento.tsx` | Conseguir uno → celebración + aparece en `/logros`, `/panel` y el mapa (llaves). | ⏳ |
| c | **Vencer a un jefe.** Al completar los golpes en `CombateJefe` («¡Victoria!»), formulario con el enlace del video (obligatorio, https: grabar es parte de la victoria) y el tempo logrado (20–300). Solo si la puerta está abierta (todas sus llaves). | `src/actions/` (`registrarVictoria`), `jefes/CombateJefe.tsx`, `pages/jefes/[id].astro` | La puerta del mapa pasa a «derrotado» y la zona siguiente se abre. | ⏳ |
| d | **Estado de cada canción:** pendiente / aprendiendo / dominada. Control en la ficha de la canción; un sello en la carta (`TarjetaCancion`) y, quizá, un filtro en el catálogo. | `src/actions/` (`estadoCancion`), `pages/canciones/[id].astro`, `TarjetaCancion.tsx`, `lib/canciones.ts` (añadir `estado` a `CancionResumen`) | Cambiar el estado → se ve en la ficha y en la carta. | ⏳ |
| e | **`/perfil`** (ya está en `RUTAS_PRIVADAS`): nombre, `fecha_inicio` y `fecha_llegada_flauta`. **Ojo:** `fecha_inicio` tiene por defecto el día en que se creó la cuenta; la del usuario debe ser **2026-11-02**. Formulario HTML con `method="post"`, como `/entrar`. | `pages/perfil.astro` (servidor), componente en `components/cuenta/` | Cambiar la fecha de inicio → «Día N de 90» del panel cambia. | ⏳ |
| f | **Que las páginas lean el progreso real** (Decisión 2). Si una página pasa a servidor: `prerender = false`, `cargarProgresoUsuario` y fallback sin sesión. Borrar `PROGRESO_EJEMPLO` cuando ninguna página lo use (o dejarlo solo para quien no ha entrado). | las 9 páginas de la lista, `lib/ejemplo.ts` | Sin sesión: todo se ve. Con sesión: tu progreso en todas las páginas. | ⏳ |
| g | **Login con Google** (paso 7 de `docs/supabase.md`). Lo hace el usuario en Google Cloud y Supabase (credenciales OAuth); luego un botón en `TarjetaEntrar`. | `components/cuenta/TarjetaEntrar.astro`, `docs/supabase.md` | Entrar con Google crea el perfil (trigger). | ⏳ |

**Fechas por usuario (a tener en cuenta en e y f):**
- `dias.json` tiene fechas fijas (día 1 = 2 nov 2026). El panel ya calcula «hoy» con la `fecha_inicio` del perfil.
- Si alguien empieza otro día, las páginas que enseñan fechas (calendario, días) deberían desplazarlas.
- Si la flauta llega tarde, la fase con flauta se recorre por número de sesión (`docs/diseno-tecnico.md` §5).
- Decidir con el usuario cuánto de esto hace falta, porque por ahora el único usuario es él.

**Reglas que no cambian:**
- Cada migración nueva activa RLS y crea sus reglas.
- Solo se usa la clave *publishable*.
- Toda escritura se valida en el servidor (Zod en la Action) aunque el formulario ya valide.
- Accesibilidad: `pnpm auditar` al terminar cada página.

## 2. Fase 5: despliegue en Cloudflare Workers

1. Cuenta de Cloudflare (la crea el usuario) y `wrangler login` (lo ejecuta él con `! pnpm wrangler login`).
2. Secretos: `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY` como variables del worker. Nunca la clave *secret*.
3. `pnpm build` y `pnpm wrangler deploy`. Revisar que las páginas prerenderizadas (`dist/client/`) y el worker (`dist/server/`) salen bien.
4. Supabase → Authentication → URL Configuration: añadir el dominio real (Site URL y Redirect URLs para `/auth/confirmar`).
5. Probar en producción: entrar con enlace mágico, marcar un día, cerrar sesión.
6. Escribir la guía para el usuario (`docs/despliegue.md`): cómo volver a desplegar y dónde ver los registros.
7. Antes de compartir la web con otras personas: **cambiar las imágenes ajenas** (ver `docs/arquitectura.md` «Imágenes»).

## 3. Datos que solo sabe el usuario

- Fecha real de llegada de la flauta (Jean Paul FL-430, ≈ principios de diciembre de 2026). Se guardará en `/perfil`; hasta entonces, `dias.json` la estima en el día 29.
- Fecha de su primera clase con maestro (al llegar la flauta).
- Canciones nuevas: clasificarlas con `docs/clasificar-cancion.md`, añadir el video a `canciones.txt` y pasar `pnpm verificar`.

## 4. Ideas aplazadas (no hacer sin que el usuario lo pida)

- Rarezas de carta, rangos o niveles de personaje con más efectos (sonido, animaciones de subida de rango).
- Estadísticas por semana en el panel (minutos por día, gráfica).
- Recordatorio de la sesión (notificaciones): requiere más infraestructura.
