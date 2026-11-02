/**
 * @file Cliente de Supabase para el servidor (middleware, páginas con `prerender = false`
 * y endpoints). La sesión viaja en cookies, así el servidor sabe quién visita.
 *
 * Solo para el servidor: usa `AstroCookies`. Una isla de Preact no debe importarlo.
 */
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "astro:env/client";
import type { Database } from "@/lib/tipos-supabase";

/** Cliente de Supabase con los tipos de nuestras tablas. */
export type ClienteSupabase = SupabaseClient<Database>;

/**
 * Crea un cliente de Supabase para UNA petición.
 *
 * Hay que crear uno nuevo en cada petición: guarda la sesión de quien visita
 * y las cabeceras anti-caché solo se entregan una vez por cliente.
 *
 * @param request   La petición entrante (de ahí se leen las cookies).
 * @param cookies   Las cookies de Astro (ahí se escriben las de la sesión renovada).
 * @param cabeceras Cabeceras de la respuesta. Cuando Supabase escribe cookies de sesión,
 *                  añade aquí `Cache-Control: private, no-store…` para que ningún CDN
 *                  guarde una respuesta con la sesión de alguien y se la sirva a otro.
 * @returns El cliente, listo para `auth.*` y `from(…)`.
 *
 * @example
 * const supabase = crearClienteServidor(ctx.request, ctx.cookies, cabecerasPendientes);
 */
export function crearClienteServidor(
  request: Request,
  cookies: AstroCookies,
  cabeceras: Headers,
): ClienteSupabase {
  return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get("Cookie") ?? ""),
      setAll: (lista, cabecerasCache) => {
        for (const { name, value, options } of lista) cookies.set(name, value, options);
        for (const [clave, valor] of Object.entries(cabecerasCache)) cabeceras.set(clave, valor);
      },
    },
  });
}

/** Lo que el servidor sabe de quien ha iniciado sesión. */
export interface Usuario {
  /** Id de Supabase Auth (el mismo que `perfiles.id` y `user_id` en las tablas). */
  id: string;
  /** Correo con el que entró, si lo hay. */
  email: string | null;
}

/**
 * Devuelve quién ha iniciado sesión, o `null`.
 *
 * Usa `getClaims()`, que verifica la firma del token de sesión. NO uses `getSession()`
 * en el servidor para esto: lee la cookie tal cual y cualquiera puede falsificarla.
 *
 * @param supabase Cliente creado con `crearClienteServidor`.
 * @returns El usuario, o `null` si no hay sesión válida.
 */
export async function usuarioActual(supabase: ClienteSupabase): Promise<Usuario | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return { id: data.claims.sub, email: data.claims.email ?? null };
}

/**
 * Comprueba que `siguiente` sea una ruta interna del sitio (para redirigir tras entrar).
 *
 * Evita la «redirección abierta»: sin esta comprobación, un enlace como
 * `/entrar?siguiente=https://sitio-falso.com` llevaría a alguien fuera tras iniciar sesión.
 *
 * @param siguiente Valor recibido en la URL (puede ser cualquier cosa).
 * @param porDefecto Ruta si `siguiente` no es válida.
 * @returns Una ruta que empieza por "/" (y no por "//", que sería otro dominio).
 *
 * @example
 * rutaInterna("/panel")            // "/panel"
 * rutaInterna("//malo.com", "/")   // "/"
 */
export function rutaInterna(siguiente: string | null | undefined, porDefecto = "/"): string {
  return siguiente && /^\/(?![/\\])/.test(siguiente) ? siguiente : porDefecto;
}
