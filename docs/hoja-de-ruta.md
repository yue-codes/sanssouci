# Hoja de ruta: lo que falta

> Escrito el 2 nov 2026 al cerrar la sesión del rediseño, para retomar en otra sesión sin redescubrir nada.
> El estado corto vive en la tabla «Estado» de `CLAUDE.md`; aquí está el **detalle de cada paso pendiente**: qué hacer, dónde, cómo y cómo comprobarlo.
> Al terminar un paso, márcalo aquí (✅ y fecha) y actualiza `CLAUDE.md`.

## 0. Al abrir la próxima sesión

1. `git status`. Todo lo hecho tiene commit (último: `8adf53f`, 3 nov 2026). Fases 1 a 4 terminadas; la web está publicada (fase 5) en https://sanssouci.eduardo-jes-angeles-hdz.workers.dev.
   - Verificado: `pnpm astro check` 0 errores, `pnpm build` y `pnpm auditar` sin problemas (226 páginas prerenderizadas, más las de servidor auditadas aparte; ver «Accesibilidad» en `docs/arquitectura.md`). El usuario probó todo en local y en producción.
   - **Pendiente:** antes de compartir la web, cambiar las imágenes ajenas (§2, punto 7). Después, lo que pida el usuario (ideas aplazadas en §4).
2. ✅ (3 nov 2026) El usuario aprobó todo el rediseño: `/niveles/[id]`, `/logros`, `/canciones`, `/canciones/[id]`, `/panel` y `/entrar`.
   - **No ejecutes `pnpm dev` tú.**

## 1. Fase 4: terminar el progreso real

El login funciona (desde el paso g, con correo y contraseña). Las tablas existen con RLS (`supabase/migrations/`): `perfiles`, `dias_completados`, `logros_obtenidos`, `victorias_jefe` y `estado_canciones`. **Falta todo lo que escribe** en ellas y que las páginas lean el progreso real.

### Decisión 1: cómo se escribe (recomendado: Astro Actions)

**Astro Actions** (`src/actions/index.ts`, `defineAction` + `astro/zod`):

- **Qué son:** funciones del servidor que una isla llama como si fueran funciones normales (`await actions.marcarDia({ … })`).
- **Por qué encajan aquí:**
  - Se ejecutan en el worker con `context.locals.supabase`, que ya trae la sesión de la cookie, así que RLS aplica sola.
  - Validan la entrada con Zod antes de tocar la base de datos.
  - No exponen nada nuevo en el navegador.
  - Funcionan aunque la página que contiene la isla sea estática: la acción vive en su propia ruta de servidor.
- **Alternativa:** un cliente de Supabase en el navegador (`createBrowserClient` de `@supabase/ssr`). También es seguro gracias a RLS, pero reparte la lógica entre el servidor y el cliente.

**Comprobado al compilar (3 nov 2026):** las Actions y las Server Islands compilan con `@astrojs/cloudflare` y la salida estática; el código de servidor no llega al navegador. En `pnpm dev`: sin sesión, la isla responde con `private, no-store` y la acción da 401; con sesión, el usuario comprobó que guarda y deshace.

### Decisión 2: cómo leen el progreso las páginas (✅ decidida el 3 nov 2026)

**Decisión: Server Islands (`server:defer`) en las 9 páginas.**
- La página sigue siendo estática: la portada, las imágenes (AVIF, varios tamaños) y el contenido se generan al compilar.
- Solo los trozos que dependen del progreso son componentes `server:defer`, que el worker genera en cada visita con la sesión de la cookie. «Hoy» se calcula en cada visita.
- **Por qué no el modo servidor (A) a secas:** una página con `prerender = false` se genera en el worker, y ahí no existe sharp (es nativo). El adaptador sirve entonces la imagen original sin optimizar (`imageService: "compile"` → *passthrough* en ejecución). Cloudflare Images también lo resolvería, pero hay que activarlo en la cuenta.
- **Sin sesión:** progreso **vacío** (zona 1 abierta, nada conseguido) y el aviso «entra para llevar tu progreso». `PROGRESO_EJEMPLO` se borra cuando ninguna página lo use.
- **Fechas por usuario:** por ahora no se desplazan (el único usuario empieza el 2 nov 2026, como `dias.json`). Queda anotado para cuando haya más usuarios.
- Se empieza por el paso **a** (marcar días), que estrena la primera Server Island en `/dias/[n]` y la primera Action.
- **Ajuste en el paso f** (3 nov 2026, elegido por el usuario): `/`, `/mapa`, `/logros`, `/niveles/[id]` y `/calendario` pasaron a **páginas de servidor** (`prerender = false`). Casi todo lo que pintan depende del progreso (o de «hoy»), así que una Server Island habría sido casi la página entera. Sus imágenes ya vienen optimizadas a mano, que era el motivo para no hacerlo. Siguen con Server Islands las páginas donde el progreso es solo un trozo: `/arbol`, `/canciones`, `/canciones/[id]`, `/jefes/[id]` y `/dias/[n]`.
- **Imágenes dentro de islas** (3 nov 2026): en `/mapa`, `/niveles/[id]` y la portada las imágenes dependen del progreso (fondo de tu zona, niebla, jefes), así que van dentro de la isla y el worker las sirve sin transformar. El usuario eligió **optimizar los archivos a mano** (`pnpm optimizar-imagenes`, versiones grande y `-mini`) en vez de Cloudflare Images o URLs precalculadas. Ver `docs/arquitectura.md`, «Imágenes».

Lo que se comparó (para el registro):

Al decidir, 9 páginas usaban `PROGRESO_EJEMPLO` (progreso inventado, `src/lib/ejemplo.ts`): `/`, `/mapa`, `/arbol`, `/logros`, `/canciones`, `/canciones/[id]`, `/jefes/[id]`, `/dias/[n]` y `/niveles/[id]`. Solo `/panel` lee el real.

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
| a | **Marcar un día como hecho** (minutos y notas opcionales). Al llegar a «¡Misión cumplida!» en `MisionDelDia`, botón «Guardar en mi progreso»; si no hay sesión, enlace a `/entrar?siguiente=/dias/n`. Upsert en `dias_completados` (la clave `(user_id, dia_id)` lo permite). Opción de deshacer. | `src/actions/` (`marcarDia`, `desmarcarDia`), `components/sesion/MisionDelDia.tsx`, `pages/dias/[n].astro` | Marcar un día → en `/panel` sube «sesiones hechas», la racha y la nota de la partitura. | ✅ 3 nov 2026: `src/actions/index.ts`, `sesion/MisionConProgreso.astro` (Server Island), `sesion/RegistroDia.tsx`. Probado por el usuario con su sesión. |
| b | **Conseguir logros** (y quitarlos, por si fue un error). Hoy el árbol solo tiene una demo que no guarda (`alternar` en `ArbolTalentos.tsx`). Conectar ese botón y el de la ficha (`DetalleTalento`) a una Action. Respetar `requiere`: el servidor no deja conseguir un logro bloqueado (`estadoLogro`). Opcional: `evidencia_url` (https). | `src/actions/` (`conseguirLogro`, `quitarLogro`), `logros/arbol/ArbolTalentos.tsx`, `DetalleTalento.tsx` | Conseguir uno → celebración + aparece en `/logros`, `/panel` y el mapa (llaves). | ✅ 3 nov 2026, probado por el usuario: Actions `conseguirLogro` / `quitarLogro`, Server Island `logros/arbol/ArbolConProgreso.astro`, `cargarProgreso` y `PROGRESO_VACIO` en `lib/progreso-usuario.ts`. Sin `evidencia_url` por ahora. `/logros` y el mapa seguirán con el ejemplo hasta el paso f. |
| c | **Vencer a un jefe.** Al completar los golpes en `CombateJefe` («¡Victoria!»), formulario con el enlace del video (obligatorio, https: grabar es parte de la victoria) y el tempo logrado (20–300). Solo si la puerta está abierta (todas sus llaves). | `src/actions/` (`registrarVictoria`), `jefes/CombateJefe.tsx`, `pages/jefes/[id].astro` | La puerta del mapa pasa a «derrotado» y la zona siguiente se abre. | ✅ 3 nov 2026, probado por el usuario: Actions `registrarVictoria` / `anularVictoria`, Server Island `jefes/ArenaConProgreso.astro`, islas `VidaJefe` y `LlavesPuerta` leen `estadoJefe`. El mapa seguirá con el ejemplo hasta el paso f. |
| d | **Estado de cada canción:** pendiente / aprendiendo / dominada. Control en la ficha de la canción; un sello en la carta (`TarjetaCancion`) y, quizá, un filtro en el catálogo. | `src/actions/` (`estadoCancion`), `pages/canciones/[id].astro`, `TarjetaCancion.tsx`, `lib/canciones.ts` (añadir `estado` a `CancionResumen`) | Cambiar el estado → se ve en la ficha y en la carta. | ✅ 3 nov 2026, probado por el usuario: Action `cambiarEstadoCancion`, `lib/estado-cancion.ts`, `SelectorEstado`, Server Islands `CartaConProgreso` y `CatalogoConProgreso`, sello en `TarjetaCancion` y filtro «Mi avance». Con esto `/canciones` y `/canciones/[id]` ya leen el progreso real (adelanta parte del paso f). |
| e | **`/perfil`** (ya está en `RUTAS_PRIVADAS`): nombre, `fecha_inicio` y `fecha_llegada_flauta`. **Ojo:** `fecha_inicio` tiene por defecto el día en que se creó la cuenta; la del usuario debe ser **2026-11-02**. Formulario HTML con `method="post"`, como `/entrar`. | `pages/perfil.astro` (servidor), componente en `components/cuenta/` | Cambiar la fecha de inicio → «Día N de 90» del panel cambia. | ✅ 3 nov 2026, probado por el usuario: `pages/perfil.astro`, `cuenta/TarjetaPerfil.astro`, `lib/perfil.ts` (`validarPerfil`), enlace «Perfil y fechas» en el panel. |
| f | **Que las páginas lean el progreso real** (Decisión 2). Si una página pasa a servidor: `prerender = false`, `cargarProgresoUsuario` y fallback sin sesión. Borrar `PROGRESO_EJEMPLO` cuando ninguna página lo use (o dejarlo solo para quien no ha entrado). | las 9 páginas de la lista, `lib/ejemplo.ts` | Sin sesión: todo se ve. Con sesión: tu progreso en todas las páginas. | ✅ 3 nov 2026: `/`, `/mapa`, `/logros`, `/niveles/[id]` y `/calendario` son de servidor con `progresoDeVisita` (`lib/progreso-usuario.ts`) y `AvisoProgreso` (`ui/`); `/dias/[n]` pasa sus «Recompensas posibles» a la isla `MisionConProgreso`; `/jefes/[id]` calcula «faltan N días» en el navegador (`FaltanDias`). «Hoy» con `diaDelPlanHoy` (`lib/fechas.ts`). Borrados `lib/ejemplo.ts` y `ui/Aviso.astro`. |
| g | ~~Login con Google~~ → **correo y contraseña** (el usuario descartó Google el 3 nov 2026; registro abierto, sin enlace mágico). `/entrar` con tres modos (entrar, crear cuenta, recuperar) y `/contrasena` (privada) para ponerla o cambiarla. | `pages/entrar.astro`, `pages/contrasena.astro`, `lib/cuenta.ts`, `cuenta/TarjetaEntrar.astro`, `TarjetaContrasena.astro`, `CampoContrasena.tsx`, `PantallaCuenta.astro` | Crear una cuenta con otro correo → llega el correo → entrar. Recuperar → `/contrasena`. La cuenta del usuario pone su contraseña en `/contrasena`. | ✅ 3 nov 2026, probado por el usuario. Cerrar sesión también en `/perfil`. |

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

**Decidido el 3 nov 2026:** Workers Builds conectado a GitHub (cada push a `main` compila y publica). Guía completa: `docs/despliegue.md`.

1. ✅ Ensayo local (`pnpm wrangler deploy --dry-run`): worker de 629 KB comprimido (límite gratis: 3 MB), 570 archivos estáticos, recursos `ASSETS` y `SESSION`. Versiones fijadas para la compilación en Cloudflare: `.node-version` y `packageManager`. Script `pnpm desplegar` para publicar a mano.
2. ✅ (3 nov 2026, la web publicada ya entra con contraseña) El usuario conecta el repositorio en Cloudflare con la configuración de `docs/despliegue.md` y las dos *build variables* de Supabase (son públicas y se meten en el código al compilar: no son secretos del worker). Nunca la clave *secret*.
3. ✅ (3 nov 2026) Supabase → Authentication → URL Configuration: dirección pública (https://sanssouci.eduardo-jes-angeles-hdz.workers.dev) en Site URL y Redirect URLs.
4. ✅ (3 nov 2026, el usuario: «funciona bien») Probar en producción: entrar con correo y contraseña, marcar un día, cerrar sesión. Recuperar la contraseña (el enlace del correo debe llevar a la dirección pública).
5. ✅ Guía para el usuario: `docs/despliegue.md`.
6. ✅ (3 nov 2026) Comprobado en producción: `/arbol`, `/canciones`, `/jefes/…` y `/dias/…` responden 200 sin redirección 307 (`build.format: "file"`, commit `8adf53f`).
7. Antes de compartir la web con otras personas: **cambiar las imágenes ajenas** (ver `docs/arquitectura.md` «Imágenes»).

## 3. Datos que solo sabe el usuario

- Fecha real de llegada de la flauta (Jean Paul FL-430, ≈ principios de diciembre de 2026). Se guardará en `/perfil`; hasta entonces, `dias.json` la estima en el día 29.
- Fecha de su primera clase con maestro (al llegar la flauta).
- Canciones nuevas: clasificarlas con `docs/clasificar-cancion.md`, añadir el video a `canciones.txt` y pasar `pnpm verificar`.

## 4. Ideas aplazadas (no hacer sin que el usuario lo pida)

- Rarezas de carta, rangos o niveles de personaje con más efectos (sonido, animaciones de subida de rango).
- Estadísticas por semana en el panel (minutos por día, gráfica).
- Recordatorio de la sesión (notificaciones): requiere más infraestructura.
