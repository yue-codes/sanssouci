# Despliegue en Cloudflare Workers (fase 5)

Guía manual (no generada). Cómo se publica la web, cómo volver a publicarla y dónde mirar si algo falla.

## Cómo funciona

- **Workers Builds conectado a GitHub** (decidido por el usuario el 3 nov 2026): cada `git push` a `main` hace que Cloudflare clone el repositorio, compile (`pnpm build`) y publique (`npx wrangler deploy`). No hace falta tener nada instalado para publicar: basta con el push.
- **Qué se sube:** el worker (`dist/server/`, las páginas de servidor, las Server Islands y las Actions) y los archivos estáticos (`dist/client/`, las páginas prerenderizadas, las imágenes, el JS y el CSS). La configuración de Wrangler la genera el adaptador al compilar (`dist/server/wrangler.json`); no hay `wrangler.jsonc` en el repositorio.
- **Versiones fijadas** para que Cloudflare compile igual que en local: Node en `.node-version` y pnpm en `packageManager` (`package.json`). Si actualizas Node o pnpm en tu equipo, actualiza también esos dos.
- **Variables de Supabase:** son públicas (`context: 'client'` en `astro.config.mjs`) y Astro **las mete en el código al compilar**. Por eso van como **variables de compilación** (*build variables*) en Cloudflare, no como secretos del worker. Solo la URL y la clave *publishable*; la *secret* nunca. Si faltan o tienen mal formato, la compilación falla con un mensaje claro (lo valida `env.schema`).
- **Recursos:** `ASSETS` (los estáticos) y `SESSION` (un KV que añade el adaptador para las sesiones de Astro; no lo usamos, Wrangler lo crea solo y es gratis).

## Primera vez (lo hace el usuario en el panel de Cloudflare)

1. **Workers & Pages → Create → Import a repository → GitHub** y elige `yue-codes/sanssouci` (si no aparece, da permiso a la app de Cloudflare en GitHub para ese repositorio).
2. Configuración:

   | Campo | Valor |
   |---|---|
   | Project name | `sanssouci` (debe coincidir con el `name` de `package.json`, que el adaptador usa como nombre del worker) |
   | Production branch | `main` |
   | Build command | `pnpm build` |
   | Deploy command | `npx wrangler deploy` (el de por defecto) |
   | Root directory | `/` (vacío) |

3. **Build variables** (en *Advanced settings* o, después, en *Settings → Build → Variables and secrets*): `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, con los mismos valores que `.env`.
4. **Supabase → Authentication → URL Configuration** (cuando sepas la dirección, `https://sanssouci.<subdominio>.workers.dev`):
   - *Site URL*: la dirección pública.
   - *Redirect URLs*: añade `https://sanssouci.<subdominio>.workers.dev/**` y deja la de `localhost` para seguir probando en local.
   Sin esto, los enlaces de los correos (activar la cuenta, recuperar la contraseña) llevarían a `localhost`.

## Volver a publicar

- **Lo normal:** `git push` a `main`. Cloudflare compila y publica solo (tarda unos minutos).
- **A mano, desde tu equipo** (por si Cloudflare falla): `! pnpm wrangler login` una vez y luego `pnpm desplegar` (compila con tu `.env` y publica).
- **Volver a una versión anterior:** Workers & Pages → `sanssouci` → *Deployments* → elige una versión → *Rollback*.

## Dónde mirar si algo falla

- **La compilación falló:** Workers & Pages → `sanssouci` → *Deployments* → la compilación → su registro. Lo típico: faltan las variables de compilación o falla `astro check`/el build (pruébalo antes en local con `pnpm build`).
- **Errores de la web ya publicada:** *Observability → Logs* del worker (activados con `observability.enabled`). Ahí salen los `console.error` del servidor (`[entrar]`, `[progresoDeVisita]`, …). También en directo con `pnpm wrangler tail`.
- **Los enlaces de los correos van a localhost o dan «ese enlace ya no sirve»:** revisa el paso 4 (URL Configuration) y las plantillas de `docs/supabase.md` §7.

## Antes de compartir la web

Casi todas las imágenes son ajenas: sirven mientras la web es personal. Antes de compartirla con otras personas, hay que cambiarlas (ver `docs/arquitectura.md`, «Imágenes»).
