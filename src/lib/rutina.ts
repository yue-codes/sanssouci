/**
 * @file La rutina después del día 90: semanas tipo por zona (`semanas.json`).
 *
 * Del día 91 en adelante no hay calendario. Cada semana repite la semana tipo de tu
 * zona actual (lunes, martes, miércoles, viernes y sábado; jueves y domingo, descanso),
 * y cada 4 semanas el sábado se cambia por la revisión del mes. Funciones puras.
 */
import type { Nivel, SemanaTipo } from "@/lib/contenido";
import { diasEntre, indiceDiaSemana, parsearFecha, sumarDias } from "@/lib/fechas";

/** Cada cuántas semanas el sábado es de revisión. */
export const SEMANAS_POR_REVISION = 4;

/** Posición de cada día de práctica en la semana (0 = lunes) → índice de su sesión en la semana tipo. */
const SESION_DEL_DIA = new Map([[0, 0], [1, 1], [2, 2], [4, 3], [5, 4]]);

/**
 * La semana tipo de una zona. Si esa zona no tiene (la 0, la de antes de la flauta),
 * la de la siguiente zona que sí tenga; si ninguna, la última.
 *
 * @param semanas Todas las semanas tipo.
 * @param niveles Las zonas (para saber el orden de cada una).
 * @param orden Orden de la zona actual (ver `ordenZonaActual`).
 */
export function semanaDeZona(semanas: readonly SemanaTipo[], niveles: readonly Nivel[], orden: number): SemanaTipo {
  const ordenDe = (s: SemanaTipo) => niveles.find((n) => n.id === s.data.nivel.id)?.data.orden ?? Infinity;
  const enOrden = [...semanas].sort((a, b) => ordenDe(a) - ordenDe(b));
  return enOrden.find((s) => ordenDe(s) >= orden) ?? enOrden[enOrden.length - 1];
}

/** Una sesión de la rutina con su fecha. */
export interface SesionDeRutina {
  titulo: string;
  objetivo: string;
  bloques: SemanaTipo["data"]["revision"]["bloques"];
  /** Fecha (ISO) en que toca. */
  fecha: string;
  /** ¿Es la revisión del mes (en lugar de la sesión normal del sábado)? */
  revision: boolean;
  /** `hoy` si toca hoy; `proxima` si hoy es descanso y es la siguiente. */
  motivo: "hoy" | "proxima";
  /** Número de semana desde que acabó el plan (la 1 empieza el lunes siguiente al día 90). */
  semana: number;
}

/**
 * La sesión de la rutina que toca hoy (o la siguiente, si hoy se descansa).
 *
 * @param semana La semana tipo de tu zona (ver `semanaDeZona`).
 * @param fechaHoy Fecha de hoy, «AAAA-MM-DD».
 * @param dia90 Fecha del día 90 del plan: la rutina cuenta las semanas desde el lunes siguiente.
 * @example sesionDeRutina(semana, "2027-03-06", "2027-02-06") // sábado de la semana 4 → la revisión del mes
 */
export function sesionDeRutina(semana: SemanaTipo, fechaHoy: string, dia90: string): SesionDeRutina {
  const lunes = sumarDias(dia90, 2); // el día 90 es sábado: el lunes siguiente es +2
  for (let k = 0; k < 7; k++) {
    const fecha = sumarDias(fechaHoy, k);
    const i = SESION_DEL_DIA.get(indiceDiaSemana(fecha));
    if (i === undefined) continue;
    const numSemana = Math.max(1, Math.floor(diasEntre(parsearFecha(lunes), parsearFecha(fecha)) / 7) + 1);
    const revision = i === 4 && numSemana % SEMANAS_POR_REVISION === 0;
    const s = revision ? semana.data.revision : semana.data.sesiones[i];
    return { titulo: s.titulo, objetivo: s.objetivo, bloques: s.bloques, fecha, revision, motivo: k === 0 ? "hoy" : "proxima", semana: numSemana };
  }
  throw new Error("Una semana siempre tiene algún día de práctica.");
}
