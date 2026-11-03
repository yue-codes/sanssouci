/**
 * @file «¿Cuándo puedo tocarla?»: cuándo se abre cada canción.
 *
 * Una canción se abre cuando tienes todos los logros de su `requiere`. Para estimar
 * CUÁNDO, se mira el plan de 90 días: cada logro aparece como «recompensa posible»
 * (`logrosPosibles`) en algún día. El día estimado de un logro es el primero en que
 * el plan lo ofrece, y nunca antes que el de sus propios requisitos. El de una
 * canción es el más tardío de los logros que le faltan. Si alguno no está en los
 * 90 días, la canción queda para su zona (con la estimación de esa zona).
 *
 * Es una estimación: con progreso real, lo que manda es lo que te falta de verdad.
 */
import type { Cancion, Contenido, Logro, Nivel } from "@/lib/contenido";
import { fechaCorta } from "@/lib/fechas";

/**
 * Día estimado del plan en que cada logro está a tu alcance (ver el `@file`).
 *
 * @param c Contenido cargado con `cargarContenido()`.
 * @returns Mapa id de logro → número de día; `Infinity` si no se alcanza en los 90 días.
 * @example diasEstimadosDeLogros(c).get("logro-registro-grave") // → 41
 */
export function diasEstimadosDeLogros(c: Contenido): Map<string, number> {
  const primero = new Map<string, number>();
  for (const d of [...c.dias].sort((a, b) => a.data.numero - b.data.numero)) {
    for (const l of d.data.logrosPosibles) if (!primero.has(l.id)) primero.set(l.id, d.data.numero);
  }
  const memo = new Map<string, number>();
  const dia = (id: string, camino = new Set<string>()): number => {
    const guardado = memo.get(id);
    if (guardado !== undefined) return guardado;
    if (camino.has(id)) return Infinity; // ciclo de requisitos (no debería haber)
    camino.add(id);
    const requisitos = c.logroPorId.get(id)?.data.requiere ?? [];
    const valor = Math.max(primero.get(id) ?? Infinity, ...requisitos.map((r) => dia(r.id, camino)));
    memo.set(id, valor);
    return valor;
  };
  for (const l of c.logros) dia(l.id);
  return memo;
}

/** Dónde está una canción para ti y cuándo se abre. */
export interface AlcanceCancion {
  cancion: Cancion;
  /** Su zona (la de `nivel`). */
  zona: Nivel;
  /** Logros de su `requiere` que aún no tienes. */
  faltan: Logro[];
  /** ¿Ya la puedes tocar? (no te falta nada). */
  abierta: boolean;
  /**
   * Día estimado del plan en que se abre (1 a 90), si lo que falta está en los 90 días.
   * `undefined` si ya está abierta o si queda para después del día 90.
   */
  dia?: number;
}

/**
 * Para cada canción: qué le falta, si ya está abierta y su día estimado.
 *
 * @param c Contenido cargado con `cargarContenido()`.
 * @param obtenidos Ids de tus logros (vacío sin sesión).
 * @param dias Resultado de `diasEstimadosDeLogros(c)` (se pasa para no recalcularlo).
 * @example alcanceDeCanciones(c, new Set(), diasEstimadosDeLogros(c)).find((a) => a.cancion.id === "wellerman")?.dia // → 29
 */
export function alcanceDeCanciones(c: Contenido, obtenidos: ReadonlySet<string>, dias: ReadonlyMap<string, number>): AlcanceCancion[] {
  return c.canciones.map((cancion) => {
    const faltan = cancion.data.requiere.filter((r) => !obtenidos.has(r.id)).map((r) => c.logroPorId.get(r.id)!);
    const dia = faltan.length ? Math.max(...faltan.map((l) => dias.get(l.id) ?? Infinity)) : undefined;
    return {
      cancion,
      zona: c.nivelPorId.get(cancion.data.nivel.id)!,
      faltan,
      abierta: faltan.length === 0,
      dia: dia !== undefined && Number.isFinite(dia) ? dia : undefined,
    };
  });
}

/**
 * Las canciones cerradas más cerca de abrirse: primero las que necesitan menos
 * logros, luego las que llegan antes en el plan y luego las más fáciles.
 *
 * @param alcances Resultado de `alcanceDeCanciones`.
 * @param cuantas Cuántas devolver.
 */
export function proximasCanciones(alcances: readonly AlcanceCancion[], cuantas = 4): AlcanceCancion[] {
  return alcances
    .filter((a) => !a.abierta)
    .sort(
      (a, b) =>
        a.faltan.length - b.faltan.length ||
        (a.dia ?? Infinity) - (b.dia ?? Infinity) ||
        a.cancion.data.dificultad - b.cancion.data.dificultad,
    )
    .slice(0, cuantas);
}

/** Lo mínimo de una canción para saber si un logro la abre (datos planos: sirve en una isla). */
export interface CancionRequisitos {
  id: string;
  titulo: string;
  /** Ids de los logros que pide. */
  requiere: string[];
}

/**
 * Canciones que se abren justo al conseguir un logro: lo piden y, con él, ya tienes
 * todos sus requisitos. Es pura y sin `astro:content`, así que la puede usar una isla.
 *
 * @param canciones Canciones con sus requisitos (ver `CancionRequisitos`).
 * @param logro Id del logro que acabas de conseguir.
 * @param obtenidos Tus logros, YA incluido `logro`.
 * @example cancionesQueSeAbren([{ id: "x", titulo: "X", requiere: ["a", "b"] }], "b", new Set(["a", "b"])) // → [la X]
 */
export function cancionesQueSeAbren(
  canciones: readonly CancionRequisitos[],
  logro: string,
  obtenidos: ReadonlySet<string>,
): CancionRequisitos[] {
  return canciones.filter((c) => c.requiere.includes(logro) && c.requiere.every((r) => obtenidos.has(r)));
}

/**
 * Cuándo se abre una canción, en texto corto para mostrar.
 *
 * @param a Su alcance (ver `alcanceDeCanciones`).
 * @param c Contenido (para la fecha del día estimado).
 * @param hoy Número de día de hoy en el plan (puede ser ≤ 0 o > 90).
 * @example cuandoSeAbre(alcanceDeBellaCiao, c, 3)  // → "≈ día 41 · 19 dic"
 * @example cuandoSeAbre(alcanceDeCzardas, c, 3)    // → "Zona 7 · ≈ 3–4+ años (estimación)"
 */
export function cuandoSeAbre(a: AlcanceCancion, c: Contenido, hoy: number): string {
  if (a.abierta) return "Ya puedes tocarla";
  if (a.dia === undefined) return `Zona ${a.zona.data.orden} · ${a.zona.data.estimacion}`;
  // Si el plan ya pasó ese día y aún te falta algo, la fecha no dice nada: depende de ti.
  if (a.dia < hoy) return "En cuanto consigas lo que falta";
  const fecha = c.dias.find((d) => d.data.numero === a.dia)?.data.fecha;
  return `≈ día ${a.dia}${fecha ? ` · ${fechaCorta(fecha)}` : ""}`;
}
