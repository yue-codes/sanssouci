import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { Check, Lock, Sparkles } from "lucide-preact";
import { ICONO_CATEGORIA, NOMBRE_CATEGORIA, type CategoriaLogro } from "./categorias";
import { estadoLogro, type EstadoLogro } from "@/lib/progreso";

/** Datos planos de un logro, ya colocado en la cuadrícula (ver `posicionarArbol`). */
export interface NodoTalento {
  id: string;
  nombre: string;
  categoria: CategoriaLogro;
  descripcion: string;
  criterio: string;
  requiere: string[];
  zona: string;
  col: number;
  fila: number;
}

interface Props {
  /** Todos los logros, con `col` y `fila`. */
  nodos: NodoTalento[];
  /** Categorías en el orden de las columnas. */
  ramas: CategoriaLogro[];
  /** Ids de los logros que el jugador ya tiene. */
  obtenidos: string[];
}

// Medidas de la cuadrícula, en px. El dibujo es un lienzo de tamaño fijo con scroll horizontal.
const COL = 104;
const FILA = 92;
const NODO = 52;
const ARRIBA = 64; // espacio para los nombres de las ramas
const HEXAGONO = "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)";

const ESTILO: Record<EstadoLogro, { borde: string; relleno: string; icono: string; texto: string }> = {
  conseguido: { borde: "bg-acento", relleno: "bg-acento-suave", icono: "text-acento", texto: "Conseguido" },
  disponible: { borde: "bg-resalte", relleno: "bg-superficie", icono: "text-resalte", texto: "Disponible" },
  bloqueado: { borde: "bg-borde", relleno: "bg-superficie-2", icono: "text-tenue opacity-60", texto: "Bloqueado" },
};
const ICONO_ESTADO = { conseguido: Check, disponible: Sparkles, bloqueado: Lock };

/**
 * @component ArbolTalentos (isla: `client:load`)
 * Árbol de habilidades estilo RPG, dibujado a partir de logros.json:
 * cada `requiere` es una línea entre dos nodos.
 * En la muestra puedes marcar logros y ver cómo se desbloquean los siguientes;
 * en la fase 4, `obtenidos` vendrá de Supabase.
 */
export default function ArbolTalentos({ nodos, ramas, obtenidos: iniciales }: Props) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const obtenidos = useSignal<Set<string>>(new Set(iniciales));
  const estados = useComputed(
    () => new Map(nodos.map((n) => [n.id, estadoLogro(n.id, n.requiere, obtenidos.value)])),
  );
  const disponibles = useComputed(() => nodos.filter((n) => estados.value.get(n.id) === "disponible"));
  const seleccion = useSignal<string>(disponibles.value[0]?.id ?? nodos[0].id);

  // Permite enlazar a un nodo con /muestra/arbol#logro-id (lo usan los chips del sendero).
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (porId.has(id)) seleccion.value = id;
  }, []);

  const pos = (id: string) => {
    const n = porId.get(id)!;
    return { x: n.col * COL + COL / 2, y: ARRIBA + n.fila * FILA + NODO / 2 };
  };
  const ancho = ramas.length * COL;
  const alto = ARRIBA + (Math.max(...nodos.map((n) => n.fila)) + 1) * FILA;

  function alternar(id: string) {
    const s = new Set(obtenidos.value);
    s.has(id) ? s.delete(id) : s.add(id);
    obtenidos.value = s;
  }

  const sel = porId.get(seleccion.value)!;
  const estadoSel = estados.value.get(sel.id)!;
  const desbloquea = nodos.filter((n) => n.requiere.includes(sel.id));
  const IconoSel = ICONO_CATEGORIA[sel.categoria];

  return (
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {/* ---------- Lienzo del árbol ---------- */}
      <div class="tarjeta overflow-hidden">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-borde px-5 py-3 text-sm">
          <p>
            <span class="font-pixel text-2xl text-acento">{obtenidos.value.size}</span>
            <span class="text-tenue"> / {nodos.length} talentos</span>
          </p>
          <p>
            <span class="font-pixel text-2xl text-resalte">{disponibles.value.length}</span>
            <span class="text-tenue"> disponibles ahora</span>
          </p>
          <ul class="ml-auto flex gap-4 text-xs text-tenue">
            {(Object.keys(ESTILO) as EstadoLogro[]).map((e) => {
              const I = ICONO_ESTADO[e];
              return <li class="flex items-center gap-1.5"><I size={13} class={ESTILO[e].icono} aria-hidden="true" />{ESTILO[e].texto}</li>;
            })}
          </ul>
        </div>

        <div class="overflow-x-auto" tabIndex={0} aria-label="Árbol de habilidades (desplázate en horizontal)">
          <div class="relative mx-auto" style={{ width: `${ancho}px`, height: `${alto}px` }}>
            {/* Nombres de las ramas */}
            {ramas.map((r, i) => {
              const I = ICONO_CATEGORIA[r];
              return (
                <div class="absolute top-3 flex flex-col items-center gap-1 text-tenue" style={{ left: `${i * COL}px`, width: `${COL}px` }}>
                  <I size={16} aria-hidden="true" />
                  <span class="font-pixel text-[11px] uppercase tracking-wider">{NOMBRE_CATEGORIA[r]}</span>
                </div>
              );
            })}

            {/* Líneas de requisitos: con el color de acento si el requisito ya está conseguido */}
            <svg class="pointer-events-none absolute inset-0" width={ancho} height={alto} aria-hidden="true">
              {nodos.flatMap((n) =>
                n.requiere.map((r) => {
                  const a = pos(r);
                  const b = pos(n.id);
                  const ya = estados.value.get(r) === "conseguido";
                  const resaltada = n.id === sel.id || r === sel.id;
                  const medio = (a.y + b.y) / 2;
                  return (
                    <path
                      key={`${r}-${n.id}`}
                      d={`M${a.x} ${a.y + NODO / 2} C${a.x} ${medio} ${b.x} ${medio} ${b.x} ${b.y - NODO / 2}`}
                      fill="none"
                      stroke={resaltada ? "var(--resalte)" : ya ? "var(--acento)" : "var(--borde)"}
                      stroke-width={resaltada ? 3 : ya ? 2.5 : 1.5}
                      stroke-dasharray={ya || resaltada ? undefined : "4 5"}
                      opacity={resaltada || ya ? 1 : 0.8}
                    />
                  );
                }),
              )}
            </svg>

            {/* Nodos */}
            {nodos.map((n) => {
              const { x, y } = pos(n.id);
              const estado = estados.value.get(n.id)!;
              const e = ESTILO[estado];
              const I = ICONO_CATEGORIA[n.categoria];
              const elegido = n.id === sel.id;
              return (
                <div key={n.id} class="absolute flex flex-col items-center" style={{ left: `${x - COL / 2}px`, top: `${y - NODO / 2}px`, width: `${COL}px` }}>
                  <button
                    type="button"
                    onClick={() => (seleccion.value = n.id)}
                    aria-pressed={elegido}
                    aria-label={`${n.nombre}: ${e.texto.toLowerCase()}`}
                    class={`relative grid place-items-center rounded-xl transition hover:scale-110 ${elegido ? "scale-115" : ""}`}
                    style={{ width: `${NODO}px`, height: `${NODO}px` }}
                  >
                    {estado === "disponible" && (
                      <span class={`absolute inset-0 animate-latido ${e.borde}`} style={{ clipPath: HEXAGONO }} aria-hidden="true" />
                    )}
                    <span class={`absolute inset-0 ${elegido ? "bg-texto" : e.borde}`} style={{ clipPath: HEXAGONO }} aria-hidden="true" />
                    <span class={`absolute inset-[3px] ${e.relleno}`} style={{ clipPath: HEXAGONO }} aria-hidden="true" />
                    <I size={20} class={`relative ${e.icono}`} aria-hidden="true" />
                    {estado === "bloqueado" && (
                      <span class="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-superficie-2 text-tenue ring-1 ring-borde">
                        <Lock size={9} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                  <span class={`mt-1.5 line-clamp-2 px-1 text-center text-[10px] leading-tight ${elegido ? "font-semibold text-texto" : "text-tenue"}`} aria-hidden="true">
                    {n.nombre}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Panel del talento elegido ---------- */}
      <aside class="tarjeta p-5 lg:sticky lg:top-20" aria-live="polite">
        <div class="flex items-center gap-3">
          <span class={`relative grid size-12 place-items-center`}>
            <span class={`absolute inset-0 ${ESTILO[estadoSel].borde}`} style={{ clipPath: HEXAGONO }} />
            <span class={`absolute inset-[3px] ${ESTILO[estadoSel].relleno}`} style={{ clipPath: HEXAGONO }} />
            <IconoSel size={20} class={`relative ${ESTILO[estadoSel].icono}`} aria-hidden="true" />
          </span>
          <div>
            <p class="font-pixel text-xs uppercase tracking-wider text-tenue">{NOMBRE_CATEGORIA[sel.categoria]} · {sel.zona}</p>
            <p class={`text-xs font-semibold ${ESTILO[estadoSel].icono}`}>{ESTILO[estadoSel].texto}</p>
          </div>
        </div>
        <h2 class="mt-4 text-2xl font-semibold leading-tight">{sel.nombre}</h2>
        <p class="mt-2 text-sm leading-relaxed text-tenue">{sel.descripcion}</p>

        <h3 class="eyebrow mt-5">Cómo se consigue</h3>
        <p class="mt-1.5 rounded-xl bg-superficie-2/70 p-3 text-sm leading-relaxed">{sel.criterio}</p>

        {listaNodos("Requiere", sel.requiere, "Nada: puedes ir por él desde ya.")}
        {listaNodos("Desbloquea", desbloquea.map((n) => n.id), "Es una hoja del árbol.")}

        <button
          type="button"
          disabled={estadoSel === "bloqueado"}
          onClick={() => alternar(sel.id)}
          class="mt-6 w-full rounded-xl bg-acento px-4 py-2.5 text-sm font-semibold text-fondo transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-superficie-2 disabled:text-tenue"
        >
          {estadoSel === "conseguido" ? "Quitar (demo)" : estadoSel === "disponible" ? "Marcar como conseguido (demo)" : "Aún bloqueado"}
        </button>
      </aside>
    </div>
  );

  // Función auxiliar (no componente): se llama como función para que Preact no la trate
  // como un componente nuevo en cada render. Comparte `porId`, `estados` y `seleccion`.
  function listaNodos(titulo: string, ids: string[], vacio: string) {
    return (
      <>
        <h3 class="eyebrow mt-5">{titulo}</h3>
        {ids.length === 0 ? (
          <p class="mt-1.5 text-sm text-tenue">{vacio}</p>
        ) : (
          <ul class="mt-1.5 grid gap-1">
            {ids.map((id) => {
              const estado = estados.value.get(id)!;
              const I = ICONO_ESTADO[estado];
              return (
                <li key={id}>
                  <button type="button" onClick={() => (seleccion.value = id)} class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-superficie-2">
                    <I size={14} class={ESTILO[estado].icono} aria-hidden="true" />
                    <span>{porId.get(id)!.nombre}</span>
                    <span class="sr-only">({ESTILO[estado].texto})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }
}
