/**
 * @file Endpoint POST /auth/salir: cierra la sesión y vuelve a la portada.
 *
 * Es POST (desde un `<form method="post">`) y no un enlace GET a propósito:
 * así ningún enlace, imagen o precarga del navegador puede cerrarte la sesión sin querer.
 */
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals, redirect }) => {
  await locals.supabase.auth.signOut();
  return redirect("/", 303);
};
