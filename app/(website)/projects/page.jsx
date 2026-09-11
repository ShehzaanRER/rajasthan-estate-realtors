import {
  getProjects,
  parseProjectFilters,
  toCmsProjectStatus,
} from "../../../lib/projects";
import ProjectsListing from "../../../components/projects/ProjectsListing";

const title = "Projects";
const description =
  "Explore residential and commercial development projects across Mumbai's Western Suburbs, curated by Rajasthan Estate Realtors.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title,
    description,
    url: "/projects",
  },
};

export default async function ProjectsPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const filters = parseProjectFilters(params);

  const projects = await getProjects({
    projectType: filters.projectType ?? undefined,
    status: toCmsProjectStatus(filters.status),
  });

  return <ProjectsListing projects={projects} filters={filters} />;
}
