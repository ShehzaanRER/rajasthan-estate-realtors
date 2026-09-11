import Link from "next/link";
import { ArrowRight, Building2, Home, KeyRound, TrendingUp } from "lucide-react";

/**
 * The four things RER is hired to do. These are the site's primary business
 * intents, so they stay permanently visible rather than rotating in and out
 * of a slider — a visitor should never have to wait to find out how to buy,
 * sell, rent or look at commercial space.
 *
 * All four cards share one class string. Keeping the base and hover styles in
 * a single place is what stops an individual card from drifting into a
 * permanently-hovered look.
 */
const cardClasses =
  "group flex flex-col border border-slate-300 bg-white/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#B8862F] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8862F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F5F1] sm:p-5 lg:p-6";

const services = [
  {
    key: "buy",
    icon: Home,
    title: "Buy",
    copy: "Find a home to buy across the Western Suburbs.",
    href: "/properties?for=buy&category=residential",
    cta: "Browse homes for sale",
  },
  {
    key: "sell",
    icon: TrendingUp,
    title: "Sell",
    copy: "Position your property and reach serious buyers.",
    href: "/contact?intent=sell-property",
    cta: "Start a seller enquiry",
  },
  {
    key: "rent",
    icon: KeyRound,
    title: "Rent",
    copy: "Find a home to rent, on an eleven-month agreement.",
    href: "/properties?for=rent&category=residential",
    cta: "Browse homes to rent",
  },
  {
    key: "commercial",
    icon: Building2,
    title: "Commercial",
    copy: "Office, retail and other commercial space to buy or rent.",
    href: "/properties?category=commercial",
    cta: "Browse commercial properties",
  },
];

function Services() {
  return (
    <section id="services" className="bg-[#F7F5F1] py-16 sm:py-20">

      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-medium tracking-tight text-[#081221] sm:text-5xl">
              How we can help
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              Whether you are buying, selling, renting or exploring a commercial
              opportunity, our team can guide you through the process.
            </p>
          </div>

          <Link
            href="/contact"
            className="group inline-flex w-fit shrink-0 items-center gap-3 border-b border-slate-400 pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            Discuss your requirement

            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">

          {services.map(({ key, icon: Icon, title, copy, href, cta }) => (
            <Link key={key} href={href} className={cardClasses}>
              <Icon
                strokeWidth={1.5}
                className="mb-3 h-6 w-6 text-[#B8862F] sm:mb-4 sm:h-[26px] sm:w-[26px]"
                aria-hidden="true"
              />

              <h3 className="font-serif text-xl text-[#081221] sm:text-2xl">
                {title}
              </h3>

              <p className="mt-1.5 text-[13px] leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
                {copy}
              </p>

              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B8862F] sm:pt-5 sm:tracking-[0.25em]">
                Explore

                <ArrowRight
                  size={13}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />

                <span className="sr-only">{cta}</span>
              </span>
            </Link>
          ))}

        </div>

      </div>

    </section>
  );
}

export default Services;
