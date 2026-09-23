import Link from 'next/link';
import type { ConsoleMetric, MetricGroup } from '../../../lib/admin-console';
import { ConsolePanel } from './ConsolePanel';

/**
 * Live database counts. Every tile is a link to the property/project list
 * filtered by exactly the `Where` that produced its number, so clicking
 * "12 Rented" opens the twelve rented properties and nothing else.
 *
 * The per-status tiles are generated from the collection's own `status`
 * field options (see lib/admin-console/selectOptions.ts): this section
 * cannot show a status the schema does not define, and a status added to
 * the schema appears here with no change to this file.
 */
function MetricTile({ metric }: { metric: ConsoleMetric }) {
  return (
    <Link
      className={`rer-console__tile${metric.emphasis ? ' rer-console__tile--emphasis' : ''}`}
      href={metric.href}
    >
      <span className="rer-console__tile-count">{metric.count}</span>
      <span className="rer-console__tile-label">{metric.label}</span>
    </Link>
  );
}

export function ConsoleOverview({ groups, library }: { groups: MetricGroup[]; library: ConsoleMetric[] }) {
  return (
    <div className="rer-console__overview">
      {groups.map((group) => (
        <ConsolePanel
          action={{ href: group.href, label: 'Open list' }}
          key={group.key}
          title={group.title}
        >
          <div className="rer-console__tiles">
            {group.metrics.map((metric) => (
              <MetricTile key={metric.key} metric={metric} />
            ))}
          </div>
        </ConsolePanel>
      ))}

      <ConsolePanel title="Library and leads">
        <div className="rer-console__tiles rer-console__tiles--wide">
          {library.map((metric) => (
            <MetricTile key={metric.key} metric={metric} />
          ))}
        </div>
      </ConsolePanel>
    </div>
  );
}

export default ConsoleOverview;
