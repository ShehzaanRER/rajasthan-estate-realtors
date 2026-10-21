import type { BannerPlacement } from './placements';
import type { PublicWebsiteBanner } from './types';

type DefaultBanner = Omit<PublicWebsiteBanner, 'placement'>;

const PROPERTIES_COPY: DefaultBanner = {
  image: null,
  eyebrow: null,
  heading: "Properties in Mumbai's",
  accent: 'Western Suburbs.',
  description:
    'Residential and commercial properties available through Rajasthan Estate Realtors, across Jogeshwari, Andheri, Goregaon and the surrounding areas.',
  cta: null,
  overlay: 'standard',
  align: 'left',
};

/**
 * The site's built-in design for each placement: exactly the copy each page
 * carried before banners moved into Payload, and no photograph.
 *
 * This is what renders while a placement has no published, enabled record —
 * which keeps the site unchanged until an administrator publishes something,
 * and keeps it intact if a record is unpublished, disabled or deleted. It is
 * also what `scripts/seed-website-banners.ts` copies into the draft records it
 * creates, so the admin starts from the live wording.
 *
 * It is never mixed into a CMS record field by field: once a record is
 * published, an empty optional field on it means "show nothing there".
 */
export const BANNER_DEFAULTS: Record<BannerPlacement, DefaultBanner> = {
  home: {
    image: null,
    eyebrow: 'Jogeshwari, Mumbai · Established 1988',
    heading: 'Find your place',
    accent: 'in Mumbai.',
    description:
      "A family-run property consultancy in Jogeshwari since 1988, working across residential and commercial property in Mumbai's Western Suburbs.",
    cta: { label: 'Explore Properties', href: '/properties' },
    overlay: 'standard',
    align: 'left',
  },
  'our-story': {
    image: null,
    eyebrow: null,
    heading: null,
    accent: null,
    description: null,
    cta: null,
    overlay: 'standard',
    align: 'left',
  },
  properties: PROPERTIES_COPY,
  rentals: PROPERTIES_COPY,
  commercial: PROPERTIES_COPY,
  projects: {
    image: null,
    eyebrow: null,
    heading: 'New developments',
    accent: 'in the Western Suburbs.',
    description:
      'Residential and commercial projects across Jogeshwari, Andheri, Goregaon, Malad and the surrounding areas.',
    cta: null,
    overlay: 'standard',
    align: 'left',
  },
  about: {
    image: null,
    eyebrow: 'Established 1988 · Jogeshwari',
    heading: 'Rajasthan Estate Realtors,',
    accent: 'Jogeshwari since 1988.',
    description:
      'Built on trust and rooted in Mumbai. A family-run consultancy serving Jogeshwari and the Western Suburbs with local knowledge and personal guidance.',
    cta: null,
    overlay: 'standard',
    align: 'left',
  },
  contact: {
    image: null,
    eyebrow: 'Get In Touch',
    heading: "Let's talk about",
    accent: 'your property.',
    description:
      'Whether you are buying, selling, renting or exploring a new project, our team is here to help. Reach out directly or send us your requirements below.',
    cta: null,
    overlay: 'standard',
    align: 'left',
  },
};
