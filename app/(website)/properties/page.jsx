import { getProperties } from "../../../lib/properties";
import PropertiesListing from "../../../components/properties/PropertiesListing";

export const metadata = {
  title: "Properties | Rajasthan Estate Realtors",
  description:
    "Explore residential and commercial properties across Mumbai's Western Suburbs, selected by Rajasthan Estate Realtors.",
};

function filtersFromTypeParam(type) {
  if (type === "buy") {
    return { purpose: "sale" };
  }

  if (type === "rent") {
    return { purpose: "rent" };
  }

  if (type === "commercial") {
    return { category: "commercial" };
  }

  return {};
}

export default async function PropertiesPage({ searchParams }) {
  const params = await searchParams;
  const type = typeof params?.type === "string" ? params.type : undefined;
  const properties = await getProperties(filtersFromTypeParam(type));

  return <PropertiesListing properties={properties} />;
}
