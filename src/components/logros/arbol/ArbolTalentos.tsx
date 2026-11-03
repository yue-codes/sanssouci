import { useComputed, useSignal } from "@preact/signals";
import { actions } from "astro:actions";
import { useEffect } from "preact/hooks";
import { KeyRound } from "lucide-preact";
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
  /** Ids de los logros que el jugador ya tiene (vacío sin sesión). */
  obtenidos: string[];
  /** ¿Hay sesión? Sin ella, la ficha invita a entrar en vez de conseguir. */
  sesion: boolean;
}

/**
 * @component ArbolTalentos (isla: `client:load`)
 * Árbol de habilidades estilo RPG, dibujado a partir de logros.json: cada
 * `requiere` es una línea entre dos nodos.
 *
 * Tiene dos vistas del mismo estado:
 *  - Escritorio (`lg` en adelante): el árbol entero a todo el ancho (se ajusta para caber) y
 *    la ficha como barra fija abajo, que se puede minimizar.
 *  - Celular y tableta vertical: pestañas por rama + lista vertical con el talento desplegado.
 * Se muestra una u otra con CSS (`hidden lg:block`); la oculta queda fuera del
 * árbol de accesibilidad, así que no hay botones duplicados para lectores de pantalla.
 *
 * Arriba, el marcador del jugador (rango, talentos, disponibles) y el filtro
 * «¿Qué puedo hacer ya?». Al pasar el ratón por un talento se ve su ruta. Al conseguir un
 * talento hay celebración: estallido en el nodo, marca «nuevo» en lo que se abre
 * y un aviso. Conseguir y quitar se guardan con las Actions `conseguirLogro` y
 * `quitarLogro` (el servidor vuelve a comprobar los requisitos). La pinta la Server
 * Island `ArbolConProgreso`, que trae tus logros.
 */
export default function ArbolTalentos({ nodos, ramas, obtenidos: iniciales, sesion }: Props) {
  const porId = new Map(nodos.map((n) => [n.id, n]));

  const obtenidos = useSignal<Set<string>>(new Set(iniciales));
  const estados = useComputed<ReadonlyMap<string, EstadoLogro>>(
    () => new Map(nodos.map((n) => [n.id, estadoLogro(n.id, n.requiere, obtenidos.value)])),
  );
  const disponibles = useComputed(() => nodos.filter((n) => estados.value.get(n.id) === "disponible"));

  const inicial = disponibles.value[0] ?? nodos[0];
  const seleccion = useSignal(inicial.id);
  const ramaActiva = useSignal<CategoriaLogro>(inicial.categoria);
  /** Talento bajo el ratón o el foco del teclado: sus líneas se resaltan sin cambiar la ficha. */
  const sobre = useSignal<string | undefined>(undefined);
  const foco = useComputed(() => sobre.value ?? seleccion.value);
  const ruta = useComputed(() => ancestrosDe(foco.value, porId));
  /** Filtro «¿Qué puedo hacer ya?»: deja encendido solo lo disponible y lo que lo abrió. */
  const soloDisponibles = useSignal(false);
  const visibles = useComputed(() =>
    soloDisponibles.value ? new Set(disponibles.value.flatMap((n) => [n.id, ...n.requiere])) : undefined,
  );
  /** La barra de la ficha (escritorio) desplegada o minimizada. */
  const fichaAbierta = useSignal(true);
  const celebracion = useSignal<Celebracion | undefined>(undefined);
  const recienAbiertos = useSignal<ReadonlySet<string>>(new Set());
  /** Talento que se está guardando (sus botones se desactivan mientras tanto). */
  const ocupado = useSignal<string | undefined>(undefined);
  /** Último error al guardar, con el talento al que pertenece. */
  const fallo = useSignal<{ id: string; mensaje: string } | undefined>(undefined);

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

  /**
   * Consigue o quita un talento y lo guarda. Se espera al servidor antes de cambiar
   * nada: si dice que no (falta un requisito, sin conexión…), el árbol no se mueve.
   * Al conseguirlo, celebra y marca lo que se abre.
   */
  async function alternar(id: string) {
    if (ocupado.value) return;
    const conseguir = !obtenidos.value.has(id);
    ocupado.value = id;
    fallo.value = undefined;
    const { error } = conseguir ? await actions.conseguirLogro({ logro: id }) : await actions.quitarLogro({ logro: id });
    ocupado.value = undefined;
    if (error) {
      fallo.value = { id, mensaje: error.message };
      return;
    }

    const antes = estados.value;
    const s = new Set(obtenidos.value);
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
  const detalle = (disposicion: "barra" | "lista") => (
    <DetalleTalento
      nodo={elegido}
      estados={estados.value}
      porId={porId}
      onElegir={elegir}
      onAlternar={alternar}
      sesion={sesion}
      ocupado={ocupado.value === elegido.id}
      error={fallo.value?.id === elegido.id ? fallo.value.mensaje : undefined}
      disposicion={disposicion}
      abierta={fichaAbierta.value}
      onAbrir={(v) => (fichaAbierta.value = v)}
    />
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
            Ruta de requisitos
          </li>
        </ul>
      </div>

      {/* Filtro */}
      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex rounded-[3px] border border-borde p-0.5 text-sm" role="group" aria-label="Qué talentos encender">
          {[
            { valor: false, texto: "Todo el árbol" },
            { valor: true, texto: "¿Qué puedo hacer ya?" },
          ].map((o) => (
            <button
              key={o.texto}
              type="button"
              aria-pressed={soloDisponibles.value === o.valor}
              onClick={() => (soloDisponibles.value = o.valor)}
              class="rounded-[2px] px-3 py-1.5 text-tenue transition-colors hover:text-texto aria-pressed:bg-acento-suave aria-pressed:text-texto"
            >
              {o.texto}
            </button>
          ))}
        </div>
        <p class="flex items-center gap-1.5 text-xs text-tenue">
          <span class="grid size-4 place-items-center rounded-full bg-peligro text-fondo" aria-hidden="true">
            <KeyRound size={9} strokeWidth={2.5} />
          </span>
          Llave de un jefe
        </p>
      </div>

      {/* Escritorio */}
      {/* Escritorio: el árbol a todo el ancho y la ficha como barra fija abajo (`sticky`):
          se queda pegada al borde inferior mientras recorres el árbol y se detiene al final de él. */}
      <div class="hidden lg:block">
        <div class="overflow-hidden rounded-md border border-borde bg-fondo/60 py-2">
          <LienzoArbol
            nodos={nodos}
            ramas={ramas}
            estados={estados.value}
            seleccion={seleccion.value}
            foco={foco.value}
            ruta={ruta.value}
            visibles={visibles.value}
            recienAbiertos={recienAbiertos.value}
            celebrado={celebrado}
            onElegir={elegir}
            onFoco={(id) => (sobre.value = id)}
          />
        </div>
        <aside
          aria-label="Ficha del talento"
          aria-live="polite"
          class="sticky bottom-3 z-30 mt-3 rounded-md border border-borde-fuerte bg-superficie/95 p-4 shadow-[0_-20px_50px_-20px_var(--fondo)] backdrop-blur-md"
        >
          {detalle("barra")}
        </aside>
      </div>

      {/* Celular y tableta */}
      <div class="lg:hidden">
        <PestanasRamas ramas={ramas} activa={ramaActiva.value} onCambiar={cambiarRama} progreso={progresoRama} />
        <ListaRama
          nodos={nodosDeRama(ramaActiva.value)}
          estados={estados.value}
          seleccion={seleccion.value}
          visibles={visibles.value}
          recienAbiertos={recienAbiertos.value}
          celebrado={celebrado}
          onElegir={elegir}
          detalle={detalle("lista")}
        />
      </div>

      <AvisoDesbloqueo celebracion={celebracion.value} onCerrar={() => (celebracion.value = undefined)} />
    </div>
  );
}
