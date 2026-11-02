import { KeyRound, Lock } from "lucide-preact";
import type { CategoriaLogro } from "@/lib/contenido";
import type { EstadoLogro } from "@/lib/progreso";
import { ICONO_CATEGORIA } from "../categorias";
import { ESTILO_ESTADO, HEXAGONO } from "./estilos";

interface Props {
  /** Categoría del logro: decide el icono. */
  categoria: CategoriaLogro;
  /** Estado: decide los colores, el halo (disponible) y el candado (bloqueado). */
  estado: EstadoLogro;
  /** Lado en px. Por defecto, 52. */
  tamano?: number;
  /** Si está seleccionado, el borde usa el color del texto. */
  elegido?: boolean;
  /** Es la llave de algún jefe: lleva un anillo rosa (el color de los jefes) y una llave. */
  llave?: boolean;
}

/**
 * @component Hexagono
 * Nodo visual del árbol: hexágono con borde, relleno e icono de su categoría.
 * Es solo decoración (`aria-hidden`): el texto accesible lo pone quien lo usa.
 * El borde se logra con dos hexágonos superpuestos, porque `clip-path` recorta
 * también los bordes de CSS. Lo conseguido brilla (`drop-shadow`, que sí sigue la
 * forma recortada, a diferencia de `box-shadow`). Las llaves de jefe llevan un
 * anillo rosa por fuera (sobresale 6 px del tamaño indicado).
 */
export default function Hexagono({ categoria, estado, tamano = 52, elegido = false, llave = false }: Props) {
  const e = ESTILO_ESTADO[estado];
  const Icono = ICONO_CATEGORIA[categoria];
  const forma = { clipPath: HEXAGONO };

  return (
    <span
      class={`relative grid shrink-0 place-items-center ${estado === "conseguido" ? "drop-shadow-[0_0_7px_var(--exito)]" : ""}`}
      style={{ width: `${tamano}px`, height: `${tamano}px` }}
      aria-hidden="true"
    >
      {llave && (
        <>
          <span class="absolute -inset-[6px] bg-peligro" style={forma} />
          <span class="absolute -inset-[3px] bg-fondo" style={forma} />
        </>
      )}
      {estado === "disponible" && <span class={`absolute inset-0 animate-latido ${e.borde}`} style={forma} />}
      <span class={`absolute inset-0 ${elegido ? "bg-texto" : e.borde}`} style={forma} />
      <span class={`absolute inset-[3px] ${e.relleno}`} style={forma} />
      <Icono size={Math.round(tamano * 0.38)} class={`relative ${e.icono}`} />
      {estado === "bloqueado" && (
        <span class="absolute -right-0.5 -bottom-0.5 grid size-4 place-items-center rounded-full bg-superficie-2 text-tenue ring-1 ring-borde">
          <Lock size={9} />
        </span>
      )}
      {llave && (
        <span class="absolute -top-1.5 -left-1.5 grid size-4.5 place-items-center rounded-full bg-peligro text-fondo">
          <KeyRound size={10} strokeWidth={2.5} />
        </span>
      )}
    </span>
  );
}
