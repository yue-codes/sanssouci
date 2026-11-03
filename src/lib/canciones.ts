/**
 * @file Resumen plano de cada obra del catálogo.
 *
 * El resumen (`CancionResumen`) tiene solo datos planos, para poder pasarlo a
 * una isla de Preact. Se calcula en el servidor; los filtros que trabajan sobre
 * él están en `@/lib/catalogo`.
 */
import type { Cancion, Contenido } from "@/lib/contenido";
import { esRetoDeOido, nombreCortoRuta } from "@/lib/contenido";
import type { EstadoCancion } from "@/lib/estado-cancion";

/** Lo que muestra una tarjeta de canción. */
export interface CancionResumen {
  id: string;
  titulo: string;
  obra: string;
  compositor?: string;
  dificultad: number;
  ruta: { id: string; nombre: string; color: string };
  zona: { id: string; orden: number; nombre: string };
  /** Video de la primera versión (para la miniatura). */
  youtubeId: string;
  versiones: number;
  conPartitura: boolean;
  retoDeOido: boolean;
  /** Cuántos de sus requisitos (logros) te faltan; 0 = ya puedes tocarla. */
  faltan: number;
  /** Nombre del jefe, si es la canción de un jefe. */
  jefe?: string;
  /** Dónde vas con ella (pendiente si no has dicho nada). */
  estado: EstadoCancion;
}

/**
 * Convierte una entrada del catálogo en su resumen plano.
 * @param c Contenido cargado con `cargarContenido()`.
 * @param cancion Obra a resumir.
 * @param obtenidos Ids de los logros del jugador (para saber si ya puede tocarla).
 * @param estados Estado de cada canción por id (ver `cargarEstadosCanciones`); las que no estén, pendientes.
 * @example resumirCancion(c, cancion, progreso.obtenidos).faltan // → 2
 */
export function resumirCancion(
  c: Contenido,
  cancion: Cancion,
  obtenidos: ReadonlySet<string>,
  estados: ReadonlyMap<string, EstadoCancion> = new Map(),
): CancionResumen {
  const d = cancion.data;
  const ruta = c.rutaPorId.get(d.ruta.id)!;
  const nivel = c.nivelPorId.get(d.nivel.id)!;
  return {
    id: cancion.id,
    titulo: d.titulo,
    obra: d.obra,
    compositor: d.compositor,
    dificultad: d.dificultad,
    ruta: { id: ruta.id, nombre: nombreCortoRuta(ruta), color: ruta.data.color },
    zona: { id: nivel.id, orden: nivel.data.orden, nombre: nivel.data.nombre },
    youtubeId: d.versiones[0].youtubeId,
    versiones: d.versiones.length,
    conPartitura: d.versiones.some((v) => v.usos.includes("partitura")),
    retoDeOido: esRetoDeOido(cancion),
    faltan: d.requiere.filter((r) => !obtenidos.has(r.id)).length,
    jefe: c.jefes.find((j) => j.data.cancion.id === cancion.id)?.data.nombre,
    estado: estados.get(cancion.id) ?? "pendiente",
  };
}
