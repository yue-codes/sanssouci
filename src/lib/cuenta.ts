/**
 * @file Cuentas con correo y contraseña: validar los formularios de /entrar y
 * /contrasena y traducir los errores de Supabase Auth a mensajes para la persona.
 *
 * Funciones puras: reciben lo que mandó el formulario y devuelven datos limpios o
 * un mensaje. Las páginas solo las llaman y hablan con Supabase. El servidor valida
 * aunque el navegador ya lo haga (`type="email"`, `minlength`): cualquiera puede
 * mandar un POST sin pasar por el formulario.
 *
 * Nunca guardamos ni vemos la contraseña: pasa por aquí solo para validarla y
 * viaja a Supabase, que guarda su hash (bcrypt).
 */
import { z } from "astro/zod";

/** Las caras del formulario de /entrar (`?modo=` en la URL). */
export const MODOS_ENTRAR = ["entrar", "registro", "recuperar"] as const;
export type ModoEntrar = (typeof MODOS_ENTRAR)[number];

/** Límites de la contraseña. Si cambias el mínimo, cámbialo también en Supabase (ver docs/supabase.md). */
export const CONTRASENA_MIN = 8;
/** bcrypt ignora lo que pase de 72 bytes: más largo daría una falsa sensación de seguridad. */
export const CONTRASENA_MAX_BYTES = 72;

/**
 * Lee el modo de la URL; cualquier otra cosa es «entrar».
 *
 * @param valor El parámetro `modo` de la URL (o `null`).
 * @returns Un modo válido.
 */
export function modoEntrar(valor: string | null): ModoEntrar {
  return MODOS_ENTRAR.find((m) => m === valor) ?? "entrar";
}

/**
 * URL de /entrar en un modo, conservando a dónde volver después.
 *
 * @param modo Qué cara del formulario.
 * @param siguiente Ruta interna ya validada (`rutaInterna`).
 * @example urlEntrar("registro", "/mapa") // "/entrar?modo=registro&siguiente=%2Fmapa"
 */
export function urlEntrar(modo: ModoEntrar, siguiente: string): string {
  const q = new URLSearchParams();
  if (modo !== "entrar") q.set("modo", modo);
  if (siguiente !== "/") q.set("siguiente", siguiente);
  const s = q.toString();
  return s ? `/entrar?${s}` : "/entrar";
}

const correo = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Ese correo es demasiado largo.")
  .pipe(z.email({ error: "Escribe un correo válido, como nombre@ejemplo.com." }));

const contrasenaNueva = z
  .string()
  .min(CONTRASENA_MIN, `La contraseña necesita al menos ${CONTRASENA_MIN} caracteres.`)
  .refine((s) => new TextEncoder().encode(s).length <= CONTRASENA_MAX_BYTES, "La contraseña es demasiado larga (máximo 72 caracteres).");

/** Para entrar solo se exige que no esté vacía: dar pistas sobre las reglas no ayuda a nadie. */
const contrasenaActual = z.string().min(1, "Escribe tu contraseña.").max(200, "Esa contraseña es demasiado larga.");

/** Resultado de validar: los datos limpios, o un mensaje (y el correo, para volver a pintarlo). */
export type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string; email: string };

const texto = (datos: FormData, campo: string) => String(datos.get(campo) ?? "");
const primerError = (e: z.ZodError) => e.issues[0]?.message ?? "Revisa los datos.";

/**
 * Valida correo y contraseña de /entrar (modos «entrar» y «registro»).
 *
 * @param datos El `FormData` del POST (campos `email` y `contrasena`).
 * @param nueva `true` al crear la cuenta: entonces se exigen las reglas de longitud.
 * @returns `{ email, contrasena }` limpios, o el primer error.
 */
export function validarCredenciales(datos: FormData, nueva: boolean): Resultado<{ email: string; contrasena: string }> {
  const email = texto(datos, "email");
  const r = z
    .object({ email: correo, contrasena: nueva ? contrasenaNueva : contrasenaActual })
    .safeParse({ email, contrasena: texto(datos, "contrasena") });
  return r.success ? { ok: true, datos: r.data } : { ok: false, error: primerError(r.error), email: email.trim() };
}

/**
 * Valida el correo de «¿Olvidaste tu contraseña?».
 *
 * @param datos El `FormData` del POST (campo `email`).
 * @returns El correo limpio, o el error.
 */
export function validarCorreo(datos: FormData): Resultado<string> {
  const email = texto(datos, "email");
  const r = correo.safeParse(email);
  return r.success ? { ok: true, datos: r.data } : { ok: false, error: primerError(r.error), email: email.trim() };
}

/**
 * Valida la contraseña nueva de /contrasena.
 *
 * @param datos El `FormData` del POST (campo `contrasena`).
 * @returns La contraseña, o el error.
 */
export function validarContrasenaNueva(datos: FormData): { ok: true; contrasena: string } | { ok: false; error: string } {
  const r = contrasenaNueva.safeParse(texto(datos, "contrasena"));
  return r.success ? { ok: true, contrasena: r.data } : { ok: false, error: primerError(r.error) };
}

/**
 * Mensaje para la persona a partir de un error de Supabase Auth.
 *
 * Al entrar, el mensaje no dice si falló el correo o la contraseña: así nadie
 * puede averiguar qué correos tienen cuenta.
 *
 * @param error El error de `supabase.auth.*` (basta con su `code` y su `status`).
 * @returns Un texto en español, sin detalles técnicos (esos van a `console.error`).
 */
export function mensajeErrorAuth(error: { code?: string; status?: number }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Antes de entrar, activa tu cuenta con el enlace que te mandamos al correo.";
    case "weak_password":
      return `Esa contraseña es demasiado débil. Usa al menos ${CONTRASENA_MIN} caracteres; mejor una frase.`;
    case "same_password":
      return "Esa ya es tu contraseña. Escribe una distinta.";
    case "reauthentication_needed":
      return "Por seguridad, cierra sesión y usa «¿Olvidaste tu contraseña?» para cambiarla.";
    case "signup_disabled":
      return "Ahora mismo no se pueden crear cuentas nuevas.";
  }
  // 429: Supabase limita intentos y correos (por persona cada minuto y en total por hora).
  if (error.status === 429) return "Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.";
  return "Algo falló. Inténtalo de nuevo en un momento.";
}
