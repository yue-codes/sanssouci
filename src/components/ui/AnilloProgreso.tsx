interface Props {
  /** De 0 a 1 */
  valor: number;
  etiqueta: string;
  tamano?: number;
}

/** Anillo de progreso en SVG. Sin estado propio: sirve igual en Astro (estático) que dentro de una isla. */
export default function AnilloProgreso({ valor, etiqueta, tamano = 112 }: Props) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, valor));
  return (
    <div class="relative grid place-items-center" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 100 100" class="-rotate-90" width={tamano} height={tamano} role="img" aria-label={`Progreso: ${Math.round(v * 100)} %`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--borde)" stroke-width="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={v === 1 ? "var(--exito)" : "var(--oro)"}
          stroke-width="8" stroke-linecap="round"
          stroke-dasharray={circ}
          stroke-dashoffset={circ * (1 - v)}
          style={{ transition: "stroke-dashoffset 400ms ease, stroke 400ms ease" }}
        />
      </svg>
      <span class="absolute text-center">
        <span class="block font-display text-2xl font-semibold">{Math.round(v * 100)}%</span>
        <span class="block text-[11px] text-tenue">{etiqueta}</span>
      </span>
    </div>
  );
}
