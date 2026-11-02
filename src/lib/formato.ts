/**
 * @file Formato de valores para mostrar en la interfaz (puro).
 */

/**
 * Duración en segundos como "m:ss" (o "h:mm:ss" si pasa de una hora).
 *
 * @param segundos Duración total; `null` si se desconoce.
 * @returns Texto formateado, o `null` si no hay duración.
 * @example duracion(397) // → "6:37"
 */
export function duracion(segundos: number | null): string | null {
  if (segundos === null) return null;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = String(segundos % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * Suma minutos a una hora «HH:MM» (formato de 24 h, sin pasar de medianoche).
 *
 * @param hora Hora de partida, p. ej. "20:00".
 * @param minutos Minutos a sumar.
 * @returns La hora resultante en «HH:MM».
 * @example sumarMinutos("20:00", 45) // → "20:45"
 */
export function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = (h * 60 + m + minutos) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
