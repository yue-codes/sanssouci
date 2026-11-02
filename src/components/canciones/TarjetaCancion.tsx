import { Headphones, FileMusic, Music2, MapPin } from "lucide-preact";
import type { CancionResumen } from "@/lib/canciones";
import { miniaturaYoutube } from "@/lib/youtube";
import ChipRuta from "./ChipRuta";
import Dificultad from "./Dificultad";

interface Props {
  /** Resumen de la obra (ver `resumirCancion`). */
  cancion: CancionResumen;
  /** Muestra la zona de la obra. Útil en el catálogo; sobra dentro de la página de una zona. */
  conZona?: boolean;
}

/**
 * @component TarjetaCancion
 * Tarjeta de una obra del catálogo: miniatura, ruta, dificultad, versiones y,
 * si se pide, su zona. Marca las obras que son «reto de oído» (sin partitura).
 * Sin estado: sirve en páginas de Astro y dentro de la isla del catálogo.
 */
export default function TarjetaCancion({ cancion: s, conZona = false }: Props) {
  return (
    <a href={`/canciones/${s.id}`} class="tarjeta group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-acento/50">
      <div class="relative aspect-video overflow-hidden bg-superficie-2">
        <img
          src={miniaturaYoutube(s.youtubeId)}
          alt=""
          loading="lazy"
          class="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-superficie via-transparent" />
        {s.retoDeOido && (
          <span class="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-resalte px-2.5 py-1 text-xs font-semibold text-fondo">
            <Headphones size={12} aria-hidden="true" /> Reto de oído
          </span>
        )}
      </div>
      <div class="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 class="text-lg font-semibold leading-snug">{s.titulo}</h3>
          <p class="text-sm text-tenue">{s.obra}</p>
        </div>
        <div class="mt-auto flex flex-wrap items-center justify-between gap-2">
          <ChipRuta nombre={s.ruta.nombre} color={s.ruta.color} />
          <Dificultad valor={s.dificultad} />
        </div>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-borde pt-3 text-xs text-tenue">
          {conZona && (
            <span class="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" /> Zona {s.zona.orden}</span>
          )}
          <span class="inline-flex items-center gap-1">
            <Music2 size={13} aria-hidden="true" /> {s.versiones} {s.versiones === 1 ? "versión" : "versiones"}
          </span>
          {s.conPartitura && (
            <span class="inline-flex items-center gap-1"><FileMusic size={13} aria-hidden="true" /> partitura</span>
          )}
        </p>
      </div>
    </a>
  );
}
