/**
 * @file Progreso real de quien ha iniciado sesión, leído de Supabase (solo servidor).
 *
 * Devuelve el mismo `Progreso` (`src/lib/progreso.ts`) que esperan todas las funciones del juego,
 * más lo que solo existe con datos reales (perfil y días completados).
 * No filtra por usuario: RLS ya hace que cada consulta devuelva solo tus filas.
 */
import { esEstadoCancion, type EstadoCancion } from "@/lib/estado-cancion";
import type { Progreso } from "@/lib/progreso";
import type { ClienteSupabase } from "@/lib/supabase";
import type { Database } from "@/lib/tipos-supabase";

/** Fila de `perfiles`. */
export type Perfil = Database["public"]["Tables"]["perfiles"]["Row"];
/** Fila de `dias_completados`. */
export type DiaCompletado = Database["public"]["Tables"]["dias_completados"]["Row"];

/**
 * Lo que una isla necesita saber de un día marcado (sin `user_id` ni `dia_id`).
 * Es lo que devuelve la acción `marcarDia`.
 */
export type RegistroDia = Pick<DiaCompletado, "completado_en" | "minutos" | "notas">;

/** Fila de `victorias_jefe`. */
export type VictoriaJefe = Database["public"]["Tables"]["victorias_jefe"]["Row"];

/**
 * Lo que una isla necesita saber de una victoria (sin `user_id` ni `jefe_id`).
 * Es lo que devuelve la acción `registrarVictoria`.
 */
export type Victoria = Pick<VictoriaJefe, "video_url" | "tempo_logrado" | "vencido_en">;

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
  const [perfil, dias, progreso] = await Promise.all([
    supabase.from("perfiles").select("*").single(),
    supabase.from("dias_completados").select("*"),
    cargarProgreso(supabase),
  ]);
  const error = perfil.error ?? dias.error;
  if (error) throw new Error(`No se pudo leer el progreso: ${error.message}`);

  return {
    perfil: perfil.data!,
    progreso,
    diasCompletados: new Map(dias.data!.map((d) => [d.dia_id, d])),
  };
}

/** Progreso de quien no ha entrado: nada conseguido, nada vencido. */
export const PROGRESO_VACIO: Progreso = { obtenidos: new Set(), jefesVencidos: new Set() };

/**
 * Carga solo los logros y los jefes vencidos (lo que piden las funciones de `progreso.ts`).
 * Es lo que necesitan las Server Islands que pintan el mapa, el árbol o los logros.
 *
 * Sin sesión no hay nada que consultar: usa `PROGRESO_VACIO`.
 *
 * @param supabase Cliente de la petición (`Astro.locals.supabase`), con sesión.
 * @returns El progreso.
 * @throws Si Supabase falla.
 *
 * @example
 * const progreso = usuario ? await cargarProgreso(supabase) : PROGRESO_VACIO;
 */
export async function cargarProgreso(supabase: ClienteSupabase): Promise<Progreso> {
  const [logros, jefes] = await Promise.all([
    supabase.from("logros_obtenidos").select("logro_id"),
    supabase.from("victorias_jefe").select("jefe_id"),
  ]);
  const error = logros.error ?? jefes.error;
  if (error) throw new Error(`No se pudo leer el progreso: ${error.message}`);
  return {
    obtenidos: new Set(logros.data!.map((l) => l.logro_id)),
    jefesVencidos: new Set(jefes.data!.map((j) => j.jefe_id)),
  };
}

/**
 * Carga el estado de tus canciones (solo las que no están pendientes: esas no se guardan).
 *
 * @param supabase Cliente de la petición (`Astro.locals.supabase`), con sesión.
 * @param cancionId Si se pasa, solo esa canción (para su ficha).
 * @returns Estado por id de canción.
 * @throws Si Supabase falla.
 */
export async function cargarEstadosCanciones(supabase: ClienteSupabase, cancionId?: string): Promise<Map<string, EstadoCancion>> {
  let consulta = supabase.from("estado_canciones").select("cancion_id, estado");
  if (cancionId) consulta = consulta.eq("cancion_id", cancionId);
  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudo leer el estado de las canciones: ${error.message}`);
  // La columna es texto: se descarta lo que no sea un estado válido.
  const filas = data.flatMap((f) => (esEstadoCancion(f.estado) ? [[f.cancion_id, f.estado] as const] : []));
  return new Map(filas);
}

/** El progreso de quien visita una página pública, y en qué situación se cargó. */
export interface ProgresoDeVisita {
  /** Su progreso, o `PROGRESO_VACIO` sin sesión o si Supabase falló. */
  progreso: Progreso;
  /** ¿Hay sesión (y se pudo leer el progreso)? Sin ella, la página invita a entrar. */
  sesion: boolean;
  /** Hay sesión pero Supabase falló: la página se pinta igual y avisa. */
  fallo: boolean;
}

/**
 * Carga el progreso de quien visita una página pública (de servidor o Server Island).
 *
 * Nunca lanza: si Supabase falla, devuelve el progreso vacío con `fallo: true`. Una
 * página pública debe verse aunque la base de datos no responda (y en una Server
 * Island, un error dejaría el esqueleto en pantalla para siempre).
 *
 * @param locals `Astro.locals` (el middleware deja ahí el cliente y el usuario).
 * @returns El progreso y si hay sesión o hubo un fallo.
 *
 * @example
 * const { progreso, sesion, fallo } = await progresoDeVisita(Astro.locals);
 */
export async function progresoDeVisita(locals: App.Locals): Promise<ProgresoDeVisita> {
  if (!locals.usuario) return { progreso: PROGRESO_VACIO, sesion: false, fallo: false };
  try {
    return { progreso: await cargarProgreso(locals.supabase), sesion: true, fallo: false };
  } catch (e) {
    console.error("[progresoDeVisita]", e);
    return { progreso: PROGRESO_VACIO, sesion: false, fallo: true };
  }
}
