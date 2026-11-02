/**
 * @file Rareza de una obra según su dificultad, como las cartas de un juego.
 * Un solo sitio para el tramo, el nombre y los colores: lo usan la carta
 * (`TarjetaCancion`), la barra de dificultad (`Dificultad`) y la ficha.
 *
 * Los tramos siguen lo escasas que son en el catálogo (al 2 nov 2026: 27 comunes,
 * 74 raras, 16 épicas y 7 legendarias). Las clases van escritas enteras porque
 * Tailwind solo genera las clases que encuentra literalmente en el código.
 */

/** Una rareza y cómo se pinta. */
export interface Rareza {
  nombre: "Común" | "Rara" | "Épica" | "Legendaria";
  /** Dificultad máxima del tramo (incluida). */
  hasta: number;
  /** Clase de color de texto. */
  texto: string;
  /** Clase de color de fondo (barras, puntos). */
  fondo: string;
  /** Clase de color de borde. */
  borde: string;
}

export const RAREZAS: readonly Rareza[] = [
  { nombre: "Común", hasta: 3, texto: "text-texto/80", fondo: "bg-texto/70", borde: "border-borde-fuerte" },
  { nombre: "Rara", hasta: 6, texto: "text-acento", fondo: "bg-acento", borde: "border-acento/45" },
  { nombre: "Épica", hasta: 8, texto: "text-resalte", fondo: "bg-resalte", borde: "border-resalte/50" },
  { nombre: "Legendaria", hasta: 10, texto: "text-peligro", fondo: "bg-peligro", borde: "border-peligro/60" },
];

/**
 * Rareza de una dificultad (1–10).
 * @example rarezaDe(7).nombre // → "Épica"
 */
export function rarezaDe(dificultad: number): Rareza {
  return RAREZAS.find((r) => dificultad <= r.hasta) ?? RAREZAS[RAREZAS.length - 1];
}
