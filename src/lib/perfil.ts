/**
 * @file Validación del formulario de /perfil (nombre y fechas del plan).
 *
 * Es una función pura: recibe lo que mandó el formulario y devuelve los datos
 * limpios o los errores por campo. La página solo la llama y habla con Supabase.
 * El servidor valida aunque el navegador ya lo haga (`type="date"`, `maxlength`):
 * cualquiera puede mandar un POST sin pasar por el formulario.
 */
import { z } from "astro/zod";

/** Los campos del formulario, con el `name` de cada `<input>`. */
export interface ValoresPerfil {
  nombre: string;
  /** Día 1 del plan, «AAAA-MM-DD». */
  fechaInicio: string;
  /** Día en que llegó la flauta, «AAAA-MM-DD», o "" si aún no llega. */
  fechaFlauta: string;
}

/** Los datos ya limpios, con los nombres de las columnas de `perfiles`. */
export interface DatosPerfil {
  nombre: string | null;
  fecha_inicio: string;
  fecha_llegada_flauta: string | null;
}

/** Resultado de validar: los datos o un mensaje por campo con error. */
export type ResultadoPerfil =
  | { ok: true; datos: DatosPerfil }
  | { ok: false; errores: Partial<Record<keyof ValoresPerfil, string>> };

const esquema = z
  .object({
    // Vacío = sin nombre (el panel usará el de tu correo).
    nombre: z.string().trim().max(80, "El nombre puede tener hasta 80 letras."),
    fechaInicio: z.iso.date({ error: "Elige la fecha en que empezaste (día 1)." }),
    fechaFlauta: z.union([z.literal(""), z.iso.date({ error: "Esa fecha no es válida." })]),
  })
  // Las fechas «AAAA-MM-DD» se pueden comparar como texto. La tabla lo exige también.
  .refine((d) => !d.fechaFlauta || d.fechaFlauta >= d.fechaInicio, {
    path: ["fechaFlauta"],
    message: "La flauta no puede llegar antes del día 1 del plan.",
  });

/**
 * Lee los campos de un formulario (siempre como texto; lo que falte, vacío).
 *
 * @param datos El `FormData` del POST.
 * @returns Los valores, para validarlos o volver a pintarlos si hay errores.
 */
export function valoresDeFormulario(datos: FormData): ValoresPerfil {
  const texto = (campo: string) => String(datos.get(campo) ?? "");
  return { nombre: texto("nombre"), fechaInicio: texto("fechaInicio"), fechaFlauta: texto("fechaFlauta") };
}

/**
 * Valida el formulario del perfil.
 *
 * @param valores Lo que mandó el formulario.
 * @returns `{ ok: true, datos }` listos para `update`, o `{ ok: false, errores }`.
 *
 * @example
 * validarPerfil({ nombre: "Yue", fechaInicio: "2026-11-02", fechaFlauta: "" })
 * // → { ok: true, datos: { nombre: "Yue", fecha_inicio: "2026-11-02", fecha_llegada_flauta: null } }
 */
export function validarPerfil(valores: ValoresPerfil): ResultadoPerfil {
  const r = esquema.safeParse(valores);
  if (!r.success) {
    const campos = z.flattenError(r.error).fieldErrors;
    return {
      ok: false,
      errores: { nombre: campos.nombre?.[0], fechaInicio: campos.fechaInicio?.[0], fechaFlauta: campos.fechaFlauta?.[0] },
    };
  }
  return {
    ok: true,
    datos: { nombre: r.data.nombre || null, fecha_inicio: r.data.fechaInicio, fecha_llegada_flauta: r.data.fechaFlauta || null },
  };
}
