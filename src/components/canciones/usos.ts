/**
 * @file Nombre e icono de cada uso de una versión (partitura, referencia…).
 * `Record<UsoVersion, …>` hace que TypeScript avise si el esquema añade un uso y falta aquí.
 */
import { FileMusic, Headphones, Ear, Piano, GraduationCap, Scissors } from "lucide-preact";
import type { Cancion } from "@/lib/contenido";

export type UsoVersion = Cancion["data"]["versiones"][number]["usos"][number];

export const USO_VERSION: Record<UsoVersion, { nombre: string; Icono: typeof Ear }> = {
  partitura: { nombre: "Partitura", Icono: FileMusic },
  referencia: { nombre: "Referencia", Icono: Headphones },
  "de-oido": { nombre: "De oído", Icono: Ear },
  acompanamiento: { nombre: "Acompañamiento", Icono: Piano },
  tutorial: { nombre: "Tutorial", Icono: GraduationCap },
  clip: { nombre: "Fragmento", Icono: Scissors },
};
