/**
 * @file Progreso INVENTADO, hasta que exista el login (fase 4).
 *
 * Simula a alguien que lleva un par de semanas sin flauta. Está en un solo sitio
 * para que todas las páginas enseñen el mismo progreso; en la fase 4 se sustituye
 * por el progreso real de Supabase, que tendrá la misma forma (`Progreso`).
 */
import type { Progreso } from "@/lib/progreso";

export const PROGRESO_EJEMPLO: Progreso = {
  obtenidos: new Set([
    "logro-test-lectura",
    "logro-cuaderno",
    "logro-respiracion-diafragmatica",
    "logro-escalas-mayores-teoria",
    "logro-ritmo-basico",
    "logro-escucha-maestros",
    "logro-primera-semana",
    "logro-clave-sol",
  ]),
  jefesVencidos: new Set(),
};
