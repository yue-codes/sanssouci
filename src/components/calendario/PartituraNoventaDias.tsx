import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { animate, inView, stagger } from "motion";
import { componerPartitura, type DiaPartitura, type NotaColocada } from "@/lib/partitura";
import { fechaCorta } from "@/lib/fechas";

interface Props {
  /** Los días del plan como datos planos (ver `DiaPartitura`). */
  dias: DiaPartitura[];
  /** Número de día de hoy (puede quedar fuera de 1–90). */
  hoy: number;
  /** Números de los días completados (progreso real). Sin él, la portada no dice qué se hizo. */
  hechos?: number[];
}

/** Texto del estado de una nota, para el detalle y los lectores de pantalla. */
const TEXTO_ESTADO: Record<NotaColocada["estado"], string> = {
  hoy: "hoy",
  hecha: "hecha",
  pasada: "ya pasó",
  pendiente: "pendiente",
};

/** Leyenda bajo la partitura: «hecha» solo con progreso real; «ya pasó», solo sin él. */
const LEYENDA: { texto: string; clase?: string; silencio?: boolean }[] = [
  { texto: "hoy", clase: "fill-acento stroke-acento" },
  { texto: "hecha", clase: "fill-exito stroke-exito" },
  { texto: "ya pasó", clase: "fill-texto/45 stroke-texto/45" },
  { texto: "sesión sin flauta", clase: "fill-fondo stroke-texto/70" },
  { texto: "sesión con flauta", clase: "fill-fondo stroke-secundario" },
  { texto: "jefe", clase: "fill-fondo stroke-peligro" },
  { texto: "descanso", silencio: true },
];

/** Colores de cada nota según su estado y fase (clases de Tailwind para SVG). */
function colorNota(n: NotaColocada): { cabeza: string; plica: string; hueca: boolean } {
  if (n.estado === "hoy") return { cabeza: "fill-acento stroke-acento", plica: "stroke-acento", hueca: false };
  if (n.jefe) return { cabeza: n.estado === "hecha" ? "fill-peligro stroke-peligro" : "fill-fondo stroke-peligro", plica: "stroke-peligro", hueca: n.estado !== "hecha" };
  if (n.estado === "hecha") return { cabeza: "fill-exito stroke-exito", plica: "stroke-exito/70", hueca: false };
  if (n.estado === "pasada") return { cabeza: "fill-texto/45 stroke-texto/45", plica: "stroke-texto/30", hueca: false };
  return n.conFlauta
    ? { cabeza: "fill-fondo stroke-secundario", plica: "stroke-secundario/55", hueca: true }
    : { cabeza: "fill-fondo stroke-texto/70", plica: "stroke-texto/40", hueca: true };
}

/** Frase completa de un día, para el anuncio de los lectores de pantalla. */
function describir(n: NotaColocada): string {
  if (n.descanso) return `Día ${n.numero}, ${fechaCorta(n.fecha)}: descanso.`;
  return `Día ${n.numero}, ${fechaCorta(n.fecha)}: ${n.titulo}.${n.jefe ? ` Jefe: ${n.jefe}.` : ""} ${TEXTO_ESTADO[n.estado]}.`;
}

/**
 * @component PartituraNoventaDias (isla: `client:load`)
 * Los 90 días del plan como una partitura: cada sesión es una nota, cada descanso
 * un silencio, cada jefe una nota con calderón y doble barra, y cada semana un compás.
 * La melodía sube a lo largo del plan.
 *
 * Interacción: al pasar el ratón (o recorrer con las flechas del teclado) el día
 * se señala y su detalle aparece en la barra de abajo (que, sin nada señalado,
 * muestra hoy); con clic o Enter se abre su página. Al entrar en pantalla, el
 * pentagrama se traza y las notas se escriben una a una (con motion), salvo que el
 * sistema pida menos movimiento.
 *
 * La geometría sale de `componerPartitura` (función pura en `src/lib/partitura.ts`):
 * el componente solo pinta.
 */
export default function PartituraNoventaDias({ dias, hoy, hechos }: Props) {
  const p = componerPartitura(dias, hoy, hechos ? new Set(hechos) : undefined);
  const activo = useSignal<number | null>(null);
  const figura = useRef<HTMLDivElement>(null);
  const desplazable = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  const notaActiva = activo.value === null ? undefined : p.notas.find((n) => n.numero === activo.value);
  const primero = p.notas[0]?.numero ?? 1;
  const ultimo = p.notas[p.notas.length - 1]?.numero ?? 90;

  useEffect(() => {
    // En pantallas estrechas la partitura se desplaza: deja «hoy» a la vista.
    const caja = desplazable.current;
    const nHoy = p.notas.find((n) => n.estado === "hoy");
    if (caja && nHoy && caja.scrollWidth > caja.clientWidth) {
      caja.scrollLeft = (nHoy.x / p.ancho) * caja.scrollWidth - caja.clientWidth / 3;
    }

    // Animación de entrada: solo si <html> tiene `movimiento` (ver Base.astro).
    if (!document.documentElement.classList.contains("movimiento") || !figura.current || !svg.current) return;
    const lienzo = svg.current;
    return inView(figura.current, () => {
      animate(lienzo.querySelectorAll(".partitura-linea"), { strokeDashoffset: [p.ancho, 0] }, { duration: 1.4, delay: stagger(0.08), ease: [0.6, 0, 0.2, 1] });
      animate(lienzo.querySelectorAll(".partitura-nota"), { opacity: [0, 1], y: [-10, 0] }, { duration: 0.5, delay: stagger(0.014, { startDelay: 0.6 }), ease: [0.2, 0.7, 0.2, 1] });
      animate(lienzo.querySelectorAll(".partitura-marca"), { opacity: [0, 1] }, { duration: 0.8, delay: stagger(0.15, { startDelay: 1.6 }) });
    });
  }, []);

  function abrir(numero: number) {
    location.href = `/dias/${numero}`;
  }

  function teclado(e: KeyboardEvent) {
    const actual = activo.value ?? (hoy >= primero && hoy <= ultimo ? hoy : primero);
    const destino = { ArrowRight: actual + 1, ArrowLeft: actual - 1, Home: primero, End: ultimo }[e.key];
    if (destino !== undefined) {
      e.preventDefault();
      activo.value = Math.min(ultimo, Math.max(primero, destino));
    } else if (e.key === "Enter" && activo.value !== null) {
      abrir(activo.value);
    } else if (e.key === "Escape") {
      activo.value = null;
    }
  }

  const detalle = notaActiva ?? p.notas.find((n) => n.estado === "hoy") ?? p.notas[0];

  return (
    <div ref={figura}>
      <div
        ref={desplazable}
        class="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0"
        data-lenis-prevent-wheel=""
      >
        <div
          class="relative min-w-[46rem] cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento"
          tabIndex={0}
          role="group"
          aria-label={`Partitura de los ${p.notas.length} días. Usa las flechas izquierda y derecha para recorrer los días y Enter para abrir uno.`}
          onKeyDown={teclado}
          onFocus={() => activo.value ??= hoy >= primero && hoy <= ultimo ? hoy : primero}
          onBlur={() => (activo.value = null)}
          onMouseLeave={() => (activo.value = null)}
        >
          <svg ref={svg} viewBox={`0 0 ${p.ancho} ${p.alto}`} class="block h-auto w-full overflow-visible" aria-hidden="true">
            {p.sistemas.map((sis, i) => (
              <g key={i}>
                {/* Pentagrama del sistema */}
                {sis.lineas.map((y) => (
                  <line
                    key={y}
                    class="partitura-linea stroke-texto/20 in-[.movimiento]:[stroke-dashoffset:var(--largo)]"
                    style={`--largo:${p.ancho};stroke-dasharray:${p.ancho}`}
                    x1={sis.x0} x2={sis.x1} y1={y} y2={y} stroke-width={1}
                  />
                ))}
                <line x1={sis.x0} x2={sis.x0} y1={sis.lineas[0]} y2={sis.lineas[4]} class="stroke-texto/40" />
                <line x1={sis.x1} x2={sis.x1} y1={sis.lineas[0]} y2={sis.lineas[4]} class="stroke-texto/25" />
                {/* Número de compás al inicio de cada renglón (salvo el primero, como en las partituras impresas). */}
                {i > 0 && (
                  <text x={sis.x0 - 4} y={sis.lineas[0] - 6} text-anchor="end" class="fill-tenue font-mono text-[9px]">{sis.compas}</text>
                )}
              </g>
            ))}

            {/* Barras de compás (semanas) */}
            {p.barras.map((b) => {
              const l = p.sistemas[b.sistema].lineas;
              return <line key={`${b.sistema}-${b.x}`} x1={b.x} x2={b.x} y1={l[0]} y2={l[4]} class="stroke-texto/25" />;
            })}
            {/* Doble barra tras cada jefe */}
            {p.barrasJefe.map((b) => {
              const l = p.sistemas[b.sistema].lineas;
              return (
                <g key={`${b.sistema}-${b.x}`} class="stroke-peligro">
                  <line x1={b.x - 3} x2={b.x - 3} y1={l[0]} y2={l[4]} stroke-width={1} />
                  <line x1={b.x} x2={b.x} y1={l[0]} y2={l[4]} stroke-width={3} />
                </g>
              );
            })}

            {/* Llegada de la flauta */}
            {p.flauta && (() => {
              const l = p.sistemas[p.flauta.sistema].lineas;
              return (
                <g class="partitura-marca in-[.movimiento]:opacity-0">
                  <line x1={p.flauta.x} x2={p.flauta.x} y1={l[0] - 8} y2={l[4] + 40} class="stroke-secundario/70" stroke-dasharray="3 4" />
                  <text x={p.flauta.x + 6} y={l[4] + 38} class="fill-secundario font-mono text-[9px]">llega la flauta</text>
                </g>
              );
            })()}

            {/* Resalte de la columna activa */}
            {notaActiva && (() => {
              const l = p.sistemas[notaActiva.sistema].lineas;
              return (
                <rect
                  x={notaActiva.x - notaActiva.anchoColumna / 2}
                  y={l[0] - 46}
                  width={notaActiva.anchoColumna}
                  height={l[4] - l[0] + 96}
                  rx={2}
                  class="fill-texto/[0.06]"
                />
              );
            })()}

            {/* Notas y silencios */}
            {p.notas.map((n) => {
              const enfocada = n.numero === activo.value;
              const l = p.sistemas[n.sistema].lineas;
              const zona = (
                <rect
                  x={n.x - n.anchoColumna / 2} y={l[0] - 46} width={n.anchoColumna} height={l[4] - l[0] + 96}
                  fill="transparent" onMouseEnter={() => (activo.value = n.numero)} onClick={() => abrir(n.numero)}
                />
              );
              if (n.descanso) {
                const cy = l[2];
                return (
                  <g key={n.numero} class="partitura-nota in-[.movimiento]:opacity-0">
                    {/* Silencio de negra, estilizado */}
                    <path
                      d={`M${n.x - 2.4} ${cy - 15} l5.2 7 q-4.6 3.6 -0.9 8 l3.4 4.2 q-6.4 -2.8 -5 4.6 q-4.2 -4.2 1.4 -5.3`}
                      class={enfocada ? "stroke-acento" : "stroke-tenue/60"}
                      fill="none" stroke-width={1.9} stroke-linecap="round" stroke-linejoin="round"
                    />
                    {zona}
                  </g>
                );
              }
              const c = colorNota(n);
              const xPlica = n.plicaArriba ? n.x + 5.3 : n.x - 5.3;
              return (
                <g key={n.numero} class="partitura-nota in-[.movimiento]:opacity-0">
                  {n.adicionales.map((y) => (
                    <line key={y} x1={n.x - 9.5} x2={n.x + 9.5} y1={y} y2={y} class="stroke-texto/35" />
                  ))}
                  {n.estado === "hoy" && (
                    <circle cx={n.x} cy={n.y} r={11} class="animate-latido fill-none stroke-acento [transform-box:fill-box] [transform-origin:center]" />
                  )}
                  <line x1={xPlica} x2={xPlica} y1={n.y} y2={n.plicaArriba ? n.y - 34 : n.y + 34} class={c.plica} stroke-width={1.3} />
                  <ellipse
                    cx={0} cy={0} rx={6.1} ry={4.5}
                    transform={`translate(${n.x} ${n.y}) rotate(-20)${enfocada ? " scale(1.35)" : ""}`}
                    class={c.cabeza}
                    stroke-width={c.hueca ? 1.7 : 1}
                  />
                  {n.estado === "hoy" && (
                    <text x={n.x} y={l[0] - 12} text-anchor="middle" class="fill-acento font-mono text-[9.5px] font-medium">hoy</text>
                  )}
                  {n.jefe && (
                    <g class="fill-peligro">
                      {/* Calderón: «sostén aquí» */}
                      <path d={`M${n.x - 8} ${l[0] - 10} a8 8 0 0 1 16 0`} class="fill-none stroke-peligro" stroke-width={1.7} />
                      <circle cx={n.x} cy={l[0] - 12.5} r={1.8} />
                      <text x={n.anclaEtiqueta === "end" ? n.x + 6 : n.x} y={l[0] - 26} text-anchor={n.anclaEtiqueta} class="font-mono text-[9.5px]">{n.jefe}</text>
                    </g>
                  )}
                  {zona}
                </g>
              );
            })}
          </svg>

        </div>
      </div>

      {/* Detalle: el día señalado o, si no hay ninguno, hoy. Fuera de la zona desplazable para que nunca se recorte. */}
      {detalle && (
        <div class="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-borde pt-4">
          <p class="font-mono text-[0.6875rem] tracking-wide text-tenue uppercase tabular-nums">
            Día {detalle.numero} · {fechaCorta(detalle.fecha)} ·{" "}
            <span class={detalle.estado === "hoy" ? "text-acento" : detalle.estado === "hecha" ? "text-exito" : detalle.jefe ? "text-peligro" : ""}>
              {detalle.descanso ? "descanso" : TEXTO_ESTADO[detalle.estado]}
            </span>
          </p>
          <p class="order-last min-w-0 basis-full font-display text-2xl leading-tight sm:order-none sm:basis-auto sm:flex-1">
            {detalle.descanso ? "Descanso" : detalle.titulo}
            {detalle.jefe && <span class="text-peligro"> · {detalle.jefe}</span>}
          </p>
          {!detalle.descanso && (
            <a href={`/dias/${detalle.numero}`} class="enlace-flecha">
              Abrir el día <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      )}
      <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.625rem] text-tenue uppercase" aria-label="Leyenda">
        {LEYENDA.filter((l) => (hechos ? l.texto !== "ya pasó" : l.texto !== "hecha")).map((l) => (
          <li key={l.texto} class="flex items-center gap-2">
            <svg viewBox="-7 -6 14 12" class="h-3 w-3.5" aria-hidden="true">
              {l.silencio
                ? <path d="M-1.5 -5 l3 3.6 q-2.6 2 -0.5 4.4 l2 2.2" class="fill-none stroke-tenue" stroke-width={1.4} stroke-linecap="round" />
                : <ellipse rx={5} ry={3.6} transform="rotate(-20)" class={l.clase} stroke-width={1.5} />}
            </svg>
            {l.texto}
          </li>
        ))}
      </ul>
      <p class="sr-only" aria-live="polite">{notaActiva ? describir(notaActiva) : ""}</p>
    </div>
  );
}
