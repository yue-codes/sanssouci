import { Sparkles, Target, Undo2, Lock } from "lucide-preact";
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
  /** Se llama al pulsar el botón de conseguir/quitar (demo, hasta la fase 4). */
  onAlternar: (id: string) => void;
  /** Sin cabecera (icono y nombre), para cuando el nodo ya se ve encima, como en la lista móvil. */
  compacto?: boolean;
}

/** Sello de estado de la ficha. */
const SELLO: Record<EstadoLogro, string> = {
  conseguido: "bg-exito text-fondo",
  disponible: "bg-resalte text-fondo",
  bloqueado: "bg-superficie-2 text-tenue",
};

/**
 * @component DetalleTalento
 * Ficha de un talento, como la descripción de una habilidad en un RPG: la
 * misión para conseguirlo, qué requiere y qué desbloquea. Si está bloqueado,
 * dice cuántos requisitos faltan.
 * En escritorio va en el panel lateral; en el celular, desplegada bajo el nodo.
 */
export default function DetalleTalento({ nodo, estados, porId, onElegir, onAlternar, compacto = false }: Props) {
  const estado = estados.get(nodo.id)!;
  const desbloquea = [...porId.values()].filter((n) => n.requiere.includes(nodo.id)).map((n) => n.id);
  const faltan = nodo.requiere.filter((id) => estados.get(id) !== "conseguido").length;

  return (
    <div>
      {!compacto && (
        <>
          <div class="flex items-center gap-4">
            <Hexagono categoria={nodo.categoria} estado={estado} tamano={60} />
            <div>
              <p class="font-pixel text-xs tracking-wider text-tenue uppercase">
                {NOMBRE_CATEGORIA[nodo.categoria]} · {nodo.zona}
              </p>
              <p class={`mt-1 inline-block rounded-[2px] px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold uppercase ${SELLO[estado]}`}>
                {ESTILO_ESTADO[estado].texto}
              </p>
            </div>
          </div>
          <h2 class="mt-4 text-3xl leading-tight">{nodo.nombre}</h2>
        </>
      )}
      <p class={`${compacto ? "" : "mt-2"} text-sm leading-relaxed text-tenue`}>{nodo.descripcion}</p>

      <div class="mt-5 rounded-[3px] border border-borde bg-superficie-2/60 p-3">
        <h3 class="flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-acento uppercase">
          <Target size={12} aria-hidden="true" /> Misión
        </h3>
        <p class="mt-1.5 text-sm leading-relaxed">{nodo.criterio}</p>
      </div>

      <Relacionados
        titulo={estado === "bloqueado" ? `Requiere · te falta${faltan > 1 ? "n" : ""} ${faltan}` : "Requiere"}
        ids={nodo.requiere}
        vacio="Nada: puedes ir por él desde ya."
        estados={estados}
        porId={porId}
        onElegir={onElegir}
      />
      <Relacionados titulo="Desbloquea" ids={desbloquea} vacio="Es una hoja del árbol." estados={estados} porId={porId} onElegir={onElegir} />

      {estado === "conseguido" ? (
        <button type="button" onClick={() => onAlternar(nodo.id)} class="boton-borde mt-6 w-full justify-center">
          <Undo2 size={15} aria-hidden="true" /> Quitar (demo)
        </button>
      ) : estado === "disponible" ? (
        <button type="button" onClick={() => onAlternar(nodo.id)} class="boton mt-6 w-full justify-center">
          <Sparkles size={15} aria-hidden="true" /> Desbloquear talento (demo)
        </button>
      ) : (
        <p class="mt-6 flex items-center justify-center gap-2 rounded-[3px] border border-dashed border-borde-fuerte py-2.5 text-sm text-tenue">
          <Lock size={14} aria-hidden="true" /> Aún bloqueado
        </p>
      )}
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
      <h3 class="mt-5 font-mono text-[0.625rem] tracking-[0.08em] text-tenue uppercase">{titulo}</h3>
      {ids.length === 0 ? (
        <p class="mt-1.5 text-sm text-tenue">{vacio}</p>
      ) : (
        <ul class="mt-1.5 grid gap-0.5">
          {ids.map((id) => {
            const estado = estados.get(id)!;
            const Icono = ICONO_ESTADO[estado];
            const n = porId.get(id)!;
            return (
              <li key={id}>
                <button type="button" onClick={() => onElegir(id)} class="flex w-full items-center gap-2 rounded-[3px] px-2 py-1.5 text-left text-sm hover:bg-superficie-2">
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
