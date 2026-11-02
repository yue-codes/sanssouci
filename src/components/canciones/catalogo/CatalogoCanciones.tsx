import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { SlidersHorizontal, SearchX } from "lucide-preact";
import {
  FILTROS_VACIOS, filtrarCanciones, filtrosActivos, filtrosAURL, filtrosDesdeURL,
  type Filtros,
} from "@/lib/catalogo";
import type { CancionResumen } from "@/lib/canciones";
import TarjetaCancion from "@/components/canciones/TarjetaCancion";
import PanelFiltros, { type OpcionRuta, type OpcionZona } from "./PanelFiltros";

interface Props {
  /** Todas las obras, ya resumidas (ver `resumirCancion`). */
  canciones: CancionResumen[];
  rutas: OpcionRuta[];
  zonas: OpcionZona[];
}

/**
 * @component CatalogoCanciones (isla: `client:load`)
 * Catálogo con filtros y orden. Es la raíz del estado: guarda los filtros en un
 * signal y deriva los resultados con `useComputed` (se recalculan solos al
 * cambiar un filtro).
 *
 * Los filtros se reflejan en la URL (`?ruta=ghibli&oido=1`) para poder enlazar
 * o compartir una búsqueda. Se leen de la URL tras montar (en el servidor no hay
 * URL del navegador) y se escriben con `history.replaceState`, que cambia la
 * dirección sin recargar ni llenar el historial de «atrás».
 */
export default function CatalogoCanciones({ canciones, rutas, zonas }: Props) {
  const filtros = useSignal<Filtros>(FILTROS_VACIOS);
  const resultados = useComputed(() => filtrarCanciones(canciones, filtros.value));
  const activos = useComputed(() => filtrosActivos(filtros.value));
  const panelAbierto = useSignal(false);

  useEffect(() => {
    filtros.value = filtrosDesdeURL(new URLSearchParams(location.search));
  }, []);

  function aplicar(nuevos: Filtros) {
    filtros.value = nuevos;
    const q = filtrosAURL(nuevos).toString();
    history.replaceState(null, "", q ? `?${q}` : location.pathname);
  }

  const total = resultados.value.length;

  return (
    <div class="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      {/* ---------- Filtros ---------- */}
      <aside class="lg:sticky lg:top-20">
        <button
          type="button"
          aria-expanded={panelAbierto.value}
          aria-controls="panel-filtros"
          onClick={() => (panelAbierto.value = !panelAbierto.value)}
          class="tarjeta flex w-full items-center justify-between px-4 py-3 text-sm font-semibold lg:hidden"
        >
          <span class="flex items-center gap-2"><SlidersHorizontal size={16} aria-hidden="true" /> Filtros</span>
          {activos.value > 0 && <span class="rounded-full bg-acento px-2 text-xs text-fondo">{activos.value}</span>}
        </button>
        <div id="panel-filtros" class={`tarjeta mt-2 p-5 lg:mt-0 lg:block ${panelAbierto.value ? "block" : "hidden"}`}>
          <PanelFiltros
            filtros={filtros.value}
            rutas={rutas}
            zonas={zonas}
            activos={activos.value}
            onCambiar={(cambio) => aplicar({ ...filtros.value, ...cambio })}
            onLimpiar={() => aplicar(FILTROS_VACIOS)}
          />
        </div>
      </aside>

      {/* ---------- Resultados ---------- */}
      <section aria-label="Resultados">
        <p class="mb-4 text-sm text-tenue" aria-live="polite">
          {total === canciones.length ? `${total} obras` : `${total} de ${canciones.length} obras`}
        </p>
        {total === 0 ? (
          <div class="tarjeta grid place-items-center gap-3 p-10 text-center">
            <SearchX size={32} class="text-tenue" aria-hidden="true" />
            <p>Ninguna obra cumple todos los filtros.</p>
            <button type="button" onClick={() => aplicar(FILTROS_VACIOS)} class="rounded-xl bg-acento px-4 py-2 text-sm font-semibold text-fondo">
              Quitar filtros
            </button>
          </div>
        ) : (
          <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resultados.value.map((s) => (
              <li key={s.id}><TarjetaCancion cancion={s} conZona /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
