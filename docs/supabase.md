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
| 6. Cliente de Supabase en `src/lib/`, middleware, `/entrar` con enlace mágico | Claude | ⏳ |
| 7. Login con Google (credenciales en Google Cloud) | Ambos | ⏳ después de que funcione el enlace mágico |

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
- En la fase 5 las mismas variables se configuran en Cloudflare.

## 3. Autenticación

- **Site URL:** `http://localhost:4321`. **Redirect URLs:** `http://localhost:4321/**`. En la fase 5 se añade la dirección pública.
- **Enlace mágico (correo):** viene activado. El correo integrado de Supabase envía pocos mensajes por hora; basta para uso personal. Con más usuarios, configurar un SMTP propio.
- **Google:** pendiente (paso 7).

## 4. Tablas previstas

Ver `docs/diseno-tecnico.md` (sección 7): `perfiles`, `dias_completados`, `logros_obtenidos`, `victorias_jefe` y `estado_canciones`, todas con `user_id` y RLS `auth.uid() = user_id`. Los ids de contenido que guardan (`dia_id`, `logro_id`…) son los de `src/data`: por eso esos ids no se renombran.

## 5. Cómo se aplican las migraciones

- Se escriben en `supabase/migrations/AAAAMMDDHHMMSS_nombre.sql`. **Una migración ya aplicada no se edita:** cualquier cambio va en una nueva.
- Hasta ahora se aplicaron con la API de administración de Supabase (`POST /v1/projects/{ref}/database/query`), cada una dentro de `begin … commit`. Además se registraron en `supabase_migrations.schema_migrations`, la tabla que usa la CLI, así que `supabase db push` las reconocería como aplicadas.
- Esa API necesita un *access token* personal (`sbp_…`), que da control total de la cuenta. Va solo en el comando y se revoca al terminar; nunca se escribe en un archivo.
- **Permisos:** Supabase da por defecto a `authenticated` todos los permisos sobre las tablas de `public`, incluido `TRUNCATE`, que no pasa por RLS. Por eso cada tabla nueva necesita un `revoke all` y después un `grant` solo de lo que se usa (ver `20261102121000_permisos_minimos.sql`).
- Comprobado: con la clave *publishable* y sin sesión, leer o escribir en las tablas da `permission denied` (HTTP 401).
