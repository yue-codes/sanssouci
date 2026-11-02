/**
 * @file Utilidades sobre logros que necesitan el contenido cargado.
 * (Las reglas puras, sin contenido, están en progreso.ts).
 */
import type { Cancion, CategoriaLogro, Contenido, Jefe, Logro, Nivel } from "@/lib/contenido";
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

/**
 * Dónde aparece un logro en el resto del contenido: lo que abre y cuándo se
 * trabaja. Se calcula «dando la vuelta» a las referencias de los JSON (cada
 * canción dice qué logros requiere; aquí se pregunta al revés).
 */
export interface UsosLogro {
  /** Logros que lo tienen como requisito. */
  abre: Logro[];
  /** Canciones que lo requieren antes de empezarlas. */
  canciones: Cancion[];
  /** Jefes que lo requieren. */
  jefes: Jefe[];
  /** Zonas que lo piden para pasar a la siguiente. */
  zonas: Nivel[];
  /** Números de los días del plan en los que se puede conseguir. */
  dias: number[];
}

/**
 * Calcula los usos de todos los logros de una vez (recorrer el contenido una
 * sola vez es más simple que buscar logro por logro).
 *
 * @param c Contenido cargado con `cargarContenido()`.
 * @returns Un mapa id de logro → sus usos; todos los logros tienen entrada.
 * @example usosDeLogros(c).get("logro-clave-sol")?.abre // → logros que piden clave de sol
 */
export function usosDeLogros(c: Contenido): Map<string, UsosLogro> {
  const usos = new Map<string, UsosLogro>(
    c.logros.map((l) => [l.id, { abre: [], canciones: [], jefes: [], zonas: [], dias: [] }]),
  );
  const de = (ref: { id: string }) => usos.get(ref.id)!;

  for (const l of c.logros) l.data.requiere.forEach((r) => de(r).abre.push(l));
  for (const s of c.canciones) s.data.requiere.forEach((r) => de(r).canciones.push(s));
  for (const j of c.jefes) j.data.requiere.forEach((r) => de(r).jefes.push(j));
  for (const n of c.niveles) n.data.requisitosParaPasar.forEach((r) => de(r).zonas.push(n));
  for (const d of c.dias) d.data.logrosPosibles.forEach((r) => de(r).dias.push(d.data.numero));
  for (const u of usos.values()) u.dias.sort((a, b) => a - b);
  return usos;
}

/** Cuántos logros de una categoría hay y cuántos tiene el jugador. */
export interface AvanceCategoria {
  categoria: CategoriaLogro;
  total: number;
  conseguidos: number;
}

/**
 * Avance del jugador en cada categoría, en el orden pedido.
 *
 * @param logros Logros con su estado (ver `logrosConEstado`).
 * @param orden Categorías en el orden en que se quieren (p. ej. `ORDEN_RAMAS`).
 */
export function avancePorCategoria(logros: readonly LogroConEstado[], orden: readonly CategoriaLogro[]): AvanceCategoria[] {
  return orden.map((categoria) => {
    const deCategoria = logros.filter((l) => l.logro.data.categoria === categoria);
    return { categoria, total: deCategoria.length, conseguidos: deCategoria.filter((l) => l.estado === "conseguido").length };
  });
}
