/**
 * @file Progreso real de quien ha iniciado sesión, leído de Supabase (solo servidor).
 *
 * Devuelve el mismo `Progreso` que usaban las páginas con `PROGRESO_EJEMPLO`,
 * más lo que solo existe con datos reales (perfil y días completados).
 * No filtra por usuario: RLS ya hace que cada consulta devuelva solo tus filas.
 */
import type { Progreso } from "@/lib/progreso";
import type { ClienteSupabase } from "@/lib/supabase";
import type { Database } from "@/lib/tipos-supabase";

/** Fila de `perfiles`. */
export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
/** Fila de `dias_completados`. */
export type DiaCompletado = Database["public"]["Tables"]["dias_completados"]["Row"];

/** Todo lo que se sabe del progreso de una persona. */
export interface ProgresoUsuario {
  /** Su perfil (fechas del plan, nombre). */
  perfil: Perfil;
  /** Logros conseguidos y jefes vencidos, con la forma que esperan las funciones de `progreso.ts`. */
  progreso: Progreso;
  /** Días completados, por id (`dia-01`…). */
  diasCompletados: ReadonlyMap<string, DiaCompletado>;
}

/**
 * Carga el progreso de quien visita. Las cuatro consultas van en paralelo
 * (`Promise.all`): no dependen unas de otras, así que no hay por qué esperarlas en fila.
 *
 * @param supabase Cliente de la petición (`Astro.locals.supabase`), con sesión.
 * @returns El progreso.
 * @throws Si Supabase falla o no existe el perfil (lo crea un trigger al registrarse).
 */
export async function cargarProgresoUsuario(supabase: ClienteSupabase): Promise<ProgresoUsuario> {
  const [perfil, dias, logros, jefes] = await Promise.all([
    supabase.from("perfiles").select("*").single(),
    supabase.from("dias_completados").select("*"),
    supabase.from("logros_obtenidos").select("logro_id"),
    supabase.from("victorias_jefe").select("jefe_id"),
  ]);
  const error = perfil.error ?? dias.error ?? logros.error ?? jefes.error;
  if (error) throw new Error(`No se pudo leer el progreso: ${error.message}`);

  return {
    perfil: perfil.data!,
    progreso: {
      obtenidos: new Set(logros.data!.map((l) => l.logro_id)),
      jefesVencidos: new Set(jefes.data!.map((j) => j.jefe_id)),
    },
    diasCompletados: new Map(dias.data!.map((d) => [d.dia_id, d])),
  };
}
