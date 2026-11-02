/**
 * @file Estilos compartidos por las piezas del árbol de talentos.
 * Un solo sitio para decidir cómo se ve cada estado (conseguido, disponible, bloqueado).
 */
import { Check, Lock, Sparkles } from "lucide-preact";
import type { EstadoLogro } from "@/lib/progreso";

/** Forma hexagonal (con `clip-path`) de los nodos. */
export const HEXAGONO = "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)";

/** Clases de Tailwind y texto de cada estado. */
export const ESTILO_ESTADO: Record<EstadoLogro, { borde: string; relleno: string; icono: string; texto: string }> = {
  conseguido: { borde: "bg-acento", relleno: "bg-acento-suave", icono: "text-acento", texto: "Conseguido" },
  disponible: { borde: "bg-resalte", relleno: "bg-superficie", icono: "text-resalte", texto: "Disponible" },
  bloqueado: { borde: "bg-borde", relleno: "bg-superficie-2", icono: "text-tenue opacity-60", texto: "Bloqueado" },
};

/** Icono que acompaña a cada estado en listas y leyendas. */
export const ICONO_ESTADO: Record<EstadoLogro, typeof Check> = {
  conseguido: Check,
  disponible: Sparkles,
  bloqueado: Lock,
};
