"use client";

import { useState } from "react";
import Image from "next/image";

const MAIN_IMAGE_SIZES = "(min-width: 1024px) 60vw, 100vw";
const THUMB_IMAGE_SIZES = "(min-width: 1024px) 20vw, 50vw";

function PropertyGallery({ images, title }) {
  const validImages = (images ?? []).filter((image) => image?.url);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = activeIndex < validImages.length ? activeIndex : 0;
  const active = validImages[safeIndex];

  if (!validImages.length) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center gap-3 bg-[#081221] sm:h-[520px]">
        <span className="h-px w-10 bg-[#B8862F]" />
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Image coming soon
        </p>
      </div>
    );
  }

  if (validImages.length === 1) {
    return (
      <div>
        <div className="relative h-[420px] overflow-hidden sm:h-[520px] lg:h-[560px]">
          <Image
            src={validImages[0].url}
            alt={validImages[0].alt || title}
            fill
            sizes={MAIN_IMAGE_SIZES}
            quality={85}
            priority
            className="object-cover"
          />
        </div>
        {validImages[0].caption ? (
          <p className="mt-3 text-sm text-slate-500">{validImages[0].caption}</p>
        ) : null}
      </div>
    );
  }

  const thumbs = validImages.filter((_, index) => index !== safeIndex);

  return (
    <div>
      <div className="grid gap-3 lg:grid-cols-[1.7fr_1fr]">
        <div className="relative h-[420px] overflow-hidden sm:h-[520px] lg:h-[560px]">
          <Image
            src={active.url}
            alt={active.alt || title}
            fill
            sizes={MAIN_IMAGE_SIZES}
            quality={85}
            priority={safeIndex === 0}
            loading={safeIndex === 0 ? undefined : "lazy"}
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {thumbs.map((image) => {
            const originalIndex = validImages.indexOf(image);

            return (
              <button
                key={image.url}
                type="button"
                onClick={() => setActiveIndex(originalIndex)}
                className="relative h-[200px] overflow-hidden sm:h-[250px] lg:h-auto lg:min-h-[170px]"
              >
                <Image
                  src={image.url}
                  alt={image.alt || title}
                  fill
                  sizes={THUMB_IMAGE_SIZES}
                  quality={70}
                  loading="lazy"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            );
          })}
        </div>
      </div>

      {active.caption ? (
        <p className="mt-3 text-sm text-slate-500">{active.caption}</p>
      ) : null}
    </div>
  );
}

export default PropertyGallery;
