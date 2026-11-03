/**
 * @file Endpoint GET /auth/confirmar: a donde llevan los enlaces de los correos de
 * Supabase (activar la cuenta y recuperar la contraseña).
 *
 * Supabase redirige aquí con un `code` (flujo PKCE, el de por defecto) o con
 * `token_hash` + `type` (si algún día se cambia la plantilla del correo). Aquí se
 * cambia eso por una sesión, que queda guardada en cookies, y se manda a `siguiente`.
 *
 * Ojo con PKCE: el enlace debe abrirse en el MISMO navegador donde se pidió,
 * porque la otra mitad del código (el «verificador») está en una cookie de ese navegador.
 */
import type { APIRoute } from "astro";
import type { EmailOtpType } from "@supabase/supabase-js";
import { rutaInterna } from "@/lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type") as EmailOtpType | null;
  const siguiente = rutaInterna(url.searchParams.get("siguiente"));

  const { error } = code
    ? await locals.supabase.auth.exchangeCodeForSession(code)
    : tokenHash && tipo
      ? await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
      : { error: new Error("Faltan parámetros") };

  if (error) {
    return redirect(`/entrar?error=enlace&siguiente=${encodeURIComponent(siguiente)}`);
  }
  return redirect(siguiente);
};
