/**
 * @file Filtros y orden del catálogo de canciones. Funciones puras que trabajan
 * sobre `CancionResumen` (datos planos), así que la isla `CatalogoCanciones`
 * las usa en el navegador. Los filtros se pueden guardar en la URL
 * (`/canciones?ruta=ghibli&zona=nivel-2`) para enlazar una búsqueda.
 *
 * Importante: este archivo no debe importar valores de `@/lib/contenido`
 * (depende de `astro:content`, que solo existe en el servidor). Solo `import type`.
 */
import type { CancionResumen } from "@/lib/canciones";
import { esEstadoCancion, type EstadoCancion } from "@/lib/estado-cancion";

/** Criterios de orden del catálogo. */
export type Orden = "dificultad" | "titulo" | "zona";

/** Filtros del catálogo. Un campo vacío (o `false`) no filtra. */
export interface Filtros {
  /** Texto a buscar en título, obra y compositor (sin distinguir acentos ni mayúsculas). */
  texto: string;
  /** Ids de rutas; vacío = todas. */
  rutas: string[];
  /** Id de zona; "" = todas. */
  zona: string;
  /** Dificultad máxima (1–10). */
  dificultadMax: number;
  soloOido: boolean;
  soloPartitura: boolean;
  /** Solo las que ya puedes tocar (no te falta ningún requisito). */
  soloListas: boolean;
  /** Tu avance con ella; "" = cualquiera. */
  estado: "" | EstadoCancion;
  orden: Orden;
}

export const FILTROS_VACIOS: Filtros = {
  texto: "",
  rutas: [],
  zona: "",
  dificultadMax: 10,
  soloOido: false,
  soloPartitura: false,
  soloListas: false,
  estado: "",
  orden: "dificultad",
};

/**
 * Pasa a minúsculas y quita acentos, para buscar «canción» escribiendo «cancion».
 * @example normalizar("Canción") // → "cancion"
 */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Aplica los filtros y el orden.
 * @returns Un arreglo nuevo; no modifica `lista`.
 */
export function filtrarCanciones(lista: readonly CancionResumen[], f: Filtros): CancionResumen[] {
  const texto = normalizar(f.texto.trim());
  const resultado = lista.filter(
    (s) =>
      (!texto || normalizar(`${s.titulo} ${s.obra} ${s.compositor ?? ""}`).includes(texto)) &&
      (f.rutas.length === 0 || f.rutas.includes(s.ruta.id)) &&
      (!f.zona || s.zona.id === f.zona) &&
      s.dificultad <= f.dificultadMax &&
      (!f.soloOido || s.retoDeOido) &&
      (!f.soloPartitura || s.conPartitura) &&
      (!f.soloListas || s.faltan === 0) &&
      (!f.estado || s.estado === f.estado),
  );
  const porTitulo = (a: CancionResumen, b: CancionResumen) => a.titulo.localeCompare(b.titulo, "es");
  const comparar = {
    dificultad: (a: CancionResumen, b: CancionResumen) => a.dificultad - b.dificultad || porTitulo(a, b),
    titulo: porTitulo,
    zona: (a: CancionResumen, b: CancionResumen) => a.zona.orden - b.zona.orden || a.dificultad - b.dificultad || porTitulo(a, b),
  }[f.orden];
  return resultado.sort(comparar);
}

/** Cuántos filtros (sin contar el orden) están activos. */
export function filtrosActivos(f: Filtros): number {
  return [f.texto.trim() !== "", f.rutas.length > 0, f.zona !== "", f.dificultadMax < 10, f.soloOido, f.soloPartitura, f.soloListas, f.estado !== ""].filter(Boolean).length;
}

/**
 * Lee los filtros de los parámetros de la URL. Lo que falte o no sea válido
 * toma el valor por defecto.
 * @example filtrosDesdeURL(new URLSearchParams("ruta=ghibli&oido=1"))
 */
export function filtrosDesdeURL(p: URLSearchParams): Filtros {
  const max = Number(p.get("max"));
  const orden = p.get("orden");
  const estado = p.get("estado") ?? "";
  return {
    texto: p.get("q") ?? "",
    rutas: p.getAll("ruta"),
    zona: p.get("zona") ?? "",
    dificultadMax: max >= 1 && max <= 10 ? max : 10,
    soloOido: p.get("oido") === "1",
    soloPartitura: p.get("partitura") === "1",
    soloListas: p.get("listas") === "1",
    estado: esEstadoCancion(estado) ? estado : "",
    orden: orden === "titulo" || orden === "zona" ? orden : "dificultad",
  };
}

/**
 * Convierte los filtros en parámetros de URL; omite los que tienen el valor por defecto.
 * Es la inversa de `filtrosDesdeURL`.
 */
export function filtrosAURL(f: Filtros): URLSearchParams {
  const p = new URLSearchParams();
  if (f.texto.trim()) p.set("q", f.texto.trim());
  f.rutas.forEach((r) => p.append("ruta", r));
  if (f.zona) p.set("zona", f.zona);
  if (f.dificultadMax < 10) p.set("max", String(f.dificultadMax));
  if (f.soloOido) p.set("oido", "1");
  if (f.soloPartitura) p.set("partitura", "1");
  if (f.soloListas) p.set("listas", "1");
  if (f.estado) p.set("estado", f.estado);
  if (f.orden !== "dificultad") p.set("orden", f.orden);
  return p;
}
