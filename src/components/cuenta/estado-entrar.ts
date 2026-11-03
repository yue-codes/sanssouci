/**
 * @file Qué pasó con el formulario de /entrar en una visita. Lo calcula la
 * página (que habla con Supabase) y lo pinta `TarjetaEntrar`.
 */
import type { ModoEntrar } from "@/lib/cuenta";

/**
 * - `formulario`: una de las tres caras (entrar, crear cuenta, recuperar), con el
 *   correo ya escrito y un error opcional.
 * - `enviado`: se mandó un correo (activar la cuenta o poner contraseña nueva).
 */
export type EstadoEntrar =
  | { tipo: "formulario"; modo: ModoEntrar; email: string; error?: string }
  | { tipo: "enviado"; motivo: "registro" | "recuperar"; email: string };
