import PartnerLogoCard from "./PartnerLogoCard";

/**
 * Enough tiles to fill a wide desktop row before the loop seam would come
 * back into view. With fewer partners than this the sequence is repeated
 * until it clears the bar, so three partners still read as a moving strip
 * rather than three cards stranded next to a gap.
 */
const MIN_TILES_PER_SEQUENCE = 8;

/** Seconds each tile takes to cross the track. Sets the speed, not the pace. */
const SECONDS_PER_TILE = 4;

/**
 * "Official Channel Partners for" — a short trust strip that continues the
 * legacy story directly above it, so it stays deliberately low: one heading
 * and one row of logos.
 *
 * The movement is a CSS marquee rather than a carousel library. The track
 * holds the logo sequence twice and slides exactly one sequence width
 * (-50%) before restarting, which puts the second copy precisely where the
 * first began — the restart is invisible. Nothing here needs client-side
 * JavaScript, so the section stays a server component and adds no bundle.
 *
 * No arrows: there is nothing to step through. The strip is a continuous
 * ribbon, not a set of slides, and RER's existing arrow treatment
 * (CardSlider) is built around a discrete index with a "3 / 7" counter,
 * which would be meaningless here. It does not pause on hover either: the
 * cards are not interactive, so there is nothing to stop and read for.
 */
function OfficialChannelPartners({ partners }) {
  if (!partners || partners.length === 0) {
    return null;
  }

  const repeats = Math.max(1, Math.ceil(MIN_TILES_PER_SEQUENCE / partners.length));
  const sequence = Array.from({ length: repeats }, () => partners).flat();
  const duration = `${sequence.length * SECONDS_PER_TILE}s`;

  return (
    <section
      id="channel-partners"
      aria-labelledby="channel-partners-heading"
      className="overflow-hidden bg-rer-sand py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">

        <div className="flex select-none items-center justify-center gap-4 sm:gap-6">
          {/* Decorative rules, hidden from assistive technology. They shrink
              on narrow screens rather than pushing the heading to two lines. */}
          <span aria-hidden="true" className="h-px w-8 max-w-[15vw] bg-[#B8862F]/45 sm:w-16" />

          <h2
            id="channel-partners-heading"
            className="text-center font-serif text-2xl font-medium tracking-tight text-[#081221] sm:text-3xl"
          >
            <span className="text-[#B8862F]">Official</span> Channel Partners for
          </h2>

          <span aria-hidden="true" className="h-px w-8 max-w-[15vw] bg-[#B8862F]/45 sm:w-16" />
        </div>

      </div>

      {/* Full-bleed on purpose: the logos should run off both edges of the
          viewport rather than stopping at the content gutter. `overflow-hidden`
          on the section is what keeps that off the page's scroll width. */}
      <div className="partner-marquee-viewport relative mt-6 sm:mt-8">
        <div
          className="flex w-max animate-partner-marquee"
          style={{ "--partner-marquee-duration": duration }}
        >
          {/* Two identical halves, each exactly half the track's width, so
              sliding one full half (-50%) lands the second copy precisely
              where the first started and the wrap is invisible. Spacing is a
              per-tile right margin rather than a flex `gap`, because a gap
              between the halves would make them unequal and re-introduce the
              seam. The second half is scenery: hidden from assistive
              technology and out of the tab order. */}
          <div className="flex">
            {sequence.map((partner, index) => (
              <div key={`a-${partner.id}-${index}`} className="pr-4 sm:pr-5 lg:pr-6">
                <PartnerLogoCard partner={partner} />
              </div>
            ))}
          </div>

          <div className="flex" aria-hidden="true" inert>
            {sequence.map((partner, index) => (
              <div key={`b-${partner.id}-${index}`} className="pr-4 sm:pr-5 lg:pr-6">
                <PartnerLogoCard partner={partner} />
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

export default OfficialChannelPartners;
