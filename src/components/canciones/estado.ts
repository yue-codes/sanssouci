/**
 * @file Cómo se ve cada estado de una canción (pendiente, aprendiendo, dominada):
 * nombre, icono y colores. Lo usan la carta (`TarjetaCancion`), el selector de la
 * ficha (`SelectorEstado`) y el filtro del catálogo.
 *
 * Colores con el mismo sentido que en el resto del juego: cian (la marca) para lo
 * que estás haciendo y menta para lo conseguido.
 */
import { BookOpen, Circle, Crown, type LucideIcon } from "lucide-preact";
import type { EstadoCancion } from "@/lib/estado-cancion";

/** Lo que hace falta para pintar un estado. */
interface EstiloEstado {
  /** Nombre visible. */
  nombre: string;
  /** Explicación corta (para el selector). */
  ayuda: string;
  Icono: LucideIcon;
  /** Clases del sello de la carta (fondo y texto). */
  sello: string;
  /** Clases del botón elegido en el selector. */
  elegido: string;
}

/** Estilo de cada estado. Es un `Record`: si se añade un estado, TypeScript exige su estilo. */
export const ESTADO_CANCION: Record<EstadoCancion, EstiloEstado> = {
  pendiente: {
    nombre: "Pendiente",
    ayuda: "Aún no la empiezas",
    Icono: Circle,
    sello: "border border-borde-fuerte bg-fondo/85 text-tenue",
    elegido: "border-borde-fuerte bg-superficie-2 text-texto",
  },
  aprendiendo: {
    nombre: "Aprendiendo",
    ayuda: "La estás practicando",
    Icono: BookOpen,
    sello: "bg-acento text-fondo",
    elegido: "border-acento bg-acento-suave text-texto",
  },
  dominada: {
    nombre: "Dominada",
    ayuda: "Te sale completa y limpia",
    Icono: Crown,
    sello: "bg-exito text-fondo",
    elegido: "border-exito bg-exito/15 text-texto",
  },
};
