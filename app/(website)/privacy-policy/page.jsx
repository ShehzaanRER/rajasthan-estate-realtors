import Link from "next/link";
import { CONTACTS, CONTACT_EMAIL } from "../../../lib/siteConfig";

const title = "Privacy Policy";
const description =
  "How Rajasthan Estate Realtors collects, uses and protects information shared through this website.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy-policy",
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

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-white">
      <section className="bg-[#081221] px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#B8862F]">
            Rajasthan Estate Realtors
          </p>

          <h1 className="mt-5 font-serif text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-5 max-w-2xl text-base font-light leading-7 text-slate-300">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Section heading="Overview">
            <p>
              This Privacy Policy explains how Rajasthan Estate Realtors
              (&quot;RER&quot;, &quot;we&quot;, &quot;us&quot;) handles
              information you share with us through this website, by phone,
              by WhatsApp or by email. It applies to visitors of this website
              and to individuals who contact us regarding property enquiries.
            </p>
          </Section>

          <Section heading="Information We Collect">
            <p>We may collect information that you choose to share with us, such as:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Your name, phone number and email address</li>
              <li>Details of the property you are interested in, buying, selling or renting</li>
              <li>Your budget, location preference or other requirements you share with us</li>
              <li>Messages you send us through WhatsApp, phone calls or email</li>
            </ul>
            <p>
              We do not require you to create an account to browse this
              website, and we do not knowingly collect sensitive financial
              information (such as bank account or card details) through this
              website.
            </p>
          </Section>

          <Section heading="How We Use Your Information">
            <p>We use the information you provide to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Respond to your property enquiries</li>
              <li>Share relevant property information, availability and updates</li>
              <li>Arrange viewings or discussions regarding a property</li>
              <li>Improve the service we provide to buyers, sellers, landlords and tenants</li>
            </ul>
            <p>
              We do not sell your personal information to third parties. Where
              relevant to a specific enquiry (for example, connecting a
              prospective buyer or tenant with a property owner), we may share
              limited, relevant information with the other party involved in
              that transaction.
            </p>
          </Section>

          <Section heading="Cookies and Website Data">
            <p>
              This website may use basic, functional cookies or similar
              technologies required for the website to operate correctly. We
              do not currently use advertising or cross-site tracking cookies.
              If this changes in the future, this policy will be updated
              accordingly.
            </p>
          </Section>

          <Section heading="Third-Party Links">
            <p>
              This website may contain links to third-party services, such as
              WhatsApp, Google Maps or Google Reviews. We are not responsible
              for the privacy practices of these third-party services, and we
              encourage you to review their respective privacy policies.
            </p>
          </Section>

          <Section heading="Data Retention">
            <p>
              We retain enquiry information for as long as reasonably
              necessary to respond to your enquiry and to maintain a record of
              our business dealings, consistent with standard business
              practice for a real estate consultancy.
            </p>
          </Section>

          <Section heading="Your Choices">
            <p>
              You may contact us at any time to ask what information we hold
              about you, to request a correction, or to request that we stop
              contacting you regarding a specific enquiry.
            </p>
          </Section>

          <Section heading="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices. The &quot;Last updated&quot; date at
              the top of this page indicates when this policy was last
              revised.
            </p>
          </Section>

          <Section heading="Contact Us">
            <p>
              If you have questions about this Privacy Policy or how your
              information is handled, please contact us:
            </p>
            <ul className="space-y-1">
              <li>
                Phone:{" "}
                {CONTACTS.map((contact, index) => (
                  <span key={contact.tel}>
                    {index > 0 ? ", " : ""}
                    <a href={`tel:${contact.tel}`} className="text-[#B8862F] hover:underline">
                      {contact.display}
                    </a>
                  </span>
                ))}
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
