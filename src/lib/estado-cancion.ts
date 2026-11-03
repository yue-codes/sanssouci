/**
 * @file Los estados de una canción para cada persona (pendiente, aprendiendo, dominada).
 *
 * Va en un archivo propio y sin imports a propósito: así lo pueden importar las
 * islas (el catálogo, el selector) además del servidor. `@/lib/canciones` no sirve
 * para eso, porque importa `@/lib/contenido`, que solo existe en el servidor.
 */

/** Los estados posibles, en orden de avance. */
export const ESTADOS_CANCION = ["pendiente", "aprendiendo", "dominada"] as const;

/** Dónde vas con una canción. «pendiente» es el valor por defecto: no se guarda. */
export type EstadoCancion = (typeof ESTADOS_CANCION)[number];

/**
 * ¿Es un estado válido? Sirve para lo que llega como texto (la URL, la base de datos).
 *
 * @example esEstadoCancion("dominada") // → true
 * @example esEstadoCancion("hola")     // → false
 */
export const esEstadoCancion = (texto: string): texto is EstadoCancion => (ESTADOS_CANCION as readonly string[]).includes(texto);
