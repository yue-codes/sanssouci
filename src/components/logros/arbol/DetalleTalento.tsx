import type { NodoTalento } from "@/lib/arbol";
import type { EstadoLogro } from "@/lib/progreso";
import { NOMBRE_CATEGORIA } from "../categorias";
import { ESTILO_ESTADO, ICONO_ESTADO } from "./estilos";
import Hexagono from "./Hexagono";

interface Props {
  /** Nodo a describir. */
  nodo: NodoTalento;
  /** Estado de cada nodo por id. */
  estados: ReadonlyMap<string, EstadoLogro>;
  /** Todos los nodos por id (para los nombres de requisitos y desbloqueos). */
  porId: ReadonlyMap<string, NodoTalento>;
  /** Se llama al elegir un requisito o un desbloqueo (para saltar a él). */
  onElegir: (id: string) => void;
  /** Se llama al pulsar el botón de marcar/quitar (demo, hasta la fase 4). */
  onAlternar: (id: string) => void;
  /** Sin cabecera (icono y nombre), para cuando el nodo ya se ve encima, como en la lista móvil. */
  compacto?: boolean;
}

/**
 * @component DetalleTalento
 * Ficha de un talento: cómo se consigue, qué requiere y qué desbloquea.
 * En escritorio va en el panel lateral; en el celular, desplegada bajo el nodo.
 */
export default function DetalleTalento({ nodo, estados, porId, onElegir, onAlternar, compacto = false }: Props) {
  const estado = estados.get(nodo.id)!;
  const desbloquea = [...porId.values()].filter((n) => n.requiere.includes(nodo.id)).map((n) => n.id);

  return (
    <div>
      {!compacto && (
        <>
          <div class="flex items-center gap-3">
            <Hexagono categoria={nodo.categoria} estado={estado} tamano={48} />
            <div>
              <p class="font-pixel text-xs uppercase tracking-wider text-tenue">{NOMBRE_CATEGORIA[nodo.categoria]} · {nodo.zona}</p>
              <p class={`text-xs font-semibold ${ESTILO_ESTADO[estado].icono}`}>{ESTILO_ESTADO[estado].texto}</p>
            </div>
          </div>
          <h2 class="mt-4 text-2xl font-semibold leading-tight">{nodo.nombre}</h2>
        </>
      )}
      <p class={`${compacto ? "" : "mt-2"} text-sm leading-relaxed text-tenue`}>{nodo.descripcion}</p>

      <h3 class="eyebrow mt-5">Cómo se consigue</h3>
      <p class="mt-1.5 rounded-xl bg-superficie-2/70 p-3 text-sm leading-relaxed">{nodo.criterio}</p>

      <Relacionados titulo="Requiere" ids={nodo.requiere} vacio="Nada: puedes ir por él desde ya." estados={estados} porId={porId} onElegir={onElegir} />
      <Relacionados titulo="Desbloquea" ids={desbloquea} vacio="Es una hoja del árbol." estados={estados} porId={porId} onElegir={onElegir} />

      <button
        type="button"
        disabled={estado === "bloqueado"}
        onClick={() => onAlternar(nodo.id)}
        class="mt-6 w-full rounded-xl bg-acento px-4 py-2.5 text-sm font-semibold text-fondo transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-superficie-2 disabled:text-tenue"
      >
        {estado === "conseguido" ? "Quitar (demo)" : estado === "disponible" ? "Marcar como conseguido (demo)" : "Aún bloqueado"}
      </button>
    </div>
  );
}

/** Lista de talentos relacionados (requisitos o desbloqueos); cada uno lleva a su ficha. */
function Relacionados(props: {
  titulo: string;
  ids: string[];
  vacio: string;
  estados: ReadonlyMap<string, EstadoLogro>;
  porId: ReadonlyMap<string, NodoTalento>;
  onElegir: (id: string) => void;
}) {
  const { titulo, ids, vacio, estados, porId, onElegir } = props;
  return (
    <>
      <h3 class="eyebrow mt-5">{titulo}</h3>
      {ids.length === 0 ? (
        <p class="mt-1.5 text-sm text-tenue">{vacio}</p>
      ) : (
        <ul class="mt-1.5 grid gap-1">
          {ids.map((id) => {
            const estado = estados.get(id)!;
            const Icono = ICONO_ESTADO[estado];
            const n = porId.get(id)!;
            return (
              <li key={id}>
                <button type="button" onClick={() => onElegir(id)} class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-superficie-2">
                  <Icono size={14} class={ESTILO_ESTADO[estado].icono} aria-hidden="true" />
                  <span>{n.nombre}</span>
                  <span class="ml-auto text-xs text-tenue">{NOMBRE_CATEGORIA[n.categoria]}</span>
                  <span class="sr-only">({ESTILO_ESTADO[estado].texto})</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
