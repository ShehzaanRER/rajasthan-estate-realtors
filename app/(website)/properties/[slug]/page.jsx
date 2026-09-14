import { notFound } from "next/navigation";
import PropertyDetail from "../../../../components/properties/PropertyDetail";
import { getPropertyBySlug, getSimilarProperties } from "../../../../lib/properties";
import { toAbsoluteSiteUrl } from "../../../../lib/mediaUrl";
import { propertySeoTitle } from "../../../../lib/seo/titles";

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

function metaDescription(property) {
  if (property.descriptionText) {
    return toMetaText(property.descriptionText, 157);
  }

  return `${property.propertyTypeLabel} in ${property.locationDisplay}. ${property.purposeLabel} through Rajasthan Estate Realtors.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(typeof slug === "string" ? slug : "");

  if (!property) {
    return {
      // `absolute` stops the layout's "%s | Rajasthan Estate Realtors" template
      // from appending the brand to a page that is noindexed anyway, and
      // `canonical: null` stops it inheriting the layout's "/" — a 404 must not
      // declare the homepage as its canonical.
      title: { absolute: "Property Not Found | Rajasthan Estate Realtors" },
      alternates: { canonical: null },
      robots: { index: false, follow: false },
    };
  }

  // Composed from structured fields rather than the free-text CMS title — see
  // lib/seo/titles.ts. `absolute` drops the brand suffix, which would otherwise
  // push every detail title ~28 characters past what Google displays.
  const title = propertySeoTitle(property);
  const description = metaDescription(property);
  const canonicalPath = `/properties/${property.slug}`;
  const image = property.images?.[0];
  const ogImages = image
    ? [
        {
          url: toAbsoluteSiteUrl(image.url),
          width: image.width ?? undefined,
          height: image.height ?? undefined,
          alt: image.alt || property.title,
        },
      ]
    : undefined;

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
      // Only claim the wide card when there is actually an image to fill it;
      // `summary_large_image` with no image renders worse than `summary`.
      card: ogImages ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImages,
    },
  };
}

/**
 * `RealEstateListing` rather than `Product`.
 *
 * A rental or a lease is not a product, and Google evaluates `Product` against
 * merchant-listing requirements a property listing can never satisfy — so the
 * old markup earned nothing and generated Search Console warnings.
 *
 * Every `url` is absolute. Schema.org parsers do not resolve relative
 * references, so the previous `/properties/<slug>` values made the entity
 * unresolvable. The helper existed in this file already and was only being
 * applied to images.
 */
function propertyJsonLd(property, canonicalUrl) {
  const images = property.images?.map((image) => toAbsoluteSiteUrl(image.url));

  // An Offer needs a price. `primaryAmount` is null whenever the listing is
  // "price on request", and emitting a currency with no price is an invalid
  // object rather than a partial one — so the whole Offer is omitted instead.
  const offers =
    typeof property.pricing.primaryAmount === "number"
      ? {
          "@type": "Offer",
          priceCurrency: property.pricing.currency,
          price: property.pricing.primaryAmount,
          availability:
            property.status === "available"
              ? "https://schema.org/InStock"
              : "https://schema.org/LimitedAvailability",
          url: canonicalUrl,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.descriptionText || undefined,
    url: canonicalUrl,
    image: images?.length ? images : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.location.address || undefined,
      addressLocality: property.location.locality,
      addressRegion: property.location.state || undefined,
      addressCountry: "IN",
    },
    numberOfRooms:
      typeof property.bedrooms === "number" && property.bedrooms > 0
        ? property.bedrooms
        : undefined,
    offers,
  };
}

/**
 * Mirrors the visible "Back to Properties" trail. Two levels today; it gains a
 * locality level if locality landing pages are added later.
 */
function breadcrumbJsonLd(property, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: toAbsoluteSiteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Properties",
        item: toAbsoluteSiteUrl("/properties"),
      },
      { "@type": "ListItem", position: 3, name: property.title, item: canonicalUrl },
    ],
  };
}

export default async function PropertyPage({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(typeof slug === "string" ? slug : "");

  if (!property) {
    notFound();
  }

  const canonicalUrl = toAbsoluteSiteUrl(`/properties/${property.slug}`);
  const similarProperties = await getSimilarProperties(property);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(propertyJsonLd(property, canonicalUrl)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(property, canonicalUrl)),
        }}
      />
      <PropertyDetail property={property} similarProperties={similarProperties} />
    </>
  );
}
