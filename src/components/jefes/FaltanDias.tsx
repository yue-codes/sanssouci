import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { SITIO } from "@/config/sitio";
import { diaDelPlanHoy } from "@/lib/fechas";
import { estadoJefe } from "./combate";

interface Props {
  /** Día del plan en que toca el jefe. */
  dia: number;
  /** Fecha del día 1 del plan, «AAAA-MM-DD». */
  inicio: string;
}

/**
 * @component FaltanDias (isla: `client:load`)
 * «· faltan N días» para el combate, en la ficha del jefe. La portada del jefe es
 * estática (se compila una vez), así que «hoy» no puede calcularse al compilar:
 * se calcula aquí, en el navegador, en la zona horaria del plan. No se ve si el
 * jefe ya pasó o si ya lo venciste (lo dice `estadoJefe`, que publica la arena).
 *
 * Hasta montarse no pinta nada (en el HTML del servidor no hay «hoy» que valga).
 */
export default function FaltanDias({ dia, inicio }: Props) {
  const hoy = useSignal<number | undefined>(undefined);
  useEffect(() => {
    hoy.value = diaDelPlanHoy(inicio, SITIO.zonaHoraria);
  }, []);

  if (hoy.value === undefined || hoy.value > dia || estadoJefe.value?.vencido) return null;
  const faltan = dia - Math.max(hoy.value, 0);
  return <span>{faltan === 0 ? " · es hoy" : ` · faltan ${faltan} ${faltan === 1 ? "día" : "días"}`}</span>;
}
