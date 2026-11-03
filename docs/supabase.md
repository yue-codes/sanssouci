# Supabase: configuración del proyecto (fase 4)

Guía manual (no generada). Qué se configuró en el panel de Supabase, qué se decidió y por qué.
El esquema de la base de datos **no** se describe aquí: vive en `supabase/migrations/` (SQL versionado en git).

> El panel de Supabase cambia a menudo. Si un botón no se llama igual, busca el equivalente.

## Estado

| Paso | Quién | Estado |
|---|---|---|
| 1. Crear la cuenta y el proyecto en supabase.com | Usuario | ✅ 2 nov 2026 |
| 2. Copiar la URL y la clave *publishable* a `.env` | Usuario | ✅ verificado sin mostrar valores |
| 3. Authentication → URL Configuration | Usuario | ✅ 2 nov 2026 |
| 4. Instalar `@supabase/supabase-js`, `@supabase/ssr` y `@astrojs/cloudflare` (modo servidor) | Claude | ✅ + `wrangler` (peer del adaptador) |
| 5. Primera migración: tablas + RLS | Claude | ✅ `progreso_inicial` + `permisos_minimos`, aplicadas por la API de Supabase (2 nov 2026) |
| 6. Cliente de Supabase en `src/lib/`, middleware, `/entrar` con enlace mágico | Claude | ✅ diseño de `/entrar` aprobado; login probado (2 nov 2026): el trigger creó el perfil |
| 7. ~~Login con Google~~ → **correo y contraseña** (decidido el 3 nov 2026; Google descartado) | Claude | ✅ código hecho: `/entrar` con tres modos y `/contrasena` |
| 8. Ajustes de contraseña y plantillas de correo en el panel (§7) | Usuario | ✅ login probado el 3 nov 2026 (si el enlace de un correo falla al abrirlo en otro dispositivo, revisar las plantillas) |

Al recibir el «listo», comprobar que `.env` existe y tiene las dos variables **sin mostrar sus valores** (p. ej. `grep -c "=." .env`).

## 1. Proyecto

| Campo | Valor |
|---|---|
| Nombre | El que puso Supabase por defecto («…'s Project»); no afecta a nada |
| Plan | Free |
| Región | West US (Oregon), `us-west-2`. Se había previsto East US; las dos quedan cerca de México |
| Contraseña de la base de datos | Generada; la guarda el usuario en su gestor de contraseñas. **No se pide ni se guarda en el proyecto.** |
| Data API | Activada (la web habla con Postgres a través de ella) |
| Automatic RLS | **Activada.** Toda tabla nueva nace con RLS encendida: sin reglas queda cerrada, así que un olvido falla «a cerrado». |

**Aun con RLS automática, cada migración activa RLS y crea sus reglas de forma explícita** (`alter table … enable row level security` + `create policy …`). Así la seguridad está en el código y en git, no en un ajuste del panel.

## 2. Variables de entorno

Plantilla en `.env.example` (sí está en git); los valores, en `.env` (fuera de git):

| Variable | Dónde está | Notas |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Project Settings → Data API / API Keys | `https://….supabase.co` |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys | Empieza por `sb_publishable_…` (antes se llamaba `anon`) |

- El prefijo `PUBLIC_` hace que Astro las deje usar también en el navegador (islas). Es correcto: la clave *publishable* es pública por diseño; lo que protege los datos es RLS.
- La clave **secret** (antes `service_role`) se salta RLS: **no se usa en esta web** ni se escribe en ningún archivo.
- En Cloudflare van como **variables de compilación** (*build variables*), no como secretos del worker: Astro las mete en el código al compilar (ver `docs/despliegue.md`).

## 3. Autenticación

- **Site URL:** `http://localhost:4321`. **Redirect URLs:** `http://localhost:4321/**`. Desde la fase 5 (3 nov 2026), la *Site URL* es la dirección pública (https://sanssouci.eduardo-jes-angeles-hdz.workers.dev) y en *Redirect URLs* está también `https://sanssouci.eduardo-jes-angeles-hdz.workers.dev/**`.
- **Correo y contraseña** (desde el 3 nov 2026; antes, enlace mágico). Registro abierto a cualquiera, con confirmación por correo. Ajustes en §7. El correo integrado de Supabase envía pocos mensajes por hora; basta para uso personal. Con más usuarios, configurar un SMTP propio.
- **Google:** descartado por el usuario (3 nov 2026).

## 4. Tablas previstas

Ver `docs/diseno-tecnico.md` (sección 7): `perfiles`, `dias_completados`, `logros_obtenidos`, `victorias_jefe` y `estado_canciones`, todas con `user_id` y RLS `auth.uid() = user_id`. Los ids de contenido que guardan (`dia_id`, `logro_id`…) son los de `src/data`: por eso esos ids no se renombran.

## 5. Cómo se aplican las migraciones

- Se escriben en `supabase/migrations/AAAAMMDDHHMMSS_nombre.sql`. **Una migración ya aplicada no se edita:** cualquier cambio va en una nueva.
- Hasta ahora se aplicaron con la API de administración de Supabase (`POST /v1/projects/{ref}/database/query`), cada una dentro de `begin … commit`. Además se registraron en `supabase_migrations.schema_migrations`, la tabla que usa la CLI, así que `supabase db push` las reconocería como aplicadas.
- Esa API necesita un *access token* personal (`sbp_…`), que da control total de la cuenta. Va solo en el comando y se revoca al terminar; nunca se escribe en un archivo.
- **Permisos:** Supabase da por defecto a `authenticated` todos los permisos sobre las tablas de `public`, incluido `TRUNCATE`, que no pasa por RLS. Por eso cada tabla nueva necesita un `revoke all` y después un `grant` solo de lo que se usa (ver `20261102121000_permisos_minimos.sql`).
- Comprobado: con la clave *publishable* y sin sesión, leer o escribir en las tablas da `permission denied` (HTTP 401).

## 6. Tipos de la base de datos

`src/lib/tipos-supabase.ts` se genera desde el esquema real. **Regenéralo tras cada migración**, con la CLI (`supabase gen types typescript --linked`) o con la API de administración (`GET /v1/projects/{ref}/types/typescript?included_schemas=public`, con un *access token*). Después se le vuelve a poner la cabecera `@file`.

## 7. Correo y contraseña: ajustes y detalles

**Cómo funciona** (código en `pages/entrar.astro`, `pages/contrasena.astro` y `lib/cuenta.ts`):

| Acción | Supabase | Después |
|---|---|---|
| Entrar | `signInWithPassword` | A `siguiente`. Si falla: «correo o contraseña incorrectos» (sin decir cuál, para no revelar qué correos tienen cuenta). |
| Crear cuenta (`?modo=registro`) | `signUp` con `emailRedirectTo` = `/auth/confirmar?siguiente=…` | Correo para activarla; el enlace abre la sesión. Si el correo ya tenía cuenta, Supabase no avisa ni manda nada (tampoco lo revela). |
| Olvidé la contraseña (`?modo=recuperar`) | `resetPasswordForEmail` con `redirectTo` = `/auth/confirmar?siguiente=/contrasena` | El enlace abre la sesión y lleva a `/contrasena`. |
| Poner o cambiar la contraseña | `updateUser({ password })` en `/contrasena` (privada) | `/contrasena?guardada=1`. |

Contraseña: de 8 a 72 bytes (bcrypt, el algoritmo con el que Supabase guarda el *hash*, ignora lo que pase de 72). Validada en el servidor con Zod aunque el navegador ya lo haga. **Una cuenta creada con el enlace mágico no tiene contraseña:** con la sesión abierta, entra a `/contrasena` y pon una (o usa «¿La olvidaste?»).

**Ajustes en el panel** (paso 8, lo hace el usuario):

1. **Authentication → Sign In / Providers → Email:**
   - *Enable Email provider*: activado (ya lo está).
   - *Confirm email*: **activado**. Sin él, cualquiera podría crear cuentas con correos ajenos.
   - *Minimum password length*: **8** (el mismo número que `CONTRASENA_MIN` en `lib/cuenta.ts`).
   - *Secure password change*: desactivado. Si se activa, cambiar la contraseña con una sesión de más de 24 h pide volver a entrar (la página muestra un mensaje para usar «¿La olvidaste?»).
   - *Leaked password protection* (comprueba contraseñas filtradas) solo existe en el plan Pro.
2. **Authentication → Emails → Templates** (recomendado): por defecto el enlace usa el flujo PKCE y **solo funciona en el mismo navegador** donde se pidió (la otra mitad del código va en una cookie). Para que funcione en cualquiera (p. ej., el correo en el móvil), cambia el enlace de estas plantillas:
   - *Confirm signup*: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Activar mi cuenta</a>`
   - *Reset password*: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Poner una contraseña nueva</a>`

   `{{ .RedirectTo }}` es nuestra URL (ya trae `?siguiente=…`, por eso se añade con `&`), y `/auth/confirmar` ya entiende `token_hash` + `type`. Funciona porque esas URLs están en *Redirect URLs* (§3); si no, Supabase usaría la *Site URL*, que no lleva `?`. La plantilla *Magic Link* ya no se usa.
3. **Límite de correos:** el correo integrado envía muy pocos por hora (y uno por minuto por dirección). La página lo avisa con un mensaje claro (HTTP 429). Para más usuarios, configurar SMTP propio.

- **Bindings del adaptador** (resuelto en la fase 5): con `imageService: "compile"` ya no se crea `IMAGES`. Queda `SESSION` (KV para las sesiones de Astro, que no usamos): Wrangler lo creó solo al desplegar y es gratis.
