/**
 * Acceso al contenido del juego desde las páginas.
 * Centralizarlo aquí evita repetir `getCollection` + ordenar + buscar por id en cada página.
 */
import { getCollection, type CollectionEntry } from "astro:content";

export type Cancion = CollectionEntry<"canciones">;
export type Nivel = CollectionEntry<"niveles">;
export type Jefe = CollectionEntry<"jefes">;
export type Logro = CollectionEntry<"logros">;
export type Dia = CollectionEntry<"dias">;
export type Ruta = CollectionEntry<"rutas">;

/** Carga todas las colecciones de una vez y devuelve índices por id. */
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

/** Una obra es "reto de oído" si no hay partitura en ninguna versión y alguna es de oído. */
export function esRetoDeOido(c: Cancion): boolean {
  const usos = c.data.versiones.flatMap((v) => v.usos);
  return !usos.includes("partitura") && usos.includes("de-oido");
}

export const urlYoutube = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const miniaturaYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
