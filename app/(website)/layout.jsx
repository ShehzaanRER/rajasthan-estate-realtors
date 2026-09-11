import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import EnquiryPopup from "../../components/EnquiryPopup";
import { CONTACTS, SITE_NAME, SITE_URL } from "../../lib/siteConfig";
import "../../src/index.css";

const title = "Rajasthan Estate Realtors | Real Estate in Mumbai";
const description =
  "Residential and commercial real estate across Mumbai's Western Suburbs, backed by local knowledge and a family legacy since 1988.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title,
    description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: SITE_NAME,
  url: SITE_URL,
  telephone: CONTACTS.map((contact) => contact.tel),
  areaServed: {
    "@type": "City",
    name: "Mumbai",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mumbai",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
  foundingDate: "1988",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Navbar />
        {children}
        <Footer />
        <EnquiryPopup />
      </body>
    </html>
  );
}