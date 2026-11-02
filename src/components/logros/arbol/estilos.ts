/**
 * @file Estilos compartidos por las piezas del árbol de talentos.
 * Un solo sitio para decidir cómo se ve cada estado. Siguen la paleta del sitio:
 * menta = conseguido, lavanda = disponible, gris = bloqueado (igual que en el mapa).
 */
import { Check, Lock, Sparkles } from "lucide-preact";
import type { EstadoLogro } from "@/lib/progreso";

/** Forma hexagonal (con `clip-path`) de los nodos. */
export const HEXAGONO = "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)";

/**
 * Clases de Tailwind y texto de cada estado.
 * Los rellenos son opacos (mezcla con `--fondo`) porque el hexágono interior tapa
 * al exterior, que hace de borde: si fuera transparente, el borde se vería a través.
 */
export const ESTILO_ESTADO: Record<EstadoLogro, { borde: string; relleno: string; icono: string; texto: string }> = {
  conseguido: {
    borde: "bg-exito",
    relleno: "bg-[color-mix(in_oklab,var(--exito)_22%,var(--fondo))]",
    icono: "text-exito",
    texto: "Conseguido",
  },
  disponible: {
    borde: "bg-resalte",
    relleno: "bg-[color-mix(in_oklab,var(--resalte)_12%,var(--fondo))]",
    icono: "text-resalte",
    texto: "Disponible",
  },
  bloqueado: { borde: "bg-borde", relleno: "bg-fondo", icono: "text-tenue opacity-60", texto: "Bloqueado" },
};

/** Color (variable CSS) de cada estado, para lo que se pinta en SVG. */
export const COLOR_ESTADO: Record<EstadoLogro, string> = {
  conseguido: "var(--exito)",
  disponible: "var(--resalte)",
  bloqueado: "var(--borde)",
};

/** Icono que acompaña a cada estado en listas y leyendas. */
export const ICONO_ESTADO: Record<EstadoLogro, typeof Check> = {
  conseguido: Check,
  disponible: Sparkles,
  bloqueado: Lock,
};
