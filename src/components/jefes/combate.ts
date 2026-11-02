/**
 * @file Estado del combate contra un jefe, compartido entre dos islas de la misma
 * página: `VidaJefe` (la barra de vida, arriba) y `CombateJefe` (la lista de golpes,
 * abajo).
 *
 * Cada isla de Astro se monta por separado, pero si importan el mismo módulo
 * comparten sus variables: un `signal` creado aquí, fuera de cualquier componente,
 * es el mismo para las dos. Cuando una lo cambia, la otra se vuelve a pintar.
 * (Dentro de un componente se usa `useSignal`; aquí, a nivel de módulo, `signal`.)
 *
 * Es demo hasta la fase 4: no se guarda. Después, la victoria se registrará en
 * Supabase con el enlace al video.
 */
import { signal } from "@preact/signals";

/** Índices de las condiciones de victoria ya cumplidas (la última es la grabación). */
export const golpes = signal<ReadonlySet<number>>(new Set());

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
