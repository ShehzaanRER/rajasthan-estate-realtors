"use client";

import { Children, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * One card at a time on a phone, the existing grid from `md` up.
 *
 * There is one copy of each card in the DOM: the track is a scroll-snap flex
 * row on mobile and simply becomes the grid at `md`, so nothing is duplicated
 * or hidden. Movement is native scrolling — the arrows scroll the track and
 * the index is read back from the scroll position, so tapping an arrow and
 * swiping stay in agreement.
 *
 * Nothing advances on its own. There is no timer in this file.
 */
function CardSlider({ children, label, gridClassName = "md:grid-cols-2 lg:grid-cols-3" }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  // The track is a plain grid from `md` up, where the index means nothing.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return undefined;
    }

    const readIndex = () => {
      const width = track.clientWidth;
      if (width === 0) {
        return;
      }

      const next = Math.round(track.scrollLeft / width);
      setIndex(Math.min(Math.max(next, 0), count - 1));
    };

    track.addEventListener("scroll", readIndex, { passive: true });
    return () => track.removeEventListener("scroll", readIndex);
  }, [count]);

  const goTo = (next) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const clamped = Math.min(Math.max(next, 0), count - 1);

    // Deliberately instant. Smooth scrolling is not honoured in every engine,
    // and where it is ignored the card stays put while the counter advances —
    // a slider that looks broken. A direct assignment always lands. Swiping
    // still animates, because that is the browser's own gesture.
    track.scrollLeft = clamped * track.clientWidth;
    setIndex(clamped);
  };

  const controlClasses =
    "inline-flex h-11 w-11 items-center justify-center border border-slate-300 text-[#081221] transition-colors duration-200 enabled:hover:border-[#B8862F] enabled:hover:text-[#B8862F] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300";

  return (
    <div>
      <div
        ref={trackRef}
        className={`flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:gap-8 md:overflow-visible ${gridClassName}`}
      >
        {/* Children.toArray guarantees a stable key on every element. */}
        {slides.map((slide) => (
          <div key={slide.key} className="w-full shrink-0 snap-start md:w-auto">
            {slide}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="mt-5 flex items-center gap-4 md:hidden">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label={`Previous ${label}`}
            className={controlClasses}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            aria-label={`Next ${label}`}
            className={controlClasses}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          <p
            aria-live="polite"
            className="ml-auto text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
          >
            {index + 1} / {count}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default CardSlider;
