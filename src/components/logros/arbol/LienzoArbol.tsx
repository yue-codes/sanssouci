import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { NodoTalento } from "@/lib/arbol";
import type { CategoriaLogro } from "@/lib/contenido";
import type { EstadoLogro } from "@/lib/progreso";
import { ICONO_CATEGORIA, NOMBRE_CATEGORIA } from "../categorias";
import { COLOR_ESTADO, ESTILO_ESTADO } from "./estilos";
import Estallido from "./Estallido";
import Hexagono from "./Hexagono";

interface Props {
  /** Todos los nodos, con `col` y `fila`. */
  nodos: NodoTalento[];
  /** Categorías en el orden de las columnas. */
  ramas: readonly CategoriaLogro[];
  /** Estado de cada nodo por id. */
  estados: ReadonlyMap<string, EstadoLogro>;
  /** Id del nodo seleccionado. */
  seleccion: string;
  /** Antecesores del seleccionado: «la ruta hasta aquí», que se resalta. */
  ruta: ReadonlySet<string>;
  /** Talentos que se acaban de abrir al conseguir otro (llevan la marca «nuevo»). */
  recienAbiertos: ReadonlySet<string>;
  /** Talento recién conseguido, para su estallido; `clave` cambia en cada celebración. */
  celebrado?: { id: string; clave: number };
  /** Se llama al elegir un nodo. */
  onElegir: (id: string) => void;
}

// Medidas de la cuadrícula, en px. El lienzo tiene tamaño fijo (con scroll si no cabe).
const COL = 96;
const FILA = 86;
const NODO = 50;
const ARRIBA = 96; // cabecera de las ramas
/** Lo más que se encoge el lienzo para caber; si aun así no cabe, hay scroll horizontal. */
const ESCALA_MIN = 0.65;

/** Tipos de línea entre dos talentos, de más a menos importante. */
type TipoLinea = "ruta" | "abre" | "conseguida" | "frontera" | "lejana";

/** Cómo se pinta cada tipo de línea. `flujo`: lleva una luz que corre (ver `animate-trazo`). */
const LINEA: Record<TipoLinea, { color: string; ancho: number; guiones?: string; opacidad: number; flujo?: boolean }> = {
  ruta: { color: "var(--acento-claro)", ancho: 2.5, opacidad: 1, flujo: true },
  abre: { color: "var(--resalte)", ancho: 2, guiones: "5 5", opacidad: 1 },
  conseguida: { color: COLOR_ESTADO.conseguido, ancho: 2.5, opacidad: 1, flujo: true },
  frontera: { color: COLOR_ESTADO.disponible, ancho: 1.5, guiones: "3 5", opacidad: 0.7 },
  lejana: { color: COLOR_ESTADO.bloqueado, ancho: 1, guiones: "2 6", opacidad: 0.6 },
};

/**
 * @component LienzoArbol
 * Vista de escritorio del árbol: un mapa de estrellas con todas las ramas en
 * columnas y los requisitos como líneas.
 *
 * - Cabecera de cada rama con su avance en segmentos (uno por talento).
 * - Líneas: lo conseguido en menta con luz que corre; la frontera (de lo
 *   conseguido a lo disponible) en lavanda; y, al elegir un talento, su ruta de
 *   requisitos en cian y lo que abre en lavanda.
 * - Al conseguir un talento: estallido de chispas y marca «nuevo» en lo que se abre.
 *
 * Se ve **entero** siempre que se pueda: el lienzo se dibuja a tamaño fijo y se
 * encoge (`transform: scale`) hasta caber en el ancho disponible, que se mide con
 * un `ResizeObserver` (avisa cada vez que cambia el tamaño de la caja).
 */
export default function LienzoArbol({ nodos, ramas, estados, seleccion, ruta, recienAbiertos, celebrado, onElegir }: Props) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const centro = (id: string) => {
    const n = porId.get(id)!;
    return { x: n.col * COL + COL / 2, y: ARRIBA + n.fila * FILA + NODO / 2 };
  };
  const ancho = ramas.length * COL;
  const alto = ARRIBA + (Math.max(...nodos.map((n) => n.fila)) + 1) * FILA;

  const caja = useRef<HTMLDivElement>(null);
  const escala = useSignal(1);
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const observador = new ResizeObserver(([e]) => {
      escala.value = Math.max(ESCALA_MIN, Math.min(1, e.contentRect.width / ancho));
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, [ancho]);
  const s = escala.value;

  const tipoLinea = (desde: string, hasta: string): TipoLinea => {
    if (hasta === seleccion || (ruta.has(hasta) && ruta.has(desde))) return "ruta";
    if (desde === seleccion) return "abre";
    const a = estados.get(desde);
    const b = estados.get(hasta);
    if (a === "conseguido" && b === "conseguido") return "conseguida";
    if (a === "conseguido" && b === "disponible") return "frontera";
    return "lejana";
  };
  const PRIORIDAD: TipoLinea[] = ["lejana", "frontera", "conseguida", "abre", "ruta"];
  const lineas = nodos
    .flatMap((n) => n.requiere.map((r) => ({ r, n: n.id, tipo: tipoLinea(r, n.id) })))
    // Lo importante se pinta al final, para que quede encima.
    .sort((a, b) => PRIORIDAD.indexOf(a.tipo) - PRIORIDAD.indexOf(b.tipo));

  return (
    <div ref={caja} class="overflow-x-auto" tabIndex={0} role="region" aria-label="Árbol de habilidades">
      {/* La caja exterior ocupa el tamaño ya encogido; la interior se dibuja a tamaño real y se escala. */}
      <div class="relative mx-auto" style={{ width: `${ancho * s}px`, height: `${alto * s}px` }}>
      <div
        class="absolute top-0 left-0 origin-top-left bg-[radial-gradient(circle,var(--borde)_1px,transparent_1.5px)] bg-[length:24px_24px]"
        style={{ width: `${ancho}px`, height: `${alto}px`, transform: `scale(${s})` }}
      >
        {/* Cabecera de cada rama, con su avance */}
        {ramas.map((r, i) => {
          const Icono = ICONO_CATEGORIA[r];
          const deRama = nodos.filter((n) => n.categoria === r).sort((a, b) => a.fila - b.fila);
          const hechos = deRama.filter((n) => estados.get(n.id) === "conseguido").length;
          return (
            <div key={r} class="absolute top-0 bottom-0" style={{ left: `${i * COL}px`, width: `${COL}px` }}>
              <span class="absolute top-20 bottom-4 left-1/2 border-l border-borde/20" aria-hidden="true" />
              <div class="relative flex flex-col items-center gap-1.5 px-2 pt-4 text-tenue">
                <Icono size={16} class={hechos > 0 ? "text-exito" : ""} aria-hidden="true" />
                <span class="font-pixel text-[11px] tracking-wider text-texto uppercase">{NOMBRE_CATEGORIA[r]}</span>
                <span class="flex w-full gap-0.5" aria-hidden="true">
                  {deRama.map((n) => (
                    <span key={n.id} class={`h-1 flex-1 rounded-[1px] ${ESTILO_ESTADO[estados.get(n.id)!].borde}`} />
                  ))}
                </span>
                <span class="font-mono text-[0.5625rem] tabular-nums">
                  {hechos}/{deRama.length}
                </span>
              </div>
            </div>
          );
        })}

        {/* Líneas de requisitos (curvas de Bézier de un talento al siguiente) */}
        <svg class="pointer-events-none absolute inset-0" width={ancho} height={alto} aria-hidden="true">
          {lineas.map(({ r, n, tipo }) => {
            const a = centro(r);
            const b = centro(n);
            const medio = (a.y + b.y) / 2;
            const d = `M${a.x} ${a.y + NODO / 2} C${a.x} ${medio} ${b.x} ${medio} ${b.x} ${b.y - NODO / 2}`;
            const l = LINEA[tipo];
            return (
              <g key={`${r}-${n}`} opacity={l.opacidad}>
                <path d={d} fill="none" stroke={l.color} stroke-width={l.ancho} stroke-dasharray={l.guiones} stroke-linecap="round" />
                {l.flujo && (
                  <path d={d} fill="none" stroke="var(--texto)" stroke-width={l.ancho} stroke-dasharray="2 22" stroke-linecap="round" class="animate-trazo" opacity={0.8} />
                )}
              </g>
            );
          })}
        </svg>

        {/* Talentos */}
        {nodos.map((n) => {
          const { x, y } = centro(n.id);
          const estado = estados.get(n.id)!;
          const elegido = n.id === seleccion;
          const enRuta = ruta.has(n.id);
          return (
            <div key={n.id} class="absolute flex flex-col items-center" style={{ left: `${x - COL / 2}px`, top: `${y - NODO / 2}px`, width: `${COL}px` }}>
              <button
                type="button"
                onClick={() => onElegir(n.id)}
                aria-pressed={elegido}
                aria-label={`${n.nombre}: ${ESTILO_ESTADO[estado].texto.toLowerCase()}`}
                class={`relative rounded-xl transition duration-300 ease-suave hover:scale-110 ${elegido ? "scale-115" : ""}`}
              >
                {elegido && <span class="absolute -inset-2 rounded-full bg-acento/20 blur-md" aria-hidden="true" />}
                <Hexagono categoria={n.categoria} estado={estado} tamano={NODO} elegido={elegido} />
                {celebrado?.id === n.id && <Estallido key={celebrado.clave} />}
                {recienAbiertos.has(n.id) && (
                  <span class="absolute -top-3 left-1/2 -translate-x-1/2 animate-flotar rounded-[2px] bg-resalte px-1 font-mono text-[0.5rem] font-semibold text-fondo uppercase" aria-hidden="true">
                    nuevo
                  </span>
                )}
              </button>
              <span
                class={`mt-1.5 line-clamp-2 px-1 text-center text-[10px] leading-tight ${
                  elegido ? "font-semibold text-texto" : enRuta ? "text-acento-claro" : estado === "conseguido" ? "text-texto/80" : "text-tenue"
                }`}
                aria-hidden="true"
              >
                {n.nombre}
              </span>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
