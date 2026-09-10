import { notFound } from "next/navigation";
import ProjectDetail from "../../../../components/projects/ProjectDetail";
import { getProjectBySlug } from "../../../../lib/projects";
import { SITE_URL } from "../../../../lib/siteConfig";

function toAbsoluteUrl(url) {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

function metaDescription(project) {
  if (project.descriptionText) {
    if (project.descriptionText.length > 160) {
      return `${project.descriptionText.slice(0, 157).trim()}...`;
    }

    return project.descriptionText;
  }

  return `${project.name} by ${project.developer} in ${project.location.locationDisplay}.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(typeof slug === "string" ? slug : "");

  if (!project) {
    return {
      title: "Project",
      robots: { index: false, follow: false },
    };
  }

  const title = `${project.name} by ${project.developer} in ${project.location.locationDisplay}`;
  const description = metaDescription(project);
  const canonicalPath = `/projects/${project.slug}`;
  const image = project.featuredImage;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      images: image
        ? [
            {
              url: image.url,
              width: image.width ?? undefined,
              height: image.height ?? undefined,
              alt: image.alt || project.name,
            },
          ]
        : undefined,
    },
  };
}

function projectJsonLd(project, canonicalPath) {
  return {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: project.name,
    description: project.descriptionText || undefined,
    url: canonicalPath,
    image: project.images?.map((image) => toAbsoluteUrl(image.url)),
    address: {
      "@type": "PostalAddress",
      addressLocality: project.location.city,
      addressRegion: project.location.state ?? undefined,
      postalCode: project.location.pincode ?? undefined,
      addressCountry: "IN",
    },
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(typeof slug === "string" ? slug : "");

  if (!project) {
    notFound();
  }

  const canonicalPath = `/projects/${project.slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectJsonLd(project, canonicalPath)),
        }}
      />
      <ProjectDetail project={project} />
    </>
  );
}
