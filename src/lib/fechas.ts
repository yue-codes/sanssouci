/**
 * @file Utilidades de fechas del plan.
 *
 * Son funciones puras (no leen nada global), así que sirven igual en el servidor,
 * en el navegador y en pruebas. Las fechas de los JSON van en formato ISO
 * ("AAAA-MM-DD") y se interpretan en la hora local.
 */

/**
 * Convierte "AAAA-MM-DD" en una fecha local a mediodía.
 * Usar mediodía evita que un cambio de zona horaria la mueva al día anterior.
 *
 * @param iso Fecha en formato "AAAA-MM-DD".
 */
export function parsearFecha(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d, 12);
}

/**
 * Días naturales entre dos fechas, ignorando la hora.
 *
 * @returns `b − a` en días (negativo si `b` es anterior).
 */
export function diasEntre(a: Date, b: Date): number {
  const MS_DIA = 86_400_000;
  const inicio = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const fin = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((fin - inicio) / MS_DIA);
}

/**
 * Número de día del plan que corresponde a `hoy`.
 *
 * @param hoy Fecha de referencia.
 * @param inicioIso Fecha del día 1, en formato "AAAA-MM-DD".
 * @returns 1 el día de inicio; 0 o negativo si aún no empieza; más de 90 si ya terminó.
 * @example diaDelPlan(new Date(2026, 10, 3), "2026-11-02") // → 2
 */
export function diaDelPlan(hoy: Date, inicioIso: string): number {
  return diasEntre(parsearFecha(inicioIso), hoy) + 1;
}

/**
 * Fecha en texto largo en español de México.
 * @example fechaLarga("2026-11-02") // → "lunes, 2 de noviembre"
 */
export function fechaLarga(iso: string): string {
  return parsearFecha(iso).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

/**
 * Fecha corta, sin día de la semana.
 * @example fechaCorta("2026-11-02") // → "2 nov"
 */
export function fechaCorta(iso: string): string {
  return parsearFecha(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
}

/**
 * Posición del día en una semana que empieza en lunes: 0 = lunes … 6 = domingo.
 * (`Date.getDay()` empieza en domingo = 0; aquí se desplaza).
 */
export function indiceDiaSemana(iso: string): number {
  return (parsearFecha(iso).getDay() + 6) % 7;
}

/**
 * Fecha de hoy («AAAA-MM-DD») en una zona horaria, sea cual sea la del servidor.
 *
 * Cloudflare Workers funciona en UTC; `new Date()` a secas daría el día equivocado
 * por la noche en México (justo a la hora de practicar).
 *
 * @param zona Zona horaria IANA, p. ej. "America/Mexico_City".
 * @param ahora Instante de referencia (por defecto, ahora mismo; útil para pruebas).
 * @example hoyIso("America/Mexico_City", new Date("2026-11-03T02:00:00Z")) // → "2026-11-02" (8 pm en México)
 */
export function hoyIso(zona: string, ahora: Date = new Date()): string {
  // El formato de Canadá en inglés («en-CA») es justo AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}
