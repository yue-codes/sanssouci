import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { NodoTalento } from "@/lib/arbol";
import type { CategoriaLogro } from "@/lib/contenido";
import { estadoLogro, type EstadoLogro } from "@/lib/progreso";
import { ESTILO_ESTADO, ICONO_ESTADO } from "./estilos";
import DetalleTalento from "./DetalleTalento";
import LienzoArbol from "./LienzoArbol";
import ListaRama from "./ListaRama";
import PestanasRamas from "./PestanasRamas";

interface Props {
  /** Todos los logros, ya colocados (ver `construirNodosArbol`). */
  nodos: NodoTalento[];
  /** Categorías en el orden de las columnas. */
  ramas: CategoriaLogro[];
  /** Ids de los logros que el jugador ya tiene. */
  obtenidos: string[];
}

/**
 * @component ArbolTalentos (isla: `client:load`)
 * Árbol de habilidades estilo RPG, dibujado a partir de logros.json: cada
 * `requiere` es una línea entre dos nodos.
 *
 * Tiene dos vistas del mismo estado:
 *  - Escritorio (`lg` en adelante): lienzo con todas las ramas + panel lateral.
 *  - Celular: pestañas por rama + lista vertical con el talento desplegado.
 * Se muestra una u otra con CSS (`hidden lg:grid`); la oculta queda fuera del
 * árbol de accesibilidad, así que no hay botones duplicados para lectores de pantalla.
 *
 * Es el único componente con estado; las piezas hijas solo reciben datos y
 * avisan con callbacks (`onElegir`, `onAlternar`). Por ahora se puede marcar
 * logros (demo); en la fase 4, `obtenidos` vendrá de Supabase.
 */
export default function ArbolTalentos({ nodos, ramas, obtenidos: iniciales }: Props) {
  const porId = new Map(nodos.map((n) => [n.id, n]));

  const obtenidos = useSignal<Set<string>>(new Set(iniciales));
  const estados = useComputed<ReadonlyMap<string, EstadoLogro>>(
    () => new Map(nodos.map((n) => [n.id, estadoLogro(n.id, n.requiere, obtenidos.value)])),
  );
  const disponibles = useComputed(() => nodos.filter((n) => estados.value.get(n.id) === "disponible"));

  const inicial = disponibles.value[0] ?? nodos[0];
  const seleccion = useSignal(inicial.id);
  const ramaActiva = useSignal<CategoriaLogro>(inicial.categoria);

  /** Selecciona un talento y muestra su rama (en el celular). */
  function elegir(id: string) {
    seleccion.value = id;
    ramaActiva.value = porId.get(id)!.categoria;
  }

  /** Al cambiar de pestaña, abre el primer talento disponible de esa rama (o el primero). */
  function cambiarRama(rama: CategoriaLogro) {
    const deRama = nodosDeRama(rama);
    elegir((deRama.find((n) => estados.value.get(n.id) === "disponible") ?? deRama[0]).id);
  }

  function alternar(id: string) {
    const s = new Set(obtenidos.value);
    s.has(id) ? s.delete(id) : s.add(id);
    obtenidos.value = s; // un Set nuevo es lo que avisa a los signals del cambio
  }

  const nodosDeRama = (rama: CategoriaLogro) => nodos.filter((n) => n.categoria === rama).sort((a, b) => a.fila - b.fila);
  const progresoRama = (rama: CategoriaLogro) => {
    const deRama = nodosDeRama(rama);
    return `${deRama.filter((n) => obtenidos.value.has(n.id)).length}/${deRama.length}`;
  };

  // Permite enlazar a un talento con /arbol#logro-id (lo usan los chips del mapa).
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (porId.has(id)) elegir(id);
  }, []);

  const elegido = porId.get(seleccion.value)!;
  const detalle = (compacto: boolean) => (
    <DetalleTalento nodo={elegido} estados={estados.value} porId={porId} onElegir={elegir} onAlternar={alternar} compacto={compacto} />
  );

  return (
    <div class="grid gap-6">
      {/* Resumen y leyenda (comunes a las dos vistas) */}
      <div class="tarjeta flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-sm">
        <p>
          <span class="font-pixel text-2xl text-acento">{obtenidos.value.size}</span>
          <span class="text-tenue"> / {nodos.length} talentos</span>
        </p>
        <p>
          <span class="font-pixel text-2xl text-resalte">{disponibles.value.length}</span>
          <span class="text-tenue"> disponibles ahora</span>
        </p>
        <ul class="flex gap-4 text-xs text-tenue sm:ml-auto">
          {(Object.keys(ESTILO_ESTADO) as EstadoLogro[]).map((e) => {
            const Icono = ICONO_ESTADO[e];
            return (
              <li key={e} class="flex items-center gap-1.5">
                <Icono size={13} class={ESTILO_ESTADO[e].icono} aria-hidden="true" />
                {ESTILO_ESTADO[e].texto}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Escritorio */}
      <div class="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div class="tarjeta overflow-hidden">
          <LienzoArbol nodos={nodos} ramas={ramas} estados={estados.value} seleccion={seleccion.value} onElegir={elegir} />
        </div>
        <aside class="tarjeta sticky top-20 p-5" aria-live="polite">
          {detalle(false)}
        </aside>
      </div>

      {/* Celular y tableta */}
      <div class="lg:hidden">
        <PestanasRamas ramas={ramas} activa={ramaActiva.value} onCambiar={cambiarRama} progreso={progresoRama} />
        <ListaRama
          nodos={nodosDeRama(ramaActiva.value)}
          estados={estados.value}
          seleccion={seleccion.value}
          onElegir={elegir}
          detalle={detalle(true)}
        />
      </div>
    </div>
  );
}
