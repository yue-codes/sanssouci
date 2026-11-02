/**
 * @file Middleware: se ejecuta antes de cada página de servidor y de cada endpoint.
 *
 * 1. Crea el cliente de Supabase de la petición y averigua quién visita
 *    (`Astro.locals.supabase` y `Astro.locals.usuario`).
 * 2. Protege las rutas privadas (`RUTAS_PRIVADAS`): sin sesión, a `/entrar`.
 * 3. Añade a la respuesta las cabeceras anti-caché si se tocó la sesión.
 *
 * Las páginas prerenderizadas no pasan por aquí en cada visita (son HTML ya hecho),
 * así que se saltan: no hay cookies que leer.
 */
import { defineMiddleware } from "astro:middleware";
import { RUTAS_PRIVADAS } from "@/config/sitio";
import { crearClienteServidor, usuarioActual } from "@/lib/supabase";

/**
 * ¿La ruta es privada? Coincide la ruta exacta o algo debajo de ella
 * (`/perfil` y `/perfil/editar`, pero no `/perfilado`).
 */
const esPrivada = (ruta: string) => RUTAS_PRIVADAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();

  const cabeceras = new Headers();
  ctx.locals.supabase = crearClienteServidor(ctx.request, ctx.cookies, cabeceras);
  ctx.locals.usuario = await usuarioActual(ctx.locals.supabase);

  const respuesta =
    !ctx.locals.usuario && esPrivada(ctx.url.pathname)
      ? ctx.redirect(`/entrar?siguiente=${encodeURIComponent(ctx.url.pathname + ctx.url.search)}`)
      : await next();
  // También en la redirección: una sesión caducada pudo borrar cookies en esta petición.
  cabeceras.forEach((valor, clave) => respuesta.headers.set(clave, valor));
  return respuesta;
});
