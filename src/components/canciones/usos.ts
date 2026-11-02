/**
 * @file Nombre e icono de cada uso de una versión (partitura, referencia…).
 * `Record<UsoVersion, …>` hace que TypeScript avise si el esquema añade un uso y falta aquí.
 */
import { FileMusic, Headphones, Ear, Piano, GraduationCap, Scissors } from "lucide-preact";
import type { Cancion } from "@/lib/contenido";

/** Uso de una versión, tal como lo define el esquema de `canciones`. */
export type UsoVersion = Cancion["data"]["versiones"][number]["usos"][number];

/** Nombre e icono de cada uso. */
export const USO_VERSION: Record<UsoVersion, { nombre: string; Icono: typeof Ear }> = {
  partitura: { nombre: "Partitura", Icono: FileMusic },
  referencia: { nombre: "Referencia", Icono: Headphones },
  "de-oido": { nombre: "De oído", Icono: Ear },
  acompanamiento: { nombre: "Acompañamiento", Icono: Piano },
  tutorial: { nombre: "Tutorial", Icono: GraduationCap },
  clip: { nombre: "Fragmento", Icono: Scissors },
};
