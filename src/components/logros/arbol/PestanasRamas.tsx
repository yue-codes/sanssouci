import type { CategoriaLogro } from "@/lib/contenido";
import { ICONO_CATEGORIA, NOMBRE_CATEGORIA } from "../categorias";

interface Props {
  /** Ramas en orden. */
  ramas: readonly CategoriaLogro[];
  /** Rama visible. */
  activa: CategoriaLogro;
  /** Se llama al cambiar de rama. */
  onCambiar: (rama: CategoriaLogro) => void;
  /** Texto de progreso de cada rama, p. ej. "2/13". */
  progreso: (rama: CategoriaLogro) => string;
}

/** Id del panel que controlan las pestañas (lo pone ListaRama). */
export const ID_PANEL_RAMA = "panel-rama";

/**
 * @component PestanasRamas
 * Pestañas para elegir rama en el celular. Sigue el patrón de pestañas de
 * WAI-ARIA: `role="tablist"`, flechas ← → para moverse, Inicio/Fin para ir a los
 * extremos, y solo la pestaña activa entra en el orden de tabulación.
 */
export default function PestanasRamas({ ramas, activa, onCambiar, progreso }: Props) {
  function teclado(e: KeyboardEvent) {
    const i = ramas.indexOf(activa);
    const destino =
      e.key === "ArrowRight" ? (i + 1) % ramas.length
      : e.key === "ArrowLeft" ? (i - 1 + ramas.length) % ramas.length
      : e.key === "Home" ? 0
      : e.key === "End" ? ramas.length - 1
      : -1;
    if (destino < 0) return;
    e.preventDefault();
    onCambiar(ramas[destino]);
    document.getElementById(`pestana-${ramas[destino]}`)?.focus();
  }

  return (
    <div role="tablist" aria-label="Ramas del árbol" onKeyDown={teclado} class="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
      {ramas.map((r) => {
        const Icono = ICONO_CATEGORIA[r];
        const sel = r === activa;
        return (
          <button
            key={r}
            id={`pestana-${r}`}
            type="button"
            role="tab"
            aria-selected={sel}
            aria-controls={ID_PANEL_RAMA}
            tabIndex={sel ? 0 : -1}
            onClick={() => onCambiar(r)}
            class="flex shrink-0 items-center gap-2 rounded-xl border border-borde bg-superficie px-3 py-2 text-sm text-tenue transition aria-selected:border-acento aria-selected:bg-acento-suave aria-selected:text-texto"
          >
            <Icono size={15} aria-hidden="true" />
            <span class="font-pixel uppercase tracking-wider">{NOMBRE_CATEGORIA[r]}</span>
            <span class="text-xs tabular-nums">{progreso(r)}</span>
          </button>
        );
      })}
    </div>
  );
}
