/**
 * @file Utilidades sobre jefes que necesitan el contenido cargado.
 */
import type { Contenido, Dia, Jefe } from "@/lib/contenido";

/**
 * Jefes en el orden del camino: por zona y, dentro de la misma zona, por id
 * (así jefe-8a va antes que jefe-8b).
 */
export function jefesEnOrden(c: Contenido): Jefe[] {
  const orden = (j: Jefe) => c.nivelPorId.get(j.data.nivel.id)!.data.orden;
  return [...c.jefes].sort((a, b) => orden(a) - orden(b) || a.id.localeCompare(b.id));
}

/**
 * Día del plan de 90 días en que toca enfrentarse a un jefe.
 * @returns `undefined` si el jefe queda fuera de los 90 días (de la zona 3 en adelante).
 */
export function diaDelJefe(c: Contenido, jefeId: string): Dia | undefined {
  return c.dias.find((d) => d.data.jefe?.id === jefeId);
}
