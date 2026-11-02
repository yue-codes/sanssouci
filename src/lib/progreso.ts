/**
 * Reglas del progreso, como funciones puras: reciben datos y devuelven un resultado,
 * sin leer la base de datos ni el DOM. Así se pueden usar igual en una página de Astro
 * (en el servidor) que en una isla de Preact (en el navegador).
 */

export type EstadoLogro = "conseguido" | "disponible" | "bloqueado";

/** Un logro está desbloqueado cuando ya tienes todo lo que `requiere`. */
export function estaDesbloqueado(requiere: readonly string[], obtenidos: ReadonlySet<string>): boolean {
  return requiere.every((id) => obtenidos.has(id));
}

/** Conseguido, disponible (puedes ir por él) o bloqueado (te falta algo antes). */
export function estadoLogro(id: string, requiere: readonly string[], obtenidos: ReadonlySet<string>): EstadoLogro {
  if (obtenidos.has(id)) return "conseguido";
  return estaDesbloqueado(requiere, obtenidos) ? "disponible" : "bloqueado";
}
