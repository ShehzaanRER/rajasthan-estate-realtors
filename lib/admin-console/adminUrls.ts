import type { Where } from 'payload';

/**
 * Admin-panel URL construction for the console.
 *
 * Everything here takes the admin route prefix as an argument rather than
 * hardcoding `/admin`, because it is configurable (`config.routes.admin`)
 * and the console reads the real value off the sanitized config.
 */

/**
 * Serializes a Payload `Where` into the bracket-notation query string the
 * admin list view parses back (`where[status][equals]=rented`).
 *
 * Payload builds the list view's query by `qs`-parsing the request URL, so
 * a `Where` round-trips through this exactly — including nested `and`/`or`
 * groups (arrays become numeric indices) and `in` (arrays become indexed
 * entries, which the Postgres adapter accepts directly).
 *
 * This is what lets one `Where` be both the count and the link: see
 * `types.ts`.
 */
export function stringifyWhere(where: Where): string {
  const pairs: string[] = [];

  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
      return;
    }

    if (value !== null && typeof value === 'object') {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        walk(nested, `${path}[${encodeURIComponent(key)}]`);
      }
      return;
    }

    pairs.push(`${path}=${encodeURIComponent(String(value))}`);
  };

  walk(where, 'where');

  return pairs.join('&');
}

export function collectionListUrl(
  adminRoute: string,
  collection: string,
  options?: { where?: Where; sort?: string },
): string {
  const query: string[] = [];

  if (options?.where) {
    const serialized = stringifyWhere(options.where);
    if (serialized) {
      query.push(serialized);
    }
  }

  if (options?.sort) {
    query.push(`sort=${encodeURIComponent(options.sort)}`);
  }

  const base = `${adminRoute}/collections/${collection}`;

  return query.length > 0 ? `${base}?${query.join('&')}` : base;
}

export function collectionCreateUrl(adminRoute: string, collection: string): string {
  return `${adminRoute}/collections/${collection}/create`;
}

export function documentUrl(adminRoute: string, collection: string, id: number | string): string {
  return `${adminRoute}/collections/${collection}/${id}`;
}
