/**
 * @file Disposición del árbol de habilidades.
 *
 * Coloca los logros en una cuadrícula para dibujar el árbol de habilidades.
 * - Columna: la rama (categoría) del logro.
 * - Fila: su "profundidad", es decir, cuántos pasos de requisitos hay antes de él.
 *   Así lo que se consigue primero queda arriba y lo avanzado abajo.
 * Si dos logros de la misma rama caen en la misma fila, el segundo baja una.
 */
import type { CategoriaLogro, Contenido } from "@/lib/contenido";

/** Lo mínimo que necesita un nodo para colocarse en el árbol. */
export interface NodoArbol {
  id: string;
  categoria: string;
  requiere: string[];
}

/**
 * Asigna a cada nodo una columna (`col`) y una fila (`fila`) de la cuadrícula.
 *
 * @param nodos Logros (o cualquier objeto con `id`, `categoria` y `requiere`).
 * @param ramas Categorías en el orden de las columnas; los nodos de otras categorías se omiten.
 * @returns Los mismos nodos con `col` y `fila` añadidos, agrupados por rama.
 */
export function posicionarArbol<T extends NodoArbol>(nodos: T[], ramas: readonly string[]) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const memo = new Map<string, number>();
  const profundidad = (id: string): number => {
    const guardada = memo.get(id);
    if (guardada !== undefined) return guardada;
    const req = porId.get(id)?.requiere ?? [];
    const valor = req.length ? 1 + Math.max(...req.map(profundidad)) : 0;
    memo.set(id, valor);
    return valor;
  };

  return ramas.flatMap((rama, col) => {
    let ultimaFila = -1;
    return nodos
      .filter((n) => n.categoria === rama)
      .sort((a, b) => profundidad(a.id) - profundidad(b.id))
      .map((n) => {
        const fila = Math.max(profundidad(n.id), ultimaFila + 1);
        ultimaFila = fila;
        return { ...n, col, fila };
      });
  });
}

/**
 * Datos planos de un logro listos para la isla del árbol: solo lo que se muestra,
 * porque todo lo que recibe una isla se escribe en el HTML de la página.
 */
export interface NodoTalento {
  id: string;
  nombre: string;
  categoria: CategoriaLogro;
  descripcion: string;
  criterio: string;
  /** Ids de los logros previos. */
  requiere: string[];
  /** Zona sugerida, ya en texto («Zona 2»). */
  zona: string;
  /** Columna de la cuadrícula (índice de la rama). */
  col: number;
  /** Fila de la cuadrícula (profundidad en el árbol). */
  fila: number;
}

/**
 * Convierte los logros del contenido en nodos del árbol, ya colocados.
 *
 * @param c Contenido cargado con `cargarContenido()`.
 * @param ramas Categorías en el orden de las columnas.
 */
export function construirNodosArbol(c: Contenido, ramas: readonly CategoriaLogro[]): NodoTalento[] {
  const planos = c.logros.map((l) => ({
    id: l.id,
    nombre: l.data.nombre,
    categoria: l.data.categoria,
    descripcion: l.data.descripcion,
    criterio: l.data.criterio,
    requiere: l.data.requiere.map((r) => r.id),
    zona: `Zona ${c.nivelPorId.get(l.data.nivelSugerido.id)!.data.orden}`,
  }));
  return posicionarArbol(planos, ramas);
}
