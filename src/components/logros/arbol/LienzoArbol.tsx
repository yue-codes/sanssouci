import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { animate, inView } from "motion";
import type { NodoTalento } from "@/lib/arbol";
import type { CategoriaLogro } from "@/lib/contenido";
import type { EstadoLogro } from "@/lib/progreso";
import { ICONO_CATEGORIA, NOMBRE_CATEGORIA } from "../categorias";
import { COLOR_ESTADO, ESTILO_ESTADO } from "./estilos";
import Estallido from "@/components/ui/Estallido";
import Hexagono from "./Hexagono";

interface Props {
  /** Todos los nodos, con `col` y `fila`. */
  nodos: NodoTalento[];
  /** Categorías en el orden de las columnas. */
  ramas: readonly CategoriaLogro[];
  /** Estado de cada nodo por id. */
  estados: ReadonlyMap<string, EstadoLogro>;
  /** Id del nodo seleccionado (el de la ficha). */
  seleccion: string;
  /** Id del nodo cuyas líneas se resaltan: el que está bajo el ratón o el foco, o si no, el seleccionado. */
  foco: string;
  /** Antecesores de `foco`: «la ruta hasta aquí», que se resalta. */
  ruta: ReadonlySet<string>;
  /** Si se indica, solo estos talentos se ven encendidos (filtro «¿Qué puedo hacer ya?»). */
  visibles?: ReadonlySet<string>;
  /** Talentos que se acaban de abrir al conseguir otro (llevan la marca «nuevo»). */
  recienAbiertos: ReadonlySet<string>;
  /** Talento recién conseguido, para su estallido; `clave` cambia en cada celebración. */
  celebrado?: { id: string; clave: number };
  /** Se llama al elegir un nodo. */
  onElegir: (id: string) => void;
  /** Se llama al pasar el ratón (o el foco del teclado) por un nodo, y con `undefined` al salir. */
  onFoco: (id: string | undefined) => void;
}

// Medidas de la cuadrícula, en px. El lienzo tiene tamaño fijo y se encoge para caber.
const COL = 106;
const FILA = 92;
const NODO = 50;
const NODO_LLAVE = 56;
const ARRIBA = 100; // cabecera de las ramas
/** Lo más que se encoge el lienzo para caber; si aun así no cabe, hay scroll horizontal. */
const ESCALA_MIN = 0.65;
/** Lo más que crece para llenar pantallas anchas (más, y los iconos se verían borrosos y enormes). */
const ESCALA_MAX = 1.35;

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
const PRIORIDAD: TipoLinea[] = ["lejana", "frontera", "conseguida", "abre", "ruta"];

/**
 * @component LienzoArbol
 * Vista de escritorio del árbol: un mapa de estrellas con todas las ramas en
 * columnas y los requisitos como líneas.
 *
 * - Cabecera de cada rama con su avance en segmentos (uno por talento).
 * - Líneas: lo conseguido en menta con luz que corre; la frontera (de lo
 *   conseguido a lo disponible) en lavanda; y, del talento bajo el ratón (o el
 *   elegido), su ruta de requisitos en cian y lo que abre en lavanda.
 * - Las llaves de jefe son más grandes y llevan anillo rosa.
 * - Al entrar en pantalla, las líneas se dibujan de arriba abajo y los talentos
 *   aparecen fila a fila. Al conseguir uno: estallido y marca «nuevo» en lo que se abre.
 *
 * Se ve **entero** y a todo el ancho: el lienzo se dibuja a tamaño fijo y se
 * escala (`transform: scale`) para llenar el ancho disponible (encoge o crece), que se mide con
 * un `ResizeObserver` (avisa cada vez que cambia el tamaño de la caja).
 */
export default function LienzoArbol(props: Props) {
  const { nodos, ramas, estados, seleccion, foco, ruta, visibles, recienAbiertos, celebrado, onElegir, onFoco } = props;
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const tamano = (n: NodoTalento) => (n.llaveDe.length ? NODO_LLAVE : NODO);
  const centro = (id: string) => {
    const n = porId.get(id)!;
    return { x: n.col * COL + COL / 2, y: ARRIBA + n.fila * FILA + NODO_LLAVE / 2 };
  };
  const ancho = ramas.length * COL;
  const alto = ARRIBA + (Math.max(...nodos.map((n) => n.fila)) + 1) * FILA;

  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const escala = useSignal(1);

  // Encoger para caber.
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    // El cambio va al siguiente fotograma: escalar cambia la altura (y quizá la barra de
    // scroll, y con ella el ancho); hacerlo dentro del aviso provoca el error
    // «ResizeObserver loop completed with undelivered notifications».
    let fotograma = 0;
    const observador = new ResizeObserver(([e]) => {
      cancelAnimationFrame(fotograma);
      fotograma = requestAnimationFrame(() => {
        escala.value = Math.max(ESCALA_MIN, Math.min(ESCALA_MAX, e.contentRect.width / ancho));
      });
    });
    observador.observe(el);
    return () => {
      cancelAnimationFrame(fotograma);
      observador.disconnect();
    };
  }, [ancho]);

  // Entrada: líneas que se dibujan y talentos que aparecen por filas. Solo con la
  // clase `movimiento` en <html> (no la tiene quien pide menos movimiento); el estado
  // oculto inicial lo ponen las clases `in-[.movimiento]:` de abajo.
  useEffect(() => {
    const el = lienzo.current;
    if (!el || !document.documentElement.classList.contains("movimiento")) return;
    return inView(
      el,
      () => {
        animate(el.querySelector<HTMLElement>("[data-lineas]")!, { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] }, { duration: 1.8, ease: [0.3, 0.6, 0.3, 1] });
        el.querySelectorAll<HTMLElement>("[data-fila]").forEach((n) => {
          animate(n, { opacity: [0, 1], scale: [0.6, 1] }, { delay: 0.1 + Number(n.dataset.fila) * 0.07, duration: 0.45, ease: "backOut" });
        });
      },
      { amount: 0.1 },
    );
  }, []);

  const tipoLinea = (desde: string, hasta: string): TipoLinea => {
    if (hasta === foco || (ruta.has(hasta) && ruta.has(desde))) return "ruta";
    if (desde === foco) return "abre";
    const a = estados.get(desde);
    const b = estados.get(hasta);
    if (a === "conseguido" && b === "conseguido") return "conseguida";
    if (a === "conseguido" && b === "disponible") return "frontera";
    return "lejana";
  };
  const encendido = (id: string) => !visibles || visibles.has(id);
  const lineas = nodos
    .flatMap((n) => n.requiere.map((r) => ({ r, n: n.id, tipo: tipoLinea(r, n.id) })))
    // Lo importante se pinta al final, para que quede encima.
    .sort((a, b) => PRIORIDAD.indexOf(a.tipo) - PRIORIDAD.indexOf(b.tipo));
  const s = escala.value;

  return (
    <div ref={caja} class="overflow-x-auto" tabIndex={0} role="region" aria-label="Árbol de habilidades">
      {/* La caja exterior ocupa el tamaño ya encogido; la interior se dibuja a tamaño real y se escala. */}
      <div class="relative mx-auto" style={{ width: `${ancho * s}px`, height: `${alto * s}px` }}>
        <div
          ref={lienzo}
          class="absolute top-0 left-0 origin-top-left bg-[radial-gradient(circle,var(--borde)_1px,transparent_1.5px)] bg-[length:24px_24px]"
          style={{ width: `${ancho}px`, height: `${alto}px`, transform: `scale(${s})` }}
          onMouseLeave={() => onFoco(undefined)}
        >
          {/* Cabecera de cada rama, con su avance */}
          {ramas.map((r, i) => {
            const Icono = ICONO_CATEGORIA[r];
            const deRama = nodos.filter((n) => n.categoria === r).sort((a, b) => a.fila - b.fila);
            const hechos = deRama.filter((n) => estados.get(n.id) === "conseguido").length;
            return (
              <div key={r} class="absolute top-0 bottom-0" style={{ left: `${i * COL}px`, width: `${COL}px` }}>
                <span class="absolute top-22 bottom-4 left-1/2 border-l border-borde/20" aria-hidden="true" />
                <div class="relative flex flex-col items-center gap-1.5 px-2.5 pt-4 text-tenue">
                  <Icono size={17} class={hechos > 0 ? "text-exito" : ""} aria-hidden="true" />
                  <span class="font-pixel text-xs tracking-wider text-texto uppercase">{NOMBRE_CATEGORIA[r]}</span>
                  <span class="flex w-full gap-0.5" aria-hidden="true">
                    {deRama.map((n) => (
                      <span key={n.id} class={`h-1 flex-1 rounded-[1px] ${ESTILO_ESTADO[estados.get(n.id)!].borde}`} />
                    ))}
                  </span>
                  <span class="font-mono text-[0.625rem] tabular-nums">
                    {hechos}/{deRama.length}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Líneas de requisitos (curvas de Bézier de un talento al siguiente) */}
          {/* Las líneas van en un div propio: `clip-path` se anima en un elemento HTML (en el <svg>, motion lo trataría como atributo). */}
          <div data-lineas class="pointer-events-none absolute inset-0 in-[.movimiento]:[clip-path:inset(0_0_100%_0)]">
          <svg class="absolute inset-0" width={ancho} height={alto} aria-hidden="true">
            {lineas.map(({ r, n, tipo }) => {
              const a = centro(r);
              const b = centro(n);
              const medio = (a.y + b.y) / 2;
              const d = `M${a.x} ${a.y + tamano(porId.get(r)!) / 2 + 2} C${a.x} ${medio} ${b.x} ${medio} ${b.x} ${b.y - tamano(porId.get(n)!) / 2 - 2}`;
              const l = LINEA[tipo];
              const apagada = !(encendido(r) && encendido(n)) && tipo !== "ruta";
              return (
                <g key={`${r}-${n}`} opacity={apagada ? 0.08 : l.opacidad} class="transition-opacity duration-500">
                  <path d={d} fill="none" stroke={l.color} stroke-width={l.ancho} stroke-dasharray={l.guiones} stroke-linecap="round" />
                  {l.flujo && !apagada && (
                    <path d={d} fill="none" stroke="var(--texto)" stroke-width={l.ancho} stroke-dasharray="2 22" stroke-linecap="round" class="animate-trazo" opacity={0.8} />
                  )}
                </g>
              );
            })}
          </svg>
          </div>

          {/* Talentos */}
          {nodos.map((n) => {
            const { x, y } = centro(n.id);
            const estado = estados.get(n.id)!;
            const elegido = n.id === seleccion;
            const resaltado = n.id === foco || ruta.has(n.id);
            const t = tamano(n);
            return (
              <div
                key={n.id}
                data-fila={n.fila}
                class="absolute flex flex-col items-center in-[.movimiento]:opacity-0"
                style={{ left: `${x - COL / 2}px`, top: `${y - t / 2}px`, width: `${COL}px` }}
              >
                {/* El atenuado del filtro va en un envoltorio propio: la opacidad del nodo la anima la entrada. */}
                <div class={`flex flex-col items-center transition-opacity duration-500 ${encendido(n.id) || resaltado ? "" : "opacity-20"}`}>
                  <button
                    type="button"
                    onClick={() => onElegir(n.id)}
                    onMouseEnter={() => onFoco(n.id)}
                    onFocus={() => onFoco(n.id)}
                    onBlur={() => onFoco(undefined)}
                    aria-pressed={elegido}
                    aria-label={`${n.nombre}: ${ESTILO_ESTADO[estado].texto.toLowerCase()}${n.llaveDe.length ? `, llave de ${n.llaveDe.join(" y ")}` : ""}`}
                    class={`relative rounded-xl transition duration-300 ease-suave hover:scale-110 ${elegido ? "scale-115" : ""}`}
                  >
                    {elegido && <span class="absolute -inset-2 rounded-full bg-acento/20 blur-md" aria-hidden="true" />}
                    <Hexagono categoria={n.categoria} estado={estado} tamano={t} elegido={elegido} llave={n.llaveDe.length > 0} />
                    {celebrado?.id === n.id && <Estallido key={celebrado.clave} />}
                    {recienAbiertos.has(n.id) && (
                      <span class="absolute -top-3.5 left-1/2 -translate-x-1/2 animate-flotar rounded-[2px] bg-resalte px-1 font-mono text-[0.5625rem] font-semibold text-fondo uppercase" aria-hidden="true">
                        nuevo
                      </span>
                    )}
                  </button>
                  <span
                    class={`mt-1.5 line-clamp-2 rounded-[2px] bg-fondo/85 px-1 py-px text-center text-[11.5px] leading-tight ${
                      elegido || n.id === foco ? "font-semibold text-texto" : resaltado ? "text-acento-claro" : estado === "conseguido" ? "text-texto/85" : "text-tenue"
                    }`}
                    aria-hidden="true"
                  >
                    {n.nombre}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
