'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * A synchronized horizontal scrollbar shown above the list table, mirroring
 * the native one at the bottom of `.table` — Payload's list-table container,
 * which is the actual `overflow: auto` scroll region (see custom.scss). This
 * is registered via `admin.components.beforeListTable` on Properties and
 * Projects, which renders it as the table's immediate sibling
 * (@payloadcms/ui's views/List renders
 * `[..., BeforeListTable, <div class="collection-list__tables">, ...]`), so
 * it can find the real table by walking the DOM rather than needing a portal
 * or a rewrite of Payload's own list markup.
 *
 * Deliberately DOM-driven (refs + native scroll listeners), not React state
 * for scroll position — scrolling stays 1:1 with the pointer and never waits
 * on a render.
 */
export function TableScrollSync() {
  const trackRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const spacer = spacerRef.current;
    if (!track || !spacer) {
      return;
    }

    let tableWrap: HTMLElement | null = null;
    let tableEl: HTMLTableElement | null = null;
    let syncing = false;

    function onTableScroll() {
      if (syncing || !tableWrap) {
        return;
      }
      syncing = true;
      track!.scrollLeft = tableWrap.scrollLeft;
      syncing = false;
    }

    function onTrackScroll() {
      if (syncing || !tableWrap) {
        return;
      }
      syncing = true;
      tableWrap.scrollLeft = track!.scrollLeft;
      syncing = false;
    }

    const resizeObserver = new ResizeObserver(() => measure());

    function findTable() {
      // Only the immediately-following table region — a `group-by` listing
      // can render more than one `.table`, and this stays scoped to the
      // first rather than guessing which one the user is looking at.
      const wrap = track!.closest('.collection-list__wrap');
      const nextWrap = wrap?.querySelector<HTMLElement>('.collection-list__tables .table') ?? null;

      if (nextWrap !== tableWrap) {
        tableWrap?.removeEventListener('scroll', onTableScroll);
        resizeObserver.disconnect();
        tableWrap = nextWrap;
        tableEl = tableWrap?.querySelector('table') ?? null;
        tableWrap?.addEventListener('scroll', onTableScroll, { passive: true });
        if (tableWrap) {
          resizeObserver.observe(tableWrap);
        }
        if (tableEl) {
          resizeObserver.observe(tableEl);
        }
      } else {
        tableEl = tableWrap?.querySelector('table') ?? null;
      }
    }

    function measure() {
      if (!tableWrap || !tableEl) {
        setHasOverflow(false);
        return;
      }
      const scrollWidth = tableEl.scrollWidth;
      const clientWidth = tableWrap.clientWidth;
      spacer!.style.width = `${scrollWidth}px`;
      setHasOverflow(scrollWidth > clientWidth + 1);
    }

    findTable();
    measure();

    track.addEventListener('scroll', onTrackScroll, { passive: true });
    window.addEventListener('resize', measure);

    // Column selector changes, filters, and pagination all re-render the
    // table subtree (a different element, not just different content), so
    // re-resolve which `.table` is current whenever that subtree changes.
    const tablesRegion = track.closest('.collection-list__wrap')?.querySelector('.collection-list__tables');
    const mutationObserver = new MutationObserver(() => {
      findTable();
      measure();
    });
    if (tablesRegion) {
      mutationObserver.observe(tablesRegion, { childList: true, subtree: true });
    }

    return () => {
      track.removeEventListener('scroll', onTrackScroll);
      window.removeEventListener('resize', measure);
      tableWrap?.removeEventListener('scroll', onTableScroll);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={trackRef}
      className="rer-table-scroll-sync"
      data-has-overflow={hasOverflow ? 'true' : 'false'}
      role="presentation"
      aria-hidden="true"
    >
      <div ref={spacerRef} className="rer-table-scroll-sync__spacer" />
    </div>
  );
}

export default TableScrollSync;
