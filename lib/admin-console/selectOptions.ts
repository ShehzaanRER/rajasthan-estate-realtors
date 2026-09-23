import type { Field, Payload } from 'payload';

export type SelectOption = { value: string; label: string };

/**
 * Reads a select field's own `options` straight out of the sanitized config.
 *
 * The console's status tiles are generated from this rather than from a list
 * kept here, which is what makes "do not invent statuses" structural instead
 * of a rule someone has to remember: a status added to
 * `collections/Properties.ts` shows up on the dashboard by itself, and a
 * status that does not exist in the schema cannot be rendered at all.
 *
 * The same reasoning as `StatusBadge`, which reads its labels from the field
 * it is rendering rather than keeping a second copy of the vocabulary.
 */
function resolveLabel(label: unknown, value: string): string {
  if (typeof label === 'string') {
    return label;
  }

  if (label !== null && typeof label === 'object') {
    const english = (label as Record<string, unknown>).en;
    if (typeof english === 'string') {
      return english;
    }
  }

  return value;
}

function findSelectField(fields: Field[], name: string): Field | null {
  for (const field of fields) {
    if ('name' in field && field.name === name && field.type === 'select') {
      return field;
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findSelectField(field.fields, name);
      if (nested) {
        return nested;
      }
    }

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const nested = findSelectField(tab.fields, name);
        if (nested) {
          return nested;
        }
      }
    }
  }

  return null;
}

export function getSelectOptions(payload: Payload, collectionSlug: string, fieldName: string): SelectOption[] {
  const collection = payload.config.collections.find(({ slug }) => slug === collectionSlug);

  if (!collection) {
    return [];
  }

  const field = findSelectField(collection.fields, fieldName);

  if (!field || field.type !== 'select') {
    return [];
  }

  return field.options.map((option) => {
    if (typeof option === 'string') {
      return { value: option, label: option };
    }

    return { value: String(option.value), label: resolveLabel(option.label, String(option.value)) };
  });
}

/** Human label for one raw status value, falling back to the raw value. */
export function labelForValue(options: SelectOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}
