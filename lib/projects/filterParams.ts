import type { Project } from '../../payload-types';

/** Single source of truth for the project listing URL semantics. */

export type ProjectTypeParam = 'residential' | 'commercial';
export type ProjectStatusParam = 'upcoming' | 'under-construction' | 'ready-to-move';

export type ProjectFilters = {
  projectType: ProjectTypeParam | null;
  status: ProjectStatusParam | null;
};

const TYPE_PARAMS: ProjectTypeParam[] = ['residential', 'commercial'];
const STATUS_PARAMS: ProjectStatusParam[] = ['upcoming', 'under-construction', 'ready-to-move'];

export const PROJECT_TYPE_LABELS: Record<ProjectTypeParam, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatusParam, string> = {
  upcoming: 'Upcoming',
  'under-construction': 'Under Construction',
  'ready-to-move': 'Ready to Move',
};

export const PROJECT_STATUS_OPTIONS = STATUS_PARAMS.map((value) => ({
  value,
  label: PROJECT_STATUS_LABELS[value],
}));

function readParam(params: Record<string, string | string[] | undefined>, key: string): string | null {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function parseProjectFilters(
  params: Record<string, string | string[] | undefined>,
): ProjectFilters {
  const type = readParam(params, 'type');
  const status = readParam(params, 'status');

  return {
    projectType: TYPE_PARAMS.includes(type as ProjectTypeParam) ? (type as ProjectTypeParam) : null,
    status: STATUS_PARAMS.includes(status as ProjectStatusParam)
      ? (status as ProjectStatusParam)
      : null,
  };
}

export function serializeProjectFilters(filters: Partial<ProjectFilters>): string {
  const params = new URLSearchParams();

  if (filters.projectType) {
    params.set('type', filters.projectType);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  return params.toString();
}

export function projectsHref(filters: Partial<ProjectFilters>): string {
  const query = serializeProjectFilters(filters);
  return query ? `/projects?${query}` : '/projects';
}

/** The project status values that are valid as a CMS query. */
export function toCmsProjectStatus(status: ProjectStatusParam | null): Project['status'] | undefined {
  return status ?? undefined;
}

export function describeProjectFilters(filters: ProjectFilters): string {
  const type = filters.projectType ? PROJECT_TYPE_LABELS[filters.projectType] : null;
  const status = filters.status ? PROJECT_STATUS_LABELS[filters.status] : null;

  if (type && status) {
    return `${status} ${type.toLowerCase()} projects`;
  }

  if (type) {
    return `${type} projects`;
  }

  if (status) {
    return `${status} projects`;
  }

  return 'All projects';
}
