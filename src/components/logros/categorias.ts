/**
 * @file Icono, nombre y orden de cada categoría de logro (cada una es una "rama" del árbol).
 * Vive aquí para que InsigniaLogro, ChipLogro y el árbol usen exactamente lo mismo.
 * Con `Record<CategoriaLogro, …>`, si se añade una categoría al esquema y falta aquí,
 * TypeScript avisa.
 */
import { BookOpen, Brain, Wind, Waves, Hand, Music, Ear, Flame, Video, Library } from "lucide-preact";
import type { CategoriaLogro } from "@/lib/contenido";

export type { CategoriaLogro };

export const ICONO_CATEGORIA: Record<CategoriaLogro, typeof Wind> = {
  lectura: BookOpen, teoria: Brain, respiracion: Wind, sonido: Waves, tecnica: Hand,
  escalas: Music, oido: Ear, habito: Flame, grabacion: Video, repertorio: Library,
};

export const NOMBRE_CATEGORIA: Record<CategoriaLogro, string> = {
  lectura: "Lectura", teoria: "Teoría", respiracion: "Respiración", sonido: "Sonido", tecnica: "Técnica",
  escalas: "Escalas", oido: "Oído", habito: "Hábitos", grabacion: "Grabación", repertorio: "Repertorio",
};

/** Orden de las ramas de izquierda a derecha: del papel a la flauta, y al final lo transversal. */
export const ORDEN_RAMAS: CategoriaLogro[] = [
  "lectura", "teoria", "oido", "respiracion", "sonido", "tecnica", "escalas", "repertorio", "habito", "grabacion",
];
