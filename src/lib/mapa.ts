/**
 * @file Datos del mapa como sendero: cada zona con su estado, sus requisitos
 * para pasar y su jefe (o jefes).
 *
 * Prepara todo lo que pinta la página /mapa para que los componentes solo
 * tengan que mostrarlo (separar datos de presentación).
 */
import type { Cancion, Contenido, Jefe, Nivel } from "@/lib/contenido";
import { logrosConEstado, type LogroConEstado } from "@/lib/logros";
import { estadoZona, ordenZonaActual, type EstadoZona, type Progreso } from "@/lib/progreso";
import { diaDelJefe } from "@/lib/jefes";

/** Un jefe de la zona, con su canción, sus «llaves» y si ya se venció. */
export interface JefeZona {
  jefe: Jefe;
  cancion: Cancion;
  vencido: boolean;
  /** Logros que pide el jefe (`requiere`), con su estado: son las llaves de su puerta. */
  llaves: LogroConEstado[];
  /** La puerta está abierta: ya tienes todas sus llaves (o ya lo venciste). */
  abierto: boolean;
  /** Día del plan en que toca enfrentarlo, si cae dentro de los 90 días. */
  dia?: number;
}

/** Una parada del sendero: una zona y todo lo que se muestra de ella. */
export interface ParadaSendero {
  nivel: Nivel;
  estado: EstadoZona;
  /** Más de una zona por delante de la actual: se muestra «en niebla», sin detalle. */
  lejana: boolean;
  /** Requisitos para pasar, con su estado. */
  requisitos: LogroConEstado[];
  /** Cuántos requisitos están conseguidos. */
  hechos: number;
  /** Jefes de la zona (normalmente uno; la zona 8 tiene dos). */
  jefes: JefeZona[];
}

/**
 * Construye las paradas del sendero, de la zona 0 a la última.
 *
 * @param c Contenido cargado con `cargarContenido()`.
 * @param progreso Logros obtenidos y jefes vencidos del jugador.
 */
export function construirSendero(c: Contenido, progreso: Progreso): ParadaSendero[] {
  const jefesDe = (nivelId: string) => c.jefes.filter((j) => j.data.nivel.id === nivelId);
  const actual = ordenZonaActual(
    c.niveles.map((n) => ({ orden: n.data.orden, jefes: jefesDe(n.id).map((j) => j.id) })),
    progreso.jefesVencidos,
  );

  return c.niveles.map((nivel) => {
    const requisitos = logrosConEstado(c, nivel.data.requisitosParaPasar.map((r) => r.id), progreso.obtenidos);
    return {
      nivel,
      estado: estadoZona(nivel.data.orden, actual),
      lejana: nivel.data.orden > actual + 1,
      requisitos,
      hechos: requisitos.filter((r) => r.estado === "conseguido").length,
      jefes: jefesDe(nivel.id).map((jefe) => {
        const llaves = logrosConEstado(c, jefe.data.requiere.map((r) => r.id), progreso.obtenidos);
        const vencido = progreso.jefesVencidos.has(jefe.id);
        return {
          jefe,
          cancion: c.cancionPorId.get(jefe.data.cancion.id)!,
          vencido,
          llaves,
          abierto: vencido || llaves.every((l) => l.estado === "conseguido"),
          dia: diaDelJefe(c, jefe.id)?.data.numero,
        };
      }),
    };
  });
}

/**
 * Primer requisito de la zona que ya se puede conseguir: el «siguiente paso».
 * @returns `undefined` si no queda ninguno disponible (todos conseguidos o bloqueados).
 */
export function siguientePaso(parada: ParadaSendero): LogroConEstado | undefined {
  return parada.requisitos.find((r) => r.estado === "disponible");
}
