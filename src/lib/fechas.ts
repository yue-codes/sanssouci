/**
 * Utilidades de fechas del plan. Son funciones puras (no leen nada global), así que
 * se pueden usar igual en el servidor, en el navegador y en pruebas.
 */

/** Convierte "AAAA-MM-DD" en una fecha local a mediodía (evita saltos por zona horaria). */
export function parsearFecha(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d, 12);
}

/** Días enteros entre dos fechas (b − a). */
export function diasEntre(a: Date, b: Date): number {
  const MS_DIA = 86_400_000;
  const inicio = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const fin = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((fin - inicio) / MS_DIA);
}

/**
 * Número de día del plan para `hoy`: 1 el día de inicio, 0 o negativo si aún no empieza,
 * más de 90 si ya terminó.
 */
export function diaDelPlan(hoy: Date, inicioIso: string): number {
  return diasEntre(parsearFecha(inicioIso), hoy) + 1;
}

export function fechaLarga(iso: string): string {
  return parsearFecha(iso).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}
