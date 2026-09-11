"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { CONTACT_WHATSAPP_NUMBER } from "../lib/siteConfig";
import {
  clearPopupStorageForTesting,
  hasShownThisSession,
  isWithinCooldown,
  markShownThisSession,
  recordDismissal,
  recordEngagement,
} from "../lib/enquiryPopupStorage";

const DELAY_MS = 60000;
const MIN_ENGAGED_TIME_MS = 10000;
const SCROLL_DEPTH_THRESHOLD = 0.65;

/** Matches any WhatsApp or tel: link anywhere on the page — used to detect
 * that the visitor already reached out through an existing CTA, so the
 * popup doesn't pile on with a redundant interruption. */
function isEnquiryCtaLink(href) {
  return typeof href === "string" && (href.startsWith("tel:") || href.includes("wa.me"));
}

const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi Rajasthan Estate Realtors, I'd like some help finding the right property.",
)}`;

function EnquiryPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const suppressed = pathname === "/contact";

  const close = () => {
    setOpen(false);
    recordDismissal();
  };

  const handleEngage = () => {
    recordEngagement();
    setOpen(false);
  };

  // Trigger: whichever comes first — a fixed delay, or meaningful scroll
  // depth reached after a minimum browsing time. Never runs on /contact.
  // Cancelled outright if the visitor already used a WhatsApp/tel CTA
  // elsewhere on the page first — they don't need the popup on top of that.
  useEffect(() => {
    if (suppressed) {
      return undefined;
    }

    // Development-only escape hatch so the popup can be exercised repeatedly
    // without clearing storage by hand: `?popup=now` reveals it immediately,
    // `?popup=reset` clears the gates and lets the normal triggers run.
    // `process.env.NODE_ENV` is inlined at build time, so this branch is
    // stripped from production bundles and the real cooldown behaviour below
    // is untouched.
    let devMode = null;

    if (process.env.NODE_ENV === "development") {
      devMode = new URLSearchParams(window.location.search).get("popup");

      if (devMode === "reset") {
        clearPopupStorageForTesting();
      }
    }

    if (devMode !== "now" && (hasShownThisSession() || isWithinCooldown())) {
      return undefined;
    }

    let scrollListenerActive = false;
    let ctaListenerActive = false;
    const startedAt = Date.now();

    const reveal = () => {
      setOpen(true);
      markShownThisSession();
    };

    const timer = setTimeout(reveal, devMode === "now" ? 0 : DELAY_MS);

    const onScroll = () => {
      if (Date.now() - startedAt < MIN_ENGAGED_TIME_MS) {
        return;
      }

      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const depth = scrollable > 0 ? window.scrollY / scrollable : 0;

      if (depth >= SCROLL_DEPTH_THRESHOLD) {
        cancel();
        reveal();
      }
    };

    const onDocumentClick = (event) => {
      const link = event.target.closest?.("a[href]");
      if (link && isEnquiryCtaLink(link.getAttribute("href"))) {
        recordEngagement();
        cancel();
      }
    };

    function cancel() {
      clearTimeout(timer);
      if (scrollListenerActive) {
        window.removeEventListener("scroll", onScroll);
        scrollListenerActive = false;
      }
      if (ctaListenerActive) {
        document.removeEventListener("click", onDocumentClick, true);
        ctaListenerActive = false;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    scrollListenerActive = true;
    document.addEventListener("click", onDocumentClick, true);
    ctaListenerActive = true;

    return cancel;
  }, [suppressed]);

  // Focus management + Escape to close.
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    previouslyFocused.current = document.activeElement;
    const dialog = dialogRef.current;
    const closeButton = dialog?.querySelector("[data-popup-close]");
    closeButton?.focus();

    const getFocusable = () =>
      dialog
        ? Array.from(
            dialog.querySelectorAll(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }

      if (event.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) {
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  const onBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      close();
    }
  };

  if (suppressed || !open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#081221]/60 p-4 motion-safe:animate-[fadeIn_0.3s_ease-out] sm:items-center"
      onClick={onBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl motion-safe:animate-[popIn_0.3s_ease-out] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="h-px w-10 shrink-0 translate-y-3 bg-[#B8862F]" />
          <button
            type="button"
            data-popup-close
            onClick={close}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#081221]"
          >
            <X size={18} />
          </button>
        </div>

        <h2
          id={headingId}
          className="mt-3 font-serif text-2xl font-medium leading-snug text-[#081221] sm:text-3xl"
        >
          Looking for the right property?
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Tell us what you&apos;re looking for and our team can help you find
          suitable options.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/contact"
            onClick={handleEngage}
            className="flex items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:bg-[#CCA251]"
          >
            <Send size={16} />
            Send an Enquiry
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleEngage}
            className="flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            <MessageCircle size={16} />
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}

export default EnquiryPopup;
