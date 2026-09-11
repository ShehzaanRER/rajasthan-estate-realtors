"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * The footer's content groups collapse on a phone and are plain headings from
 * `md` up, so the desktop and tablet footer is unchanged. One markup tree: the
 * button is hidden above `md` and the panel is unconditionally shown there,
 * rather than rendering the group twice.
 */
function FooterAccordion({ title, id, children }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div id={id} className="border-b border-white/10 md:border-0">

      <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-12 w-full items-center justify-between gap-4 py-3 text-left uppercase tracking-[0.3em] md:hidden"
        >
          {title}

          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <span className="hidden md:mb-4 md:block">{title}</span>

      </h4>

      <div
        id={panelId}
        className={`${open ? "block" : "hidden"} pb-5 md:block md:pb-0`}
      >
        {children}
      </div>

    </div>
  );
}

export default FooterAccordion;
