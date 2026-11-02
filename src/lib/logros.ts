/**
 * @file Utilidades sobre logros que necesitan el contenido cargado.
 * (Las reglas puras, sin contenido, están en progreso.ts).
 */
import type { Contenido, Logro } from "@/lib/contenido";
import { estadoLogro, type EstadoLogro } from "@/lib/progreso";

/** Un logro junto con su estado para el jugador. */
export interface LogroConEstado {
  logro: Logro;
  estado: EstadoLogro;
}

/**
 * Busca los logros por id y les añade su estado para el jugador.
 *
 * @param c Contenido cargado con `cargarContenido()`.
 * @param ids Ids de logros (por ejemplo, los `requiere` de un jefe).
 * @param obtenidos Ids de los logros que el jugador ya tiene.
 * @returns En el mismo orden que `ids`.
 */
export function logrosConEstado(c: Contenido, ids: readonly string[], obtenidos: ReadonlySet<string>): LogroConEstado[] {
  return ids.map((id) => {
    const logro = c.logroPorId.get(id)!;
    return { logro, estado: estadoLogro(id, logro.data.requiere.map((r) => r.id), obtenidos) };
  });
}
