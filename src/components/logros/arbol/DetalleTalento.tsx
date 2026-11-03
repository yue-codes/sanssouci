import { ChevronDown, KeyRound, LogIn, Sparkles, Target, Undo2, Lock } from "lucide-preact";
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
  /** Se llama al pulsar el botón de conseguir/quitar. */
  onAlternar: (id: string) => void;
  /** ¿Hay sesión? Sin ella, en vez de conseguir se invita a entrar. */
  sesion: boolean;
  /** ¿Se está guardando este talento? Desactiva el botón. */
  ocupado: boolean;
  /** Mensaje del servidor si no se pudo guardar. */
  error?: string;
  /**
   * Cómo se coloca:
   * - `barra`: horizontal, fija abajo del árbol en escritorio (con botón para minimizar).
   * - `lista`: vertical y sin cabecera, desplegada bajo el nodo en la lista del celular.
   */
  disposicion: "barra" | "lista";
  /** Solo en `barra`: si está desplegada (si no, solo se ve la cabecera). */
  abierta?: boolean;
  /** Solo en `barra`: se llama al pulsar minimizar/desplegar. */
  onAbrir?: (abierta: boolean) => void;
}

/** Sello de estado de la ficha. */
const SELLO: Record<EstadoLogro, string> = {
  conseguido: "bg-exito text-fondo",
  disponible: "bg-resalte text-fondo",
  bloqueado: "bg-superficie-2 text-tenue",
};

/** Id del cuerpo de la barra (lo controla el botón de minimizar). */
const ID_CUERPO = "ficha-talento-cuerpo";

/**
 * @component DetalleTalento
 * Ficha de un talento, como la descripción de una habilidad en un RPG: la
 * misión para conseguirlo, de qué jefe es llave, qué requiere y qué desbloquea.
 * Si está bloqueado, dice cuántos requisitos faltan.
 *
 * En escritorio es una barra horizontal fija abajo (así el árbol usa todo el
 * ancho); en el celular, una ficha vertical bajo el nodo. Las dos usan las
 * mismas piezas (`Mision`, `Relacionados`, `Accion`), solo cambia la colocación.
 */
export default function DetalleTalento(props: Props) {
  const { nodo, estados, porId, onElegir, onAlternar, sesion, ocupado, error, disposicion, abierta = true, onAbrir } = props;
  const estado = estados.get(nodo.id)!;
  const desbloquea = [...porId.values()].filter((n) => n.requiere.includes(nodo.id)).map((n) => n.id);
  const faltan = nodo.requiere.filter((id) => estados.get(id) !== "conseguido").length;

  const llave = nodo.llaveDe.length > 0 && (
    <p class="flex items-center gap-2 text-sm text-peligro">
      <KeyRound size={14} aria-hidden="true" /> Llave de {nodo.llaveDe.join(" y ")}
    </p>
  );
  const requiere = (
    <Relacionados
      titulo={estado === "bloqueado" ? `Requiere · te falta${faltan > 1 ? "n" : ""} ${faltan}` : "Requiere"}
      ids={nodo.requiere}
      vacio="Nada: puedes ir por él desde ya."
      estados={estados}
      porId={porId}
      onElegir={onElegir}
    />
  );
  const abre = <Relacionados titulo="Desbloquea" ids={desbloquea} vacio="Es una hoja del árbol." estados={estados} porId={porId} onElegir={onElegir} />;
  const accion = (
    <div class="grid gap-2">
      <Accion id={nodo.id} estado={estado} sesion={sesion} ocupado={ocupado} onClick={() => onAlternar(nodo.id)} />
      {error && (
        <p role="alert" class="text-sm text-peligro">
          {error}
        </p>
      )}
    </div>
  );

  if (disposicion === "lista") {
    return (
      <div class="grid gap-5">
        {llave}
        <p class="text-sm leading-relaxed text-tenue">{nodo.descripcion}</p>
        <Mision criterio={nodo.criterio} />
        {requiere}
        {abre}
        {accion}
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera: siempre visible, también minimizada */}
      <div class="flex items-center gap-4">
        <Hexagono categoria={nodo.categoria} estado={estado} tamano={abierta ? 52 : 36} llave={nodo.llaveDe.length > 0} />
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-x-3 gap-y-1 font-pixel text-xs tracking-wider text-tenue uppercase">
            {NOMBRE_CATEGORIA[nodo.categoria]} · {nodo.zona}
            <span class={`rounded-[2px] px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold tracking-normal ${SELLO[estado]}`}>
              {ESTILO_ESTADO[estado].texto}
            </span>
          </p>
          <h2 class={`leading-tight ${abierta ? "mt-1 text-3xl" : "text-xl"}`}>{nodo.nombre}</h2>
        </div>
        {!abierta && <div class="w-64 shrink-0">{accion}</div>}
        <button
          type="button"
          onClick={() => onAbrir?.(!abierta)}
          aria-expanded={abierta}
          aria-controls={ID_CUERPO}
          class="grid size-9 shrink-0 place-items-center rounded-[3px] border border-borde text-tenue transition-colors hover:border-borde-fuerte hover:text-texto"
        >
          <ChevronDown size={18} class={`transition-transform duration-300 ${abierta ? "" : "rotate-180"}`} aria-hidden="true" />
          <span class="sr-only">{abierta ? "Minimizar la ficha" : "Desplegar la ficha"}</span>
        </button>
      </div>

      {/* Cuerpo: en columnas para aprovechar el ancho */}
      <div id={ID_CUERPO} hidden={!abierta} class="mt-4 grid gap-x-8 gap-y-4 border-t border-borde pt-4 xl:grid-cols-[1.2fr_1.3fr_1fr_1fr_15rem] lg:grid-cols-3">
        <div class="grid content-start gap-2">
          {llave}
          <p class="text-sm leading-relaxed text-tenue">{nodo.descripcion}</p>
        </div>
        <Mision criterio={nodo.criterio} />
        <div>{requiere}</div>
        <div>{abre}</div>
        <div class="content-start lg:col-span-3 xl:col-span-1">{accion}</div>
      </div>
    </div>
  );
}

/** La misión para conseguir el talento (su criterio). */
function Mision({ criterio }: { criterio: string }) {
  return (
    <div class="self-start rounded-[3px] border border-borde bg-superficie-2/60 p-3">
      <h3 class="flex items-center gap-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-acento uppercase">
        <Target size={12} aria-hidden="true" /> Misión
      </h3>
      <p class="mt-1.5 text-sm leading-relaxed">{criterio}</p>
    </div>
  );
}

/**
 * Botón para conseguir o quitar el talento, aviso de que sigue bloqueado o,
 * sin sesión, enlace para entrar y volver a este talento.
 */
function Accion(props: { id: string; estado: EstadoLogro; sesion: boolean; ocupado: boolean; onClick: () => void }) {
  const { id, estado, sesion, ocupado, onClick } = props;
  if (!sesion && estado !== "bloqueado") {
    return (
      <a href={`/entrar?siguiente=${encodeURIComponent(`/arbol#${id}`)}`} class="boton w-full justify-center">
        <LogIn size={15} aria-hidden="true" /> Entra para conseguirlo
      </a>
    );
  }
  if (estado === "conseguido") {
    return (
      <button type="button" onClick={onClick} disabled={ocupado} class="boton-borde w-full justify-center disabled:opacity-60">
        <Undo2 size={15} aria-hidden="true" /> {ocupado ? "Quitando…" : "Quitar"}
      </button>
    );
  }
  if (estado === "disponible") {
    return (
      <button type="button" onClick={onClick} disabled={ocupado} class="boton w-full justify-center disabled:opacity-60">
        <Sparkles size={15} aria-hidden="true" /> {ocupado ? "Guardando…" : "Conseguir"}
      </button>
    );
  }
  return (
    <p class="flex items-center justify-center gap-2 rounded-[3px] border border-dashed border-borde-fuerte py-2.5 text-sm text-tenue">
      <Lock size={14} aria-hidden="true" /> Aún bloqueado
    </p>
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
    <div>
      <h3 class="font-mono text-[0.625rem] tracking-[0.08em] text-tenue uppercase">{titulo}</h3>
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
                  <Icono size={14} class={`shrink-0 ${ESTILO_ESTADO[estado].icono}`} aria-hidden="true" />
                  <span>{n.nombre}</span>
                  <span class="ml-auto text-xs text-tenue">{NOMBRE_CATEGORIA[n.categoria]}</span>
                  <span class="sr-only">({ESTILO_ESTADO[estado].texto})</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
