interface Props {
  /** Nombre de la ruta, sin el prefijo «Ruta». */
  nombre: string;
  /** Color propio de la ruta (de `rutas.json`, en hex). */
  color: string;
}

/**
 * @component ChipRuta
 * Etiqueta de una ruta con su color propio. El color viene de `rutas.json`
 * (es dato, no token de diseño); `color-mix` genera a partir de él el borde y
 * el fondo translúcidos. Sin estado: sirve en Astro y dentro de islas.
 */
export default function ChipRuta({ nombre, color }: Props) {
  return (
    <span
      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      <span class="size-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {nombre}
    </span>
  );
}
