/**
 * @file URLs de YouTube a partir del id de un video. Funciones puras sin
 * dependencias, así que se pueden usar también dentro de las islas.
 */

/** URL del video en YouTube a partir de su id. */
export const urlYoutube = (id: string) => `https://www.youtube.com/watch?v=${id}`;
/**
 * URL para incrustar el video. Usa el dominio «nocookie» de YouTube, que no deja
 * cookies de seguimiento hasta que se reproduce.
 */
export const urlEmbedYoutube = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
/** URL de la miniatura (480×360) del video a partir de su id. */
export const miniaturaYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
