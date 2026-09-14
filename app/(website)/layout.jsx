import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import EnquiryPopup from "../../components/EnquiryPopup";
import { CONTACT_EMAIL, CONTACTS, SITE_NAME, SITE_URL } from "../../lib/siteConfig";
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

/**
 * Only facts that exist in the repository: the trading name, the two partners'
 * numbers, the public email, the city, and the founding year stated on the
 * About page. No opening hours, no rating, no street address and no awards —
 * none of those are recorded anywhere, and inventing them for markup would be
 * a fabrication Google can penalise.
 *
 * `@id` is what makes this entity referenceable, so per-page schema can point
 * at one organisation rather than implying a new one per page.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  telephone: CONTACTS.map((contact) => contact.tel),
  email: CONTACT_EMAIL,
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