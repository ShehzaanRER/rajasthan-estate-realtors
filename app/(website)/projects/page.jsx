import { getProjects } from "../../../lib/projects";
import ProjectsListing from "../../../components/projects/ProjectsListing";

const title = "New Projects";
const description =
  "Explore new residential and commercial development projects across Mumbai's Western Suburbs, curated by Rajasthan Estate Realtors.";

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

export default async function ProjectsPage() {
  const projects = await getProjects();

  return <ProjectsListing projects={projects} />;
}
