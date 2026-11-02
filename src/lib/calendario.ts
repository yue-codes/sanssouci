/**
 * @file Datos del calendario de 90 días: semanas, minutos e hitos de cada día.
 * Funciones puras sobre las entradas de `dias.json`.
 */
import type { Dia } from "@/lib/contenido";
import { indiceDiaSemana } from "@/lib/fechas";

/** Algo destacable de un día, que se marca en el calendario. */
export type Hito = "jefe" | "clase" | "flauta" | "festivo";

/** Una semana del plan, de lunes a domingo. */
export interface Semana {
  /** Número de semana (1 a 13). */
  numero: number;
  /** 7 posiciones (lunes a domingo); `null` donde el plan no tiene día (la última semana). */
  dias: (Dia | null)[];
  /** Fase de la semana; `mixta` si cambia a mitad de semana. */
  fase: Dia["data"]["fase"] | "mixta";
  /** Fechas ISO del primer y el último día del plan en esa semana. */
  inicio: string;
  fin: string;
}

/**
 * Agrupa los días por semana, colocando cada uno en su día de la semana.
 *
 * @param dias Los días del plan, en cualquier orden.
 * @returns Semanas ordenadas por número.
 */
export function semanasDelPlan(dias: readonly Dia[]): Semana[] {
  const porSemana = new Map<number, Dia[]>();
  for (const d of [...dias].sort((a, b) => a.data.numero - b.data.numero)) {
    porSemana.set(d.data.semana, [...(porSemana.get(d.data.semana) ?? []), d]);
  }
  return [...porSemana.entries()]
    .sort(([a], [b]) => a - b)
    .map(([numero, ds]) => {
      const huecos: (Dia | null)[] = Array(7).fill(null);
      for (const d of ds) huecos[indiceDiaSemana(d.data.fecha)] = d;
      const fases = new Set(ds.map((d) => d.data.fase));
      return {
        numero,
        dias: huecos,
        fase: fases.size > 1 ? "mixta" : ds[0].data.fase,
        inicio: ds[0].data.fecha,
        fin: ds[ds.length - 1].data.fecha,
      };
    });
}

/** Minutos totales de un día (0 en los de descanso). */
export function minutosDelDia(dia: Dia): number {
  return dia.data.bloques.reduce((s, b) => s + b.minutos, 0);
}

/**
 * Hitos de un día: jefe, primera clase (bloque de tipo «clase»), llegada de la
 * flauta (el primer día de la fase con flauta) o festivo.
 *
 * @param dia Día a evaluar.
 * @param primerDiaConFlauta Número del primer día con flauta (ver `primerDiaConFlauta`).
 */
export function hitosDelDia(dia: Dia, primerDiaConFlauta: number): Hito[] {
  const d = dia.data;
  const hitos: Hito[] = [];
  if (d.numero === primerDiaConFlauta) hitos.push("flauta");
  if (d.bloques.some((b) => b.tipo === "clase")) hitos.push("clase");
  if (d.jefe) hitos.push("jefe");
  if (d.tipo === "festivo-opcional") hitos.push("festivo");
  return hitos;
}

/** Número del primer día de la fase con flauta (la llegada estimada). */
export function primerDiaConFlauta(dias: readonly Dia[]): number {
  return Math.min(...dias.filter((d) => d.data.fase === "con-flauta").map((d) => d.data.numero));
}

/** Qué sesión enseñar como «la de hoy» y por qué. */
export interface SesionDeReferencia {
  /** El día de práctica a mostrar. */
  dia: Dia;
  /**
   * - `hoy`: hoy toca esta sesión.
   * - `proxima`: hoy es descanso (o aún no empieza el plan); es la siguiente.
   * - `terminado`: ya pasaron los 90 días; es la última.
   */
  motivo: "hoy" | "proxima" | "terminado";
}

/**
 * Elige la sesión que se enseña en la portada a partir del número de día de hoy.
 *
 * @param dias Los días del plan (en cualquier orden).
 * @param hoy Número de día de hoy (ver `diaDelPlan`); puede ser ≤ 0 o > 90.
 * @example sesionDeReferencia(dias, 4) // día 4 es jueves (descanso) → { dia: día 5, motivo: "proxima" }
 */
export function sesionDeReferencia(dias: readonly Dia[], hoy: number): SesionDeReferencia {
  const practica = dias.filter((d) => d.data.tipo !== "descanso").sort((a, b) => a.data.numero - b.data.numero);
  const siguiente = practica.find((d) => d.data.numero >= hoy);
  if (!siguiente) return { dia: practica[practica.length - 1], motivo: "terminado" };
  return { dia: siguiente, motivo: siguiente.data.numero === hoy ? "hoy" : "proxima" };
}

/** Título grande según el momento del plan, en tres trozos (el del medio va resaltado). */
export interface TitularDelDia {
  antes: string;
  enfasis: string;
  despues: string;
}

/**
 * Qué dice el título grande de la portada y del panel según el día del plan.
 *
 * @param hoy Número de día de hoy (ver `diaDelPlan`); puede ser ≤ 0 o > 90.
 * @example titularDelDia(5)  // → { antes: "Día", enfasis: "5", despues: " de 90." }
 * @example titularDelDia(0)  // → { antes: "Empiezas", enfasis: "mañana", despues: "." }
 */
export function titularDelDia(hoy: number): TitularDelDia {
  if (hoy < 1) return { antes: "Empiezas", enfasis: hoy === 0 ? "mañana" : `en ${1 - hoy} días`, despues: "." };
  if (hoy > 90) return { antes: "Los 90 días", enfasis: "terminaron", despues: "; el camino sigue." };
  return { antes: "Día", enfasis: String(hoy), despues: " de 90." };
}
