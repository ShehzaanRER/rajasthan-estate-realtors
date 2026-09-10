import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import ContactForm from "../../../components/contact/ContactForm";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_NUMBER,
} from "../../../lib/siteConfig";

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

const whatsappHref = `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi, I'd like to get in touch with Rajasthan Estate Realtors.",
)}`;

const contactMethods = [
  {
    key: "phone",
    icon: Phone,
    label: "Call Us",
    value: CONTACT_PHONE_DISPLAY,
    href: `tel:${CONTACT_PHONE_TEL}`,
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp Us",
    value: CONTACT_PHONE_DISPLAY,
    href: whatsappHref,
    external: true,
  },
  {
    key: "email",
    icon: Mail,
    label: "Email Us",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
];

export default function ContactPage() {
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
                {contactMethods.map(({ key, icon: Icon, label, value, href, external }) => (
                  <a
                    key={key}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex min-w-0 items-center gap-4 rounded-lg border border-slate-200 bg-[#F7F5F1] p-5 transition-colors hover:border-[#B8862F]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#081221] text-[#D4AF37]">
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        {label}
                      </span>
                      <span className="mt-1 block break-words text-base font-medium text-[#081221] group-hover:text-[#B8862F]">
                        {value}
                      </span>
                    </span>
                  </a>
                ))}

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

              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
