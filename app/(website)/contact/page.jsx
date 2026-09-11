import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import ContactForm from "../../../components/contact/ContactForm";
import { CONTACTS, CONTACT_EMAIL } from "../../../lib/siteConfig";

const title = "Contact Us";
const description =
  "Get in touch with Rajasthan Estate Realtors for residential and commercial property enquiries across Mumbai's Western Suburbs.";

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title,
    description,
    url: "/contact",
  },
};

const whatsappText = encodeURIComponent(
  "Hi, I'd like to get in touch with Rajasthan Estate Realtors.",
);

/**
 * This page is the one place the numbers are attributed by name — everywhere
 * else on the site they appear as plain numbers.
 */
const namedContacts = CONTACTS.map((contact) => ({
  ...contact,
  telHref: `tel:${contact.tel}`,
  whatsappHref: `https://wa.me/${contact.whatsapp}?text=${whatsappText}`,
}));

export default async function ContactPage({ searchParams }) {
  const params = await searchParams;
  const intent = typeof params?.intent === "string" ? params.intent : "";

  return (
    <main className="bg-white">
      <section className="bg-[#081221]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-16 md:px-16 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-12 bg-[#B8862F]" />
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-[#D4AF37] sm:text-sm">
                Get In Touch
              </p>
            </div>

            <h1 className="font-serif text-5xl font-light leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl">
              Let&apos;s talk about
              <span className="block italic text-[#D4AF37]">
                your property.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base font-light leading-8 text-slate-300 sm:text-lg">
              Whether you are buying, selling, renting or exploring a new
              project, our team is here to help. Reach out directly or send
              us your requirements below.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 md:px-16 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div className="min-w-0">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Reach Us Directly
                </p>
              </div>

              <div className="space-y-5">
                {namedContacts.map(({ name, display, telHref, whatsappHref }) => (
                  <div
                    key={name}
                    className="min-w-0 rounded-lg border border-slate-200 bg-[#F7F5F1] p-5"
                  >
                    <p className="text-base font-medium text-[#081221]">{name}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                      {/* py gives these primary contact actions a usable tap
                          target; they were text-height only on mobile. */}
                      <a
                        href={telHref}
                        className="group inline-flex items-center gap-2.5 py-1.5 text-base font-medium text-[#081221] hover:text-[#B8862F]"
                      >
                        <Phone size={17} className="shrink-0 text-[#B8862F]" />
                        {display}
                      </a>

                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 py-1.5 text-sm font-medium text-slate-600 hover:text-[#B8862F]"
                      >
                        <MessageCircle size={17} className="shrink-0 text-[#B8862F]" />
                        WhatsApp
                        <span className="sr-only">{name} on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))}

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="group flex min-w-0 items-center gap-4 rounded-lg border border-slate-200 bg-[#F7F5F1] p-5 transition-colors hover:border-[#B8862F]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#081221] text-[#D4AF37]">
                    <Mail size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Email Us
                    </span>
                    <span className="mt-1 block break-words text-base font-medium text-[#081221] group-hover:text-[#B8862F]">
                      {CONTACT_EMAIL}
                    </span>
                  </span>
                </a>

                <div className="flex min-w-0 items-center gap-4 rounded-lg border border-slate-200 bg-[#F7F5F1] p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#081221] text-[#D4AF37]">
                    <MapPin size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Location
                    </span>
                    <span className="mt-1 block text-base font-medium text-[#081221]">
                      Mumbai, Maharashtra
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-10 bg-[#B8862F]" />
                <p className="text-xs font-medium uppercase tracking-[0.35em] text-[#B8862F]">
                  Send An Enquiry
                </p>
              </div>

              <ContactForm defaultRequirement={intent} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
