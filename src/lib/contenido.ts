/**
 * @file Acceso al contenido del juego (las colecciones de `src/data`).
 *
 * Centralizarlo aquí evita repetir `getCollection` + ordenar + buscar por id en
 * cada página. Solo se usa en el servidor (frontmatter de Astro): las islas de
 * Preact reciben datos ya preparados por props.
 */
import { getCollection, type CollectionEntry } from "astro:content";

/** Tipos de cada entrada, generados por Astro a partir de los esquemas de `content.config.ts`. */
export type Cancion = CollectionEntry<"canciones">;
export type Nivel = CollectionEntry<"niveles">;
export type Jefe = CollectionEntry<"jefes">;
export type Logro = CollectionEntry<"logros">;
export type Dia = CollectionEntry<"dias">;
export type Ruta = CollectionEntry<"rutas">;
/** Categoría de un logro (cada una es una rama del árbol de habilidades). */
export type CategoriaLogro = Logro["data"]["categoria"];

/**
 * Carga todas las colecciones a la vez y devuelve, además de los arreglos,
 * índices por id (`Map`) para buscar en O(1).
 *
 * @returns Colecciones (los niveles, ya ordenados por `orden`) e índices `*PorId`.
 * @example
 * const c = await cargarContenido();
 * const jefe = c.jefePorId.get("jefe-0");
 */
export async function cargarContenido() {
  const [rutas, niveles, jefes, logros, canciones, dias] = await Promise.all([
    getCollection("rutas"),
    getCollection("niveles"),
    getCollection("jefes"),
    getCollection("logros"),
    getCollection("canciones"),
    getCollection("dias"),
  ]);
  const indice = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  return {
    rutas, logros, canciones, dias, jefes,
    niveles: [...niveles].sort((a, b) => a.data.orden - b.data.orden),
    rutaPorId: indice(rutas),
    nivelPorId: indice(niveles),
    jefePorId: indice(jefes),
    logroPorId: indice(logros),
    cancionPorId: indice(canciones),
  };
}

/** Todo el contenido cargado, tal como lo devuelve `cargarContenido()`. */
export type Contenido = Awaited<ReturnType<typeof cargarContenido>>;

/**
 * Una obra es «reto de oído» si ninguna versión tiene partitura y alguna es de oído.
 * Es un dato derivado: se calcula, no se guarda en los JSON.
 *
 * @param c Canción a evaluar.
 * @returns `true` si hay que sacarla de oído (con la guitarra).
 */
export function esRetoDeOido(c: Cancion): boolean {
  const usos = c.data.versiones.flatMap((v) => v.usos);
  return !usos.includes("partitura") && usos.includes("de-oido");
}

/** URL del video en YouTube a partir de su id. */
export const urlYoutube = (id: string) => `https://www.youtube.com/watch?v=${id}`;
/**
 * URL para incrustar el video. Usa el dominio «nocookie» de YouTube, que no deja
 * cookies de seguimiento hasta que se reproduce.
 */
export const urlEmbedYoutube = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
/** URL de la miniatura (480×360) del video a partir de su id. */
export const miniaturaYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
