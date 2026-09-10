import { notFound } from "next/navigation";
import PropertyDetail from "../../../../components/properties/PropertyDetail";
import { getPropertyBySlug } from "../../../../lib/properties";
import { SITE_URL } from "../../../../lib/siteConfig";

function toAbsoluteUrl(url) {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

function metaDescription(property) {
  if (property.descriptionText) {
    if (property.descriptionText.length > 160) {
      return `${property.descriptionText.slice(0, 157).trim()}...`;
    }

    return property.descriptionText;
  }

  return `${property.propertyTypeLabel} in ${property.locationDisplay}. ${property.purposeLabel} through Rajasthan Estate Realtors.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(typeof slug === "string" ? slug : "");

  if (!property) {
    return {
      title: "Property",
      robots: { index: false, follow: false },
    };
  }

  const title = `${property.title} in ${property.locationDisplay}`;
  const description = metaDescription(property);
  const canonicalPath = `/properties/${property.slug}`;
  const image = property.images?.[0];

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
              alt: image.alt || property.title,
            },
          ]
        : undefined,
    },
  };
}

function propertyJsonLd(property, canonicalPath) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: property.title,
    description: property.descriptionText || undefined,
    url: canonicalPath,
    image: property.images?.map((image) => toAbsoluteUrl(image.url)),
    offers: {
      "@type": "Offer",
      priceCurrency: property.pricing.currency,
      price: property.pricing.primaryAmount ?? undefined,
      availability:
        property.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
      url: canonicalPath,
    },
  };
}

export default async function PropertyPage({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(typeof slug === "string" ? slug : "");

  if (!property) {
    notFound();
  }

  const canonicalPath = `/properties/${property.slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(propertyJsonLd(property, canonicalPath)),
        }}
      />
      <PropertyDetail property={property} />
    </>
  );
}
