import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { ChevronDown } from "lucide-preact";
import type { NodoTalento } from "@/lib/arbol";
import type { EstadoLogro } from "@/lib/progreso";
import { ESTILO_ESTADO } from "./estilos";
import Estallido from "@/components/ui/Estallido";
import Hexagono from "./Hexagono";
import { ID_PANEL_RAMA } from "./PestanasRamas";

interface Props {
  /** Nodos de la rama, ordenados de lo básico a lo avanzado. */
  nodos: NodoTalento[];
  /** Estado de cada nodo por id. */
  estados: ReadonlyMap<string, EstadoLogro>;
  /** Id del nodo seleccionado (se muestra desplegado). */
  seleccion: string;
  /** Si se indica, los demás talentos se ven atenuados (filtro «¿Qué puedo hacer ya?»). */
  visibles?: ReadonlySet<string>;
  /** Talentos que se acaban de abrir (llevan la marca «nuevo»). */
  recienAbiertos: ReadonlySet<string>;
  /** Talento recién conseguido, para su estallido. */
  celebrado?: { id: string; clave: number };
  /** Se llama al elegir un nodo. */
  onElegir: (id: string) => void;
  /** Contenido que se despliega bajo el nodo seleccionado. */
  detalle: ComponentChildren;
}

/**
 * @component ListaRama
 * Vista de celular del árbol: los talentos de una rama en vertical, unidos por
 * una línea, con el seleccionado desplegado (patrón acordeón). También celebra
 * (estallido y marca «nuevo») igual que el lienzo.
 */
export default function ListaRama({ nodos, estados, seleccion, visibles, recienAbiertos, celebrado, onElegir, detalle }: Props) {
  // Al saltar a un talento (desde un requisito o un enlace #id), lo trae a la vista.
  // No en el primer render: al abrir la página no queremos que salte sola.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`talento-${seleccion}`)?.scrollIntoView({ block: "nearest", behavior: suave ? "smooth" : "auto" });
  }, [seleccion]);

  return (
    <div id={ID_PANEL_RAMA} role="tabpanel" class="relative mt-3">
      {/* Línea vertical que une los nodos, detrás de los hexágonos */}
      <span class="absolute top-6 bottom-6 left-[1.875rem] border-l-2 border-dashed border-borde" aria-hidden="true" />
      <ol class="relative grid gap-2">
      {nodos.map((n) => {
        const estado = estados.get(n.id)!;
        const abierto = n.id === seleccion;
        return (
          <li key={n.id} id={`talento-${n.id}`} class={`relative rounded-md border transition ${abierto ? "border-acento/60 bg-superficie" : "border-transparent"} ${!visibles || visibles.has(n.id) || abierto ? "" : "opacity-35"}`}>
            <button
              type="button"
              aria-expanded={abierto}
              onClick={() => onElegir(n.id)}
              class="flex w-full items-center gap-3 p-2 text-left"
            >
              <span class="relative">
                <Hexagono categoria={n.categoria} estado={estado} tamano={44} elegido={abierto} llave={n.llaveDe.length > 0} />
                {celebrado?.id === n.id && <Estallido key={celebrado.clave} />}
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold leading-tight">{n.nombre}</span>
                <span class={`text-xs ${ESTILO_ESTADO[estado].icono}`}>{ESTILO_ESTADO[estado].texto}</span>
                <span class="text-xs text-tenue"> · {n.zona}</span>
                {recienAbiertos.has(n.id) && (
                  <span class="ml-2 rounded-[2px] bg-resalte px-1 font-mono text-[0.5625rem] font-semibold text-fondo uppercase">nuevo</span>
                )}
              </span>
              <ChevronDown size={18} class={`shrink-0 text-tenue transition ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {abierto && <div class="px-4 pb-4">{detalle}</div>}
          </li>
        );
      })}
      </ol>
    </div>
  );
}
