/**
 * @file Reglas del progreso del jugador.
 *
 * Son funciones puras: reciben datos y devuelven un resultado, sin leer la base
 * de datos ni el DOM. Así sirven igual en una página de Astro (servidor) que en
 * una isla de Preact (navegador). En la fase 4, `obtenidos` vendrá de Supabase.
 */

/** Estado de un logro para un jugador concreto. */
export type EstadoLogro = "conseguido" | "disponible" | "bloqueado";

/**
 * Un logro está desbloqueado cuando ya tienes todo lo que `requiere`.
 *
 * @param requiere Ids de los logros previos.
 * @param obtenidos Ids de los logros que el jugador ya tiene.
 * @example estaDesbloqueado(["logro-clave-sol"], new Set(["logro-clave-sol"])) // → true
 */
export function estaDesbloqueado(requiere: readonly string[], obtenidos: ReadonlySet<string>): boolean {
  return requiere.every((id) => obtenidos.has(id));
}

/**
 * Clasifica un logro como conseguido, disponible (puedes ir por él) o
 * bloqueado (te falta algo antes).
 *
 * @param id Id del logro.
 * @param requiere Ids de sus requisitos.
 * @param obtenidos Ids de los logros que el jugador ya tiene.
 */
export function estadoLogro(id: string, requiere: readonly string[], obtenidos: ReadonlySet<string>): EstadoLogro {
  if (obtenidos.has(id)) return "conseguido";
  return estaDesbloqueado(requiere, obtenidos) ? "disponible" : "bloqueado";
}
