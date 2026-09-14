import type { ChannelPartner, Media } from '../../payload-types';
import { toDeliveryImage, toRelativeMediaUrl } from '../mediaUrl';
import type { PublicChannelPartner, PublicPartnerLogo } from './types';

const SVG_MIME_TYPE = 'image/svg+xml';

function isPopulatedMedia(value: number | Media | null | undefined): value is Media {
  return (
    Boolean(value) && typeof value === 'object' && typeof value.url === 'string' && value.url.length > 0
  );
}

function textOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Only http(s) links reach the markup. The collection already validates this
 * on save; repeating it here means a record written before the field existed,
 * or edited straight in the database, still cannot produce a `javascript:`
 * href on the homepage.
 */
function externalUrlOrNull(value: string | null | undefined): string | null {
  const url = textOrNull(value);

  if (!url) {
    return null;
  }

  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Alt text is built from the partner name rather than the Media record's own
 * `alt`, which describes the file in the shared library ("Logo", "Wordmark")
 * and says nothing useful about whose logo this is on the page.
 */
function toPartnerLogo(media: Media, partnerName: string): PublicPartnerLogo {
  const alt = `${partnerName} logo`;

  if (media.mimeType === SVG_MIME_TYPE) {
    return {
      url: toRelativeMediaUrl(media.url as string),
      alt,
      width: typeof media.width === 'number' ? media.width : null,
      height: typeof media.height === 'number' ? media.height : null,
      isVector: true,
    };
  }

  const delivery = toDeliveryImage(media);

  return {
    url: delivery.url,
    alt,
    width: delivery.width,
    height: delivery.height,
    isVector: false,
  };
}

export function mapChannelPartner(doc: ChannelPartner): PublicChannelPartner | null {
  const name = textOrNull(doc.name);

  if (!name || !isPopulatedMedia(doc.logo)) {
    return null;
  }

  return {
    id: doc.id,
    name,
    websiteUrl: externalUrlOrNull(doc.websiteUrl),
    logo: toPartnerLogo(doc.logo, name),
  };
}
