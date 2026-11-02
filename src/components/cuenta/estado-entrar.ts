/**
 * @file Qué pasó con el formulario de /entrar en una visita. Lo calcula la
 * página (que habla con Supabase) y lo pinta `TarjetaEntrar`.
 */

/** Formulario (con correo y error opcionales) o «enlace enviado». */
export type EstadoEntrar =
  | { tipo: "formulario"; email: string; error?: string }
  | { tipo: "enviado"; email: string };
