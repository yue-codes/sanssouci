/**
 * @file Estado del combate contra un jefe, compartido entre las islas de la misma
 * página: `VidaJefe` y `LlavesPuerta` (en la portada, que es estática) y
 * `CombateJefe` (en la arena, que pinta la Server Island `ArenaConProgreso`).
 *
 * Cada isla de Astro se monta por separado, pero si importan el mismo módulo
 * comparten sus variables: un `signal` creado aquí, fuera de cualquier componente,
 * es el mismo para todas. Cuando una lo cambia, las demás se vuelven a pintar.
 * (Dentro de un componente se usa `useSignal`; aquí, a nivel de módulo, `signal`.)
 *
 * Así la portada no necesita su propia petición al servidor: `CombateJefe` llega con
 * tu progreso y lo publica en `estadoJefe`.
 */
import { signal } from "@preact/signals";

/** Índices de las condiciones de victoria ya cumplidas (la última es la grabación). */
export const golpes = signal<ReadonlySet<number>>(new Set());

/** Lo que se sabe de TU combate contra este jefe. */
export interface EstadoJefe {
  /** Ya lo venciste (victoria guardada). */
  vencido: boolean;
  /** Ids de los logros que tienes (para saber qué llaves de su puerta son tuyas). */
  obtenidos: ReadonlySet<string>;
}

/** Estado del jefe para quien visita; `undefined` mientras llega del servidor. */
export const estadoJefe = signal<EstadoJefe | undefined>(undefined);

/**
 * Marca o desmarca una condición.
 *
 * @param i Índice de la condición.
 */
export function alternarGolpe(i: number) {
  const s = new Set(golpes.value);
  s.has(i) ? s.delete(i) : s.add(i);
  golpes.value = s; // un Set nuevo es lo que avisa del cambio
}

/** Vuelve a empezar el combate. */
export function reiniciarCombate() {
  golpes.value = new Set();
}
