import { notFound } from "next/navigation";
import PropertyDetail from "../../../../components/properties/PropertyDetail";
import { getPropertyBySlug } from "../../../../lib/properties";

function metaDescription(property) {
  if (property.descriptionText) {
    if (property.descriptionText.length > 160) {
      return `${property.descriptionText.slice(0, 157).trim()}...`;
    }

    return property.descriptionText;
  }

  return `${property.propertyTypeLabel} in ${property.locationDisplay}`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(typeof slug === "string" ? slug : "");

  if (!property) {
    return {
      title: "Property | Rajasthan Estate Realtors",
    };
  }

  const title = `${property.title} | Rajasthan Estate Realtors`;
  const description = metaDescription(property);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function PropertyPage({ params }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(typeof slug === "string" ? slug : "");

  if (!property) {
    notFound();
  }

  return <PropertyDetail property={property} />;
}
