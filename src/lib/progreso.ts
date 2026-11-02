/**
 * @file Reglas del progreso del jugador.
 *
 * Son funciones puras: reciben datos y devuelven un resultado, sin leer la base
 * de datos ni el DOM. Así sirven igual en una página de Astro (servidor) que en
 * una isla de Preact (navegador). En la fase 4, el `Progreso` vendrá de Supabase.
 */

/** Lo que el jugador lleva conseguido. Solo ids: los datos completos están en el contenido. */
export interface Progreso {
  /** Ids de los logros obtenidos. */
  obtenidos: ReadonlySet<string>;
  /** Ids de los jefes vencidos. */
  jefesVencidos: ReadonlySet<string>;
}

/** Estado de un logro para un jugador concreto. */
export type EstadoLogro = "conseguido" | "disponible" | "bloqueado";

/** Estado de una zona (nivel) para un jugador concreto. */
export type EstadoZona = "superada" | "actual" | "bloqueada";

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

/**
 * Orden de la zona en la que está el jugador: la primera cuyos jefes no ha
 * vencido todos. Una zona se supera venciendo a su jefe (o jefes, como la 8).
 *
 * @param zonas Zonas con su `orden` y los ids de sus jefes, en cualquier orden.
 * @param jefesVencidos Ids de los jefes vencidos.
 * @returns El `orden` de la zona actual. Si las venció todas, el de la última.
 * @example
 * ordenZonaActual([{ orden: 0, jefes: ["jefe-0"] }, { orden: 1, jefes: ["jefe-1"] }], new Set(["jefe-0"])) // → 1
 */
export function ordenZonaActual(
  zonas: readonly { orden: number; jefes: readonly string[] }[],
  jefesVencidos: ReadonlySet<string>,
): number {
  const ordenadas = [...zonas].sort((a, b) => a.orden - b.orden);
  const pendiente = ordenadas.find((z) => !z.jefes.every((j) => jefesVencidos.has(j)));
  return (pendiente ?? ordenadas[ordenadas.length - 1]).orden;
}

/**
 * Estado de una zona según su posición respecto a la actual.
 *
 * @param orden Orden de la zona.
 * @param ordenActual Orden de la zona actual (ver `ordenZonaActual`).
 */
export function estadoZona(orden: number, ordenActual: number): EstadoZona {
  if (orden < ordenActual) return "superada";
  return orden === ordenActual ? "actual" : "bloqueada";
}

/**
 * Racha: sesiones de práctica seguidas completadas, contando hacia atrás desde hoy.
 *
 * Los días de descanso no cuentan ni rompen la racha (no están en `diasPractica`).
 * Si hoy toca práctica y aún no la has hecho, la racha no se rompe todavía:
 * se cuenta desde la sesión anterior (tienes hasta medianoche).
 *
 * @param diasPractica Números de los días de práctica del plan (en cualquier orden).
 * @param completados  Números de los días completados.
 * @param hoy          Número de día de hoy (ver `diaDelPlan`).
 * @returns Cuántas sesiones seguidas llevas.
 * @example
 * // Días de práctica 1, 2, 3, 5; completados 2 y 3; hoy es 5 y aún no practicas:
 * racha([1, 2, 3, 5], new Set([2, 3]), 5) // → 2
 */
export function racha(diasPractica: readonly number[], completados: ReadonlySet<number>, hoy: number): number {
  const hastaHoy = diasPractica.filter((n) => n <= hoy).sort((a, b) => b - a);
  if (hastaHoy[0] === hoy && !completados.has(hoy)) hastaHoy.shift();
  let cuenta = 0;
  for (const n of hastaHoy) {
    if (!completados.has(n)) break;
    cuenta++;
  }
  return cuenta;
}
