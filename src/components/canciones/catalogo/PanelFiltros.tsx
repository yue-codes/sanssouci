import { Search, Sparkles, X } from "lucide-preact";
import type { Filtros, Orden } from "@/lib/catalogo";

/** Una opción de ruta para los botones de filtro. */
export interface OpcionRuta {
  id: string;
  nombre: string;
  color: string;
}

/** Una opción de zona para el selector. */
export interface OpcionZona {
  id: string;
  orden: number;
  nombre: string;
}

interface Props {
  /** Filtros actuales. */
  filtros: Filtros;
  rutas: OpcionRuta[];
  zonas: OpcionZona[];
  /** Cuántos filtros hay activos (para el botón de limpiar). */
  activos: number;
  /** Se llama con los campos que cambian. */
  onCambiar: (cambio: Partial<Filtros>) => void;
  /** Vuelve a los filtros vacíos. */
  onLimpiar: () => void;
}

const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: "dificultad", texto: "Dificultad" },
  { valor: "zona", texto: "Zona" },
  { valor: "titulo", texto: "Título (A–Z)" },
];

/** Clases compartidas por los campos del formulario. */
const CAMPO = "w-full rounded-[3px] border border-borde bg-fondo px-3 py-2 text-sm";
const ETIQUETA = "mb-2 block font-mono text-[0.625rem] tracking-[0.08em] text-tenue uppercase";

/**
 * @component PanelFiltros
 * Formulario de filtros del catálogo. No guarda estado: muestra `filtros` y
 * avisa de cada cambio con `onCambiar` (lo gestiona `CatalogoCanciones`).
 * Cada control tiene su etiqueta visible o `sr-only`. Las rutas y «¿Qué puedo
 * tocar ya?» son botones con `aria-pressed` (interruptores: se encienden y apagan).
 */
export default function PanelFiltros({ filtros: f, rutas, zonas, activos, onCambiar, onLimpiar }: Props) {
  const alternarRuta = (id: string) =>
    onCambiar({ rutas: f.rutas.includes(id) ? f.rutas.filter((r) => r !== id) : [...f.rutas, id] });

  return (
    <form class="grid gap-6" role="search" onSubmit={(e) => e.preventDefault()}>
      <button
        type="button"
        aria-pressed={f.soloListas}
        onClick={() => onCambiar({ soloListas: !f.soloListas })}
        class="flex items-center gap-2.5 rounded-[3px] border border-resalte/40 px-3 py-2.5 text-left text-sm transition-colors hover:border-resalte aria-pressed:border-resalte aria-pressed:bg-resalte aria-pressed:text-fondo"
      >
        <Sparkles size={16} class="shrink-0" aria-hidden="true" />
        <span>
          <span class="block font-medium">¿Qué puedo tocar ya?</span>
          <span class="block text-xs opacity-75">Solo las que no piden talentos que te falten</span>
        </span>
      </button>

      <div>
        <label for="buscar" class="sr-only">Buscar por título, obra o compositor</label>
        <div class="relative">
          <Search size={16} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-tenue" aria-hidden="true" />
          <input
            id="buscar"
            type="search"
            value={f.texto}
            onInput={(e) => onCambiar({ texto: e.currentTarget.value })}
            placeholder="Título, obra o compositor…"
            class={`${CAMPO} pl-9`}
          />
        </div>
      </div>

      <fieldset>
        <legend class={ETIQUETA}>Rutas</legend>
        <div class="flex flex-wrap gap-1.5">
          {rutas.map((r) => {
            const activa = f.rutas.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={activa}
                onClick={() => alternarRuta(r.id)}
                class="inline-flex items-center gap-1.5 rounded-[3px] border border-borde px-2.5 py-1 text-xs text-tenue transition-colors hover:text-texto aria-pressed:text-texto"
                style={activa ? { borderColor: r.color, background: `color-mix(in oklab, ${r.color} 18%, transparent)` } : undefined}
              >
                <span class="size-2 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                {r.nombre}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label for="zona" class={ETIQUETA}>Zona</label>
        <select id="zona" value={f.zona} onChange={(e) => onCambiar({ zona: e.currentTarget.value })} class={CAMPO}>
          <option value="">Todas las zonas</option>
          {zonas.map((z) => <option key={z.id} value={z.id}>Zona {z.orden} · {z.nombre}</option>)}
        </select>
      </div>

      <div>
        <label for="dificultad" class={ETIQUETA}>Dificultad máxima: {f.dificultadMax}</label>
        <input
          id="dificultad"
          type="range"
          min={1}
          max={10}
          value={f.dificultadMax}
          onInput={(e) => onCambiar({ dificultadMax: Number(e.currentTarget.value) })}
          class="w-full accent-acento"
        />
        <div class="flex justify-between font-mono text-[0.625rem] text-tenue" aria-hidden="true"><span>1</span><span>10</span></div>
      </div>

      <fieldset class="grid gap-2 text-sm">
        <legend class={ETIQUETA}>Tipo</legend>
        <label class="flex items-center gap-2">
          <input type="checkbox" checked={f.soloOido} onChange={(e) => onCambiar({ soloOido: e.currentTarget.checked })} class="size-4 accent-acento" />
          Solo retos de oído
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" checked={f.soloPartitura} onChange={(e) => onCambiar({ soloPartitura: e.currentTarget.checked })} class="size-4 accent-acento" />
          Solo con partitura
        </label>
      </fieldset>

      <div>
        <label for="orden" class={ETIQUETA}>Ordenar por</label>
        <select id="orden" value={f.orden} onChange={(e) => onCambiar({ orden: e.currentTarget.value as Orden })} class={CAMPO}>
          {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
        </select>
      </div>

      {activos > 0 && (
        <button type="button" onClick={onLimpiar} class="inline-flex items-center justify-center gap-1.5 rounded-[3px] border border-borde px-3 py-2 text-sm hover:bg-superficie-2">
          <X size={14} aria-hidden="true" /> Quitar filtros ({activos})
        </button>
      )}
    </form>
  );
}
