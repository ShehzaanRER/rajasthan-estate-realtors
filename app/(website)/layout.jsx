import { Cormorant_Garamond } from "next/font/google";
import Navbar from "../../components/layouts/Navbar";
import Footer from "../../components/layouts/Footer";
import EnquiryPopup from "../../components/EnquiryPopup";
import Analytics from "../../components/Analytics";
import { CONTACT_EMAIL, CONTACTS, SITE_NAME, SITE_URL } from "../../lib/siteConfig";
import { DEFAULT_OG_IMAGE } from "../../lib/seo/ogImage";
import "../../src/index.css";

/**
 * The wordmark face, self-hosted rather than pulled from Google.
 *
 * This was previously an `@import url(fonts.googleapis.com/...)` at the top of
 * src/index.css, which is the worst place to ask for a font: the browser has
 * to fetch and parse the stylesheet before it even discovers the request, then
 * fetch a second stylesheet, then the font files — a three-deep chain in front
 * of first paint. It also handed every visitor's IP address to a third party
 * on every page load, which is the sort of thing the privacy policy would have
 * had to account for.
 *
 * `next/font` inlines the @font-face rules into the app's own CSS and serves
 * the files from this origin, so the chain collapses and no third party is
 * involved. It is part of Next, not a new dependency.
 *
 * Weight 600 only — that is the single weight the face is actually set in
 * (`font-semibold` on the Navbar and Footer wordmarks, the only two
 * `font-cormorant` usages in the codebase). Declaring 500 and 700 as well
 * would ship two more @font-face rules the site never selects, and invite a
 * stray `font-bold` somewhere to start fetching a second file silently.
 *
 * `display: swap`, so the wordmark paints immediately in the fallback rather
 * than blocking on the webfont.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-cormorant-src",
});

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
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    // `opengraph-image.png` in this segment is inherited by every page that
    // does not set its own, so there is always a 1200x630 image to fill the
    // wide card. Property and project pages override both the image and this
    // field with their own first photograph.
    card: "summary_large_image",
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
    <html lang="en" className={cormorant.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Navbar />
        {children}
        <Footer />
        <EnquiryPopup />
        <Analytics />
      </body>
    </html>
  );
}