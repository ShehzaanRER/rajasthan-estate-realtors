import { notFound } from "next/navigation";
import ProjectDetail from "../../../../components/projects/ProjectDetail";
import { getProjectBySlug, getRelatedProjects } from "../../../../lib/projects";
import { toAbsoluteSiteUrl } from "../../../../lib/mediaUrl";
import { projectSeoTitle } from "../../../../lib/seo/titles";
import { DEFAULT_OG_IMAGE } from "../../../../lib/seo/ogImage";

/**
 * Collapses the rich-text plaintext onto one line, then truncates at a word
 * boundary. Lexical plaintext preserves the paragraph breaks of the original
 * description, and a raw newline inside a meta `content` attribute is untidy
 * at best and mishandled by some parsers.
 */
function toMetaText(text, limit) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) {
    return flat;
  }

  const cut = flat.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function metaDescription(project) {
  if (project.descriptionText) {
    return toMetaText(project.descriptionText, 157);
  }

  return `${project.name} by ${project.developer} in ${project.location.locationDisplay}.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(typeof slug === "string" ? slug : "");

  if (!project) {
    return {
      title: { absolute: "Project Not Found | Rajasthan Estate Realtors" },
      alternates: { canonical: null },
      robots: { index: false, follow: false },
    };
  }

  // See lib/seo/titles.ts — composed from structured fields, locality only, and
  // no brand suffix, so the tag fits inside what Google displays.
  const title = projectSeoTitle(project);
  const description = metaDescription(project);
  const canonicalPath = `/projects/${project.slug}`;
  const image = project.featuredImage;
  const ogImages = image
    ? [
        {
          url: toAbsoluteSiteUrl(image.url),
          width: image.width ?? undefined,
          height: image.height ?? undefined,
          alt: image.alt || project.name,
        },
      ]
    : // A project with no featured image yet falls back to the branded card
      // rather than sharing with no preview image at all.
      [DEFAULT_OG_IMAGE];

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalPath,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
    },
  };
}

/**
 * `ApartmentComplex` is the right type and stays. Two value fixes: the `url`
 * must be absolute for a parser to resolve the entity, and `addressLocality`
 * previously received the *city*, discarding the more precise locality the CMS
 * already stores.
 */
function projectJsonLd(project, canonicalUrl) {
  const images = project.images?.map((image) => toAbsoluteSiteUrl(image.url));

  const geo =
    typeof project.location.latitude === "number" &&
    typeof project.location.longitude === "number"
      ? {
          "@type": "GeoCoordinates",
          latitude: project.location.latitude,
          longitude: project.location.longitude,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: project.name,
    description: project.descriptionText || undefined,
    url: canonicalUrl,
    image: images?.length ? images : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: project.location.address ?? undefined,
      addressLocality: project.location.locality,
      addressRegion: project.location.state ?? undefined,
      postalCode: project.location.pincode ?? undefined,
      addressCountry: "IN",
    },
    geo,
  };
}

function breadcrumbJsonLd(project, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: toAbsoluteSiteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: toAbsoluteSiteUrl("/projects"),
      },
      { "@type": "ListItem", position: 3, name: project.name, item: canonicalUrl },
    ],
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(typeof slug === "string" ? slug : "");

  if (!project) {
    notFound();
  }

  const canonicalUrl = toAbsoluteSiteUrl(`/projects/${project.slug}`);
  const relatedProjects = await getRelatedProjects(project);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(projectJsonLd(project, canonicalUrl)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(project, canonicalUrl)),
        }}
      />
      <ProjectDetail project={project} relatedProjects={relatedProjects} />
    </>
  );
}
