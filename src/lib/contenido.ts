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
/** Una sesión de la semana 0 (antes del día 1). */
export type SesionArranque = CollectionEntry<"arranque">;
/** La semana tipo de una zona (la rutina después del día 90). */
export type SemanaTipo = CollectionEntry<"semanas">;
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
  const [rutas, niveles, jefes, logros, canciones, dias, arranque, semanas] = await Promise.all([
    getCollection("rutas"),
    getCollection("niveles"),
    getCollection("jefes"),
    getCollection("logros"),
    getCollection("canciones"),
    getCollection("dias"),
    getCollection("arranque"),
    getCollection("semanas"),
  ]);
  const indice = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));
  return {
    rutas, logros, canciones, dias, jefes,
    arranque: [...arranque].sort((a, b) => a.data.numero - b.data.numero),
    semanas,
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

/**
 * Nombre de una ruta sin el prefijo «Ruta», para etiquetas cortas.
 * @example nombreCortoRuta(ruta) // "Ruta Ghibli" → "Ghibli"
 */
export const nombreCortoRuta = (ruta: Ruta) => ruta.data.nombre.replace(/^Ruta /, "");
