import Link from 'next/link';
import type { ReactNode } from 'react';

type ConsolePanelProps = {
  action?: { href: string; label: string };
  children: ReactNode;
  /** Small count/qualifier shown next to the title, e.g. "6 of 18". */
  meta?: string;
  title: string;
};

/**
 * The one panel shell every console section uses. Visuals come from
 * `.rer-panel` in custom.scss §3 — the same recipe Payload's own cards and
 * the document sheet use — so the console does not introduce a second
 * surface language.
 */
export function ConsolePanel({ action, children, meta, title }: ConsolePanelProps) {
  return (
    <section className="rer-panel rer-console__panel">
      <header className="rer-console__panel-head">
        <h2 className="rer-console__panel-title">
          {title}
          {meta ? <span className="rer-console__panel-meta">{meta}</span> : null}
        </h2>
        {action ? (
          <Link className="rer-console__panel-action" href={action.href}>
            {action.label}
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export default ConsolePanel;
