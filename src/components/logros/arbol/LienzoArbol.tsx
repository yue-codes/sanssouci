import type { NodoTalento } from "@/lib/arbol";
import type { CategoriaLogro } from "@/lib/contenido";
import type { EstadoLogro } from "@/lib/progreso";
import { ICONO_CATEGORIA, NOMBRE_CATEGORIA } from "../categorias";
import { ESTILO_ESTADO } from "./estilos";
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
  /** Se llama al elegir un nodo. */
  onElegir: (id: string) => void;
}

// Medidas de la cuadrícula, en px. El lienzo tiene tamaño fijo (con scroll si no cabe).
const COL = 104;
const FILA = 92;
const NODO = 52;
const ARRIBA = 64; // espacio para los nombres de las ramas

/**
 * @component LienzoArbol
 * Vista de escritorio del árbol: todas las ramas en columnas, con las líneas
 * de requisitos dibujadas en SVG. Las líneas de lo conseguido van en color de
 * acento; las del nodo elegido, en color de resalte.
 */
export default function LienzoArbol({ nodos, ramas, estados, seleccion, onElegir }: Props) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const centro = (id: string) => {
    const n = porId.get(id)!;
    return { x: n.col * COL + COL / 2, y: ARRIBA + n.fila * FILA + NODO / 2 };
  };
  const ancho = ramas.length * COL;
  const alto = ARRIBA + (Math.max(...nodos.map((n) => n.fila)) + 1) * FILA;

  return (
    <div class="overflow-x-auto" tabIndex={0} role="region" aria-label="Árbol de habilidades">
      <div class="relative mx-auto" style={{ width: `${ancho}px`, height: `${alto}px` }}>
        {/* Nombres de las ramas */}
        {ramas.map((r, i) => {
          const Icono = ICONO_CATEGORIA[r];
          return (
            <div key={r} class="absolute top-3 flex flex-col items-center gap-1 text-tenue" style={{ left: `${i * COL}px`, width: `${COL}px` }}>
              <Icono size={16} aria-hidden="true" />
              <span class="font-pixel text-[11px] uppercase tracking-wider">{NOMBRE_CATEGORIA[r]}</span>
            </div>
          );
        })}

        {/* Líneas de requisitos (curvas de Bézier de un nodo al siguiente) */}
        <svg class="pointer-events-none absolute inset-0" width={ancho} height={alto} aria-hidden="true">
          {nodos.flatMap((n) =>
            n.requiere.map((r) => {
              const a = centro(r);
              const b = centro(n.id);
              const conseguida = estados.get(r) === "conseguido";
              const resaltada = n.id === seleccion || r === seleccion;
              const medio = (a.y + b.y) / 2;
              return (
                <path
                  key={`${r}-${n.id}`}
                  d={`M${a.x} ${a.y + NODO / 2} C${a.x} ${medio} ${b.x} ${medio} ${b.x} ${b.y - NODO / 2}`}
                  fill="none"
                  stroke={resaltada ? "var(--resalte)" : conseguida ? "var(--acento)" : "var(--borde)"}
                  stroke-width={resaltada ? 3 : conseguida ? 2.5 : 1.5}
                  stroke-dasharray={conseguida || resaltada ? undefined : "4 5"}
                  opacity={resaltada || conseguida ? 1 : 0.8}
                />
              );
            }),
          )}
        </svg>

        {/* Nodos */}
        {nodos.map((n) => {
          const { x, y } = centro(n.id);
          const estado = estados.get(n.id)!;
          const elegido = n.id === seleccion;
          return (
            <div key={n.id} class="absolute flex flex-col items-center" style={{ left: `${x - COL / 2}px`, top: `${y - NODO / 2}px`, width: `${COL}px` }}>
              <button
                type="button"
                onClick={() => onElegir(n.id)}
                aria-pressed={elegido}
                aria-label={`${n.nombre}: ${ESTILO_ESTADO[estado].texto.toLowerCase()}`}
                class={`rounded-xl transition hover:scale-110 ${elegido ? "scale-115" : ""}`}
              >
                <Hexagono categoria={n.categoria} estado={estado} tamano={NODO} elegido={elegido} />
              </button>
              <span class={`mt-1.5 line-clamp-2 px-1 text-center text-[10px] leading-tight ${elegido ? "font-semibold text-texto" : "text-tenue"}`} aria-hidden="true">
                {n.nombre}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
