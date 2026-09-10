import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../../../lib/siteConfig";

const title = "Terms & Conditions";
const description =
  "Terms and conditions for using the Rajasthan Estate Realtors website.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/terms",
  },
  robots: { index: false, follow: true },
};

const LAST_UPDATED = "September 2026";

function Section({ heading, children }) {
  return (
    <div className="border-t border-slate-200 py-8 first:border-t-0 first:pt-0">
      <h2 className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
        {heading}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-slate-600">
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="bg-white">
      <section className="bg-[#081221] px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#B8862F]">
            Rajasthan Estate Realtors
          </p>

          <h1 className="mt-5 font-serif text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl">
            Terms &amp; Conditions
          </h1>

          <p className="mt-5 max-w-2xl text-base font-light leading-7 text-slate-300">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Section heading="Acceptance of Terms">
            <p>
              By accessing or using this website, you agree to these Terms
              &amp; Conditions. If you do not agree with any part of these
              terms, please do not use this website.
            </p>
          </Section>

          <Section heading="About This Website">
            <p>
              This website is operated by Rajasthan Estate Realtors
              (&quot;RER&quot;, &quot;we&quot;, &quot;us&quot;), a real estate
              consultancy based in Mumbai. This website is provided to help
              prospective buyers, sellers, tenants and landlords learn about
              properties and services offered by RER.
            </p>
          </Section>

          <Section heading="Property Information">
            <p>
              We make reasonable efforts to present accurate and up-to-date
              property information, including pricing, availability, area and
              amenities. However, property details, pricing and availability
              can change without notice, and information on this website is
              provided for general guidance only.
            </p>
            <p>
              Nothing on this website constitutes a binding offer, contract or
              guarantee regarding any property. Prospective buyers, sellers
              and tenants should independently verify all property details,
              and any final terms will be confirmed directly with our team
              before proceeding.
            </p>
          </Section>

          <Section heading="No Professional or Financial Advice">
            <p>
              Content on this website is provided for general informational
              purposes and does not constitute legal, financial or investment
              advice. You should seek independent professional advice before
              making property-related decisions.
            </p>
          </Section>

          <Section heading="Acceptable Use">
            <p>You agree not to use this website to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Violate any applicable law or regulation</li>
              <li>Copy, scrape or reproduce content for commercial purposes without permission</li>
              <li>Attempt to gain unauthorised access to this website or its systems</li>
              <li>Submit false, misleading or fraudulent enquiries</li>
            </ul>
          </Section>

          <Section heading="Intellectual Property">
            <p>
              The content on this website, including text, images, logos and
              design, is the property of Rajasthan Estate Realtors or its
              licensors, unless otherwise stated, and may not be reproduced
              without prior permission.
            </p>
          </Section>

          <Section heading="Third-Party Links">
            <p>
              This website may link to third-party services, such as
              WhatsApp, Google Maps or Google Reviews. We are not responsible
              for the content, accuracy or practices of any third-party
              website or service.
            </p>
          </Section>

          <Section heading="Limitation of Liability">
            <p>
              To the extent permitted by law, Rajasthan Estate Realtors is not
              liable for any loss or damage arising from your use of this
              website or reliance on information presented on it. This does
              not limit any liability that cannot be excluded under
              applicable law.
            </p>
          </Section>

          <Section heading="Governing Law">
            <p>
              These Terms &amp; Conditions are governed by the laws of India.
              Any disputes arising from the use of this website will be
              subject to the jurisdiction of the courts in Mumbai,
              Maharashtra.
            </p>
          </Section>

          <Section heading="Changes to These Terms">
            <p>
              We may update these Terms &amp; Conditions from time to time.
              The &quot;Last updated&quot; date at the top of this page
              indicates when these terms were last revised.
            </p>
          </Section>

          <Section heading="Contact Us">
            <p>
              If you have questions about these Terms &amp; Conditions,
              please contact us:
            </p>
            <ul className="space-y-1">
              <li>
                Phone:{" "}
                <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-[#B8862F] hover:underline">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li>
                Email:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#B8862F] hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </Section>

          <div className="pt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-[#081221] px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
