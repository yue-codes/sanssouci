import { rarezaDe } from "./rareza";

interface Props {
  /** Dificultad de 1 a 10. */
  valor: number;
}

/**
 * @component Dificultad
 * Dificultad de 1 a 10 como diez barritas, con el número al lado. Las barritas
 * llenas toman el color de la rareza de la obra (ver `rareza.ts`).
 * Sin estado: sirve en Astro y dentro de islas.
 */
export default function Dificultad({ valor }: Props) {
  const { fondo } = rarezaDe(valor);
  return (
    <span class="inline-flex items-center gap-2" title={`Dificultad ${valor} de 10`}>
      <span class="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} class={`h-2.5 w-1 rounded-[1px] ${i < valor ? fondo : "bg-borde"}`} />
        ))}
      </span>
      <span class="font-mono text-[0.625rem] text-tenue tabular-nums">
        <span class="sr-only">Dificultad </span>
        {valor}/10
      </span>
    </span>
  );
}
