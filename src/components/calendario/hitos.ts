/**
 * @file Nombre, icono y color de cada hito del calendario (jefe, clase…).
 * Lo comparten las celdas, la leyenda y la página de cada día.
 */
import { Swords, GraduationCap, Sparkles, Gift } from "lucide-preact";
import type { Hito } from "@/lib/calendario";

/** Nombre, icono y clase de color de cada hito. */
export const HITO: Record<Hito, { nombre: string; Icono: typeof Swords; clase: string }> = {
  flauta: { nombre: "Llega la flauta (estimado)", Icono: Sparkles, clase: "text-resalte" },
  clase: { nombre: "Clase con el maestro", Icono: GraduationCap, clase: "text-secundario" },
  jefe: { nombre: "Jefe", Icono: Swords, clase: "text-peligro" },
  festivo: { nombre: "Festivo (opcional)", Icono: Gift, clase: "text-tenue" },
};
