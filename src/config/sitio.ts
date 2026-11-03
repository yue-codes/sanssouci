/**
 * @file Configuración general del sitio: nombre, descripción y navegación.
 *
 * Los datos que no son contenido del juego, pero que aparecen en varias partes
 * de la interfaz, viven aquí para cambiarlos en un solo sitio.
 */

/** Nombre y descripción por defecto (para `<title>` y `<meta name="description">`). */
export const SITIO = {
  nombre: "Sanssouci",
  descripcion: "Plan de práctica de flauta traversa con niveles, jefes y logros.",
  idioma: "es",
  /**
   * Zona horaria del plan. El servidor (Cloudflare) funciona en UTC: sin esto,
   * a las 8 pm de México ya sería «mañana» y el panel enseñaría otra sesión.
   */
  zonaHoraria: "America/Mexico_City",
} as const;

/**
 * Horario de práctica (decidido con el usuario). La sesión empieza a la hora de
 * `inicio` y dura lo que sumen sus bloques (45 a 60 min).
 */
export const HORARIO = {
  dias: "lun, mar, mié, vie y sáb",
  inicio: "20:00",
  fin: "22:00",
} as const;

/** Un enlace de la navegación principal. */
export interface EnlaceNavegacion {
  /** Ruta interna, empezando por "/". */
  href: string;
  /** Texto visible del enlace. */
  texto: string;
}

/** Enlaces de la cabecera, en el orden en que se muestran. */
export const NAVEGACION: readonly EnlaceNavegacion[] = [
  { href: "/panel", texto: "Panel" },
  { href: "/mapa", texto: "Mapa" },
  { href: "/arbol", texto: "Árbol" },
  { href: "/calendario", texto: "Calendario" },
  { href: "/canciones", texto: "Canciones" },
  { href: "/repertorio", texto: "Repertorio" },
  { href: "/logros", texto: "Logros" },
];

/**
 * Rutas que exigen sesión. El middleware (`src/middleware.ts`) manda a `/entrar`
 * a quien visite una de ellas (o algo debajo, p. ej. `/perfil/editar`) sin sesión.
 * Esas páginas deben declarar `export const prerender = false`.
 */
export const RUTAS_PRIVADAS: readonly string[] = ["/panel", "/perfil", "/contrasena"];
