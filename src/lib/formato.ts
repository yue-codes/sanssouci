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
