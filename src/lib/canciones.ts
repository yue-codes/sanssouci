/**
 * @file Resumen plano de cada obra del catálogo.
 *
 * El resumen (`CancionResumen`) tiene solo datos planos, para poder pasarlo a
 * una isla de Preact. Se calcula en el servidor; los filtros que trabajan sobre
 * él están en `@/lib/catalogo`.
 */
import type { Cancion, Contenido } from "@/lib/contenido";
import { esRetoDeOido, nombreCortoRuta } from "@/lib/contenido";

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
}

/**
 * Convierte una entrada del catálogo en su resumen plano.
 * @param c Contenido cargado con `cargarContenido()`.
 * @param cancion Obra a resumir.
 */
export function resumirCancion(c: Contenido, cancion: Cancion): CancionResumen {
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
  };
}
