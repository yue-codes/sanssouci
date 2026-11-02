/**
 * @file Nombre e icono de cada tipo de bloque de una sesión (respiración, lectura…).
 * `Record<TipoBloque, …>` hace que TypeScript avise si el esquema añade un tipo y falta aquí.
 */
import {
  Flame, Wind, BookOpen, Brain, Drum, Ear, Guitar, Headphones, Waves, Hand,
  Music, NotebookPen, Library, Video, RotateCcw, GraduationCap, SearchCheck,
} from "lucide-preact";
import type { Dia } from "@/lib/contenido";

/** Tipo de bloque, tal como lo define el esquema de `dias`. */
export type TipoBloque = Dia["data"]["bloques"][number]["tipo"];

/** Nombre e icono de cada tipo de bloque. */
export const TIPO_BLOQUE: Record<TipoBloque, { nombre: string; Icono: typeof Wind }> = {
  calentamiento: { nombre: "Calentamiento", Icono: Flame },
  respiracion: { nombre: "Respiración", Icono: Wind },
  lectura: { nombre: "Lectura", Icono: BookOpen },
  teoria: { nombre: "Teoría", Icono: Brain },
  ritmo: { nombre: "Ritmo", Icono: Drum },
  oido: { nombre: "Oído", Icono: Ear },
  guitarra: { nombre: "Guitarra", Icono: Guitar },
  escucha: { nombre: "Escucha", Icono: Headphones },
  sonido: { nombre: "Sonido", Icono: Waves },
  tecnica: { nombre: "Técnica", Icono: Hand },
  escalas: { nombre: "Escalas", Icono: Music },
  estudios: { nombre: "Estudios", Icono: NotebookPen },
  repertorio: { nombre: "Repertorio", Icono: Library },
  grabacion: { nombre: "Grabación", Icono: Video },
  repaso: { nombre: "Repaso", Icono: RotateCcw },
  clase: { nombre: "Clase", Icono: GraduationCap },
  revision: { nombre: "Revisión", Icono: SearchCheck },
};
