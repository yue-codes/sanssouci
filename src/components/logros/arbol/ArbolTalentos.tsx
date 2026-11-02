import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { ancestrosDe, rangoTalentos, type NodoTalento } from "@/lib/arbol";
import type { CategoriaLogro } from "@/lib/contenido";
import { estadoLogro, type EstadoLogro } from "@/lib/progreso";
import { ESTILO_ESTADO, ICONO_ESTADO } from "./estilos";
import AvisoDesbloqueo, { type Celebracion } from "./AvisoDesbloqueo";
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
 *  - Escritorio (`lg` en adelante): el árbol entero (se encoge para caber) + ficha lateral.
 *  - Celular y tableta vertical: pestañas por rama + lista vertical con el talento desplegado.
 * Se muestra una u otra con CSS (`hidden lg:grid`); la oculta queda fuera del
 * árbol de accesibilidad, así que no hay botones duplicados para lectores de pantalla.
 *
 * Arriba, el marcador del jugador (rango, talentos, disponibles). Al conseguir un
 * talento hay celebración: estallido en el nodo, marca «nuevo» en lo que se abre
 * y un aviso. Por ahora se puede marcar (demo); en la fase 4, `obtenidos` vendrá de Supabase.
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
  const ruta = useComputed(() => ancestrosDe(seleccion.value, porId));
  const celebracion = useSignal<Celebracion | undefined>(undefined);
  const recienAbiertos = useSignal<ReadonlySet<string>>(new Set());

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

  /** Consigue o quita un talento (demo). Al conseguirlo, celebra y marca lo que se abre. */
  function alternar(id: string) {
    const antes = estados.value;
    const s = new Set(obtenidos.value);
    const conseguir = !s.has(id);
    conseguir ? s.add(id) : s.delete(id);
    obtenidos.value = s; // un Set nuevo es lo que avisa a los signals del cambio

    if (!conseguir) {
      celebracion.value = undefined;
      recienAbiertos.value = new Set();
      return;
    }
    const abiertos = nodos.filter((n) => antes.get(n.id) === "bloqueado" && estados.value.get(n.id) === "disponible");
    recienAbiertos.value = new Set(abiertos.map((n) => n.id));
    celebracion.value = { id, nombre: porId.get(id)!.nombre, abre: abiertos.map((n) => n.nombre), clave: Date.now() };
  }

  const nodosDeRama = (rama: CategoriaLogro) => nodos.filter((n) => n.categoria === rama).sort((a, b) => a.fila - b.fila);
  const progresoRama = (rama: CategoriaLogro) => {
    const deRama = nodosDeRama(rama);
    return `${deRama.filter((n) => obtenidos.value.has(n.id)).length}/${deRama.length}`;
  };

  // Permite enlazar a un talento con /arbol#logro-id (lo usan las misiones del mapa).
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (porId.has(id)) elegir(id);
  }, []);

  const elegido = porId.get(seleccion.value)!;
  const detalle = (compacto: boolean) => (
    <DetalleTalento nodo={elegido} estados={estados.value} porId={porId} onElegir={elegir} onAlternar={alternar} compacto={compacto} />
  );
  const total = obtenidos.value.size;
  const rango = rangoTalentos(total, nodos.length);
  const celebrado = celebracion.value && { id: celebracion.value.id, clave: celebracion.value.clave };

  return (
    // `minmax(0,1fr)`: sin él, la columna de la cuadrícula crece con su contenido más
    // ancho (las pestañas con scroll) y la página se desborda a lo ancho en el celular.
    <div class="grid grid-cols-[minmax(0,1fr)] gap-6">
      {/* Marcador del jugador */}
      <div class="flex flex-wrap items-stretch gap-px overflow-hidden rounded-md border border-borde bg-borde">
        <div class="flex-1 basis-40 bg-fondo/90 px-5 py-3">
          <p class="font-mono text-[0.625rem] tracking-[0.08em] text-tenue uppercase">Rango</p>
          <p class="font-pixel text-2xl text-acento-claro">{rango.nombre}</p>
          {rango.siguiente && (
            <p class="text-xs text-tenue">
              {rango.faltan} talento{rango.faltan === 1 ? "" : "s"} para {rango.siguiente}
            </p>
          )}
        </div>
        <div class="flex-1 basis-32 bg-fondo/90 px-5 py-3">
          <p class="font-mono text-[0.625rem] tracking-[0.08em] text-tenue uppercase">Talentos</p>
          <p class="font-pixel text-2xl">
            <span class="text-exito">{total}</span>
            <span class="text-base text-tenue"> / {nodos.length}</span>
          </p>
        </div>
        <div class="flex-1 basis-32 bg-fondo/90 px-5 py-3">
          <p class="font-mono text-[0.625rem] tracking-[0.08em] text-tenue uppercase">Disponibles ya</p>
          <p class="font-pixel text-2xl text-resalte">{disponibles.value.length}</p>
        </div>
        <ul class="flex flex-1 basis-64 flex-wrap items-center gap-x-4 gap-y-1 bg-fondo/90 px-5 py-3 text-xs text-tenue">
          {(Object.keys(ESTILO_ESTADO) as EstadoLogro[]).map((e) => {
            const Icono = ICONO_ESTADO[e];
            return (
              <li key={e} class="flex items-center gap-1.5">
                <Icono size={13} class={ESTILO_ESTADO[e].icono} aria-hidden="true" />
                {ESTILO_ESTADO[e].texto}
              </li>
            );
          })}
          <li class="flex items-center gap-1.5">
            <span class="h-0.5 w-4 rounded-full bg-acento-claro" aria-hidden="true" />
            Ruta del elegido
          </li>
        </ul>
      </div>

      {/* Escritorio */}
      <div class="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div class="overflow-hidden rounded-md border border-borde bg-fondo/60 py-2">
          <LienzoArbol
            nodos={nodos}
            ramas={ramas}
            estados={estados.value}
            seleccion={seleccion.value}
            ruta={ruta.value}
            recienAbiertos={recienAbiertos.value}
            celebrado={celebrado}
            onElegir={elegir}
          />
        </div>
        <aside class="sticky top-20 rounded-md border border-borde bg-superficie p-5" aria-live="polite">
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
          recienAbiertos={recienAbiertos.value}
          celebrado={celebrado}
          onElegir={elegir}
          detalle={detalle(true)}
        />
      </div>

      <AvisoDesbloqueo celebracion={celebracion.value} onCerrar={() => (celebracion.value = undefined)} />
    </div>
  );
}
