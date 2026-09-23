import Link from 'next/link';
import type { AttentionIssue } from '../../../lib/admin-console';
import { ConsolePanel } from './ConsolePanel';

/**
 * Data-quality issues, each counted from the same `Where` its "View" link
 * opens. Issues with a count of nothing are not dropped silently — they are
 * summarised underneath, so the panel shows what is checked as well as what
 * is wrong.
 *
 * Ordering is severity first (gaps that damage a public listing or block
 * renewal follow-up), then count, so the top row is always the most
 * consequential rather than merely the largest.
 */
function sortIssues(issues: AttentionIssue[]): AttentionIssue[] {
  return [...issues].sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'high' ? -1 : 1;
    }

    return b.count - a.count;
  });
}

export function ConsoleAttention({
  clearChecks,
  issues,
}: {
  clearChecks: AttentionIssue[];
  issues: AttentionIssue[];
}) {
  const sorted = sortIssues(issues);

  return (
    <ConsolePanel
      meta={`${issues.length} of ${issues.length + clearChecks.length} checks`}
      title="Needs attention"
    >
      {sorted.length === 0 ? (
        <p className="rer-console__empty">
          Every check passes. Nothing is missing across properties and projects.
        </p>
      ) : (
        <ul className="rer-console__issues">
          {sorted.map((issue) => (
            <li key={issue.key}>
              <Link className="rer-console__issue" href={issue.href}>
                <span
                  className={`rer-console__issue-count rer-console__issue-count--${issue.severity}`}
                >
                  {issue.count}
                </span>
                <span className="rer-console__issue-body">
                  <span className="rer-console__issue-label">{issue.label}</span>
                  <span className="rer-console__issue-detail">{issue.detail}</span>
                </span>
                <span className="rer-console__issue-go" aria-hidden="true">
                  View
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {clearChecks.length > 0 ? (
        <p className="rer-console__cleared">
          <span className="rer-console__cleared-label">Clear</span>
          {clearChecks.map((check) => check.label).join(' · ')}
        </p>
      ) : null}
    </ConsolePanel>
  );
}

export default ConsoleAttention;
