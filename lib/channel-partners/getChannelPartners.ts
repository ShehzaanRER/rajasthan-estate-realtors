import type { ChannelPartner } from '../../payload-types';
import { getPayloadClient } from '../payload';
import { mapChannelPartner } from './mapChannelPartner';
import type { PublicChannelPartner } from './types';

/** Enough to populate the `logo` upload relationship, and no deeper. */
const PARTNER_DEPTH = 1;
const PARTNER_LIMIT = 50;

/**
 * Active partners in CMS order. The homepage renders whatever this returns —
 * there is no hardcoded partner anywhere in the component tree.
 */
export async function getChannelPartners(): Promise<PublicChannelPartner[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'channel-partners',
    where: { active: { equals: true } },
    depth: PARTNER_DEPTH,
    limit: PARTNER_LIMIT,
    overrideAccess: false,
    sort: ['displayOrder', 'name'],
  });

  return result.docs
    .map((doc) => mapChannelPartner(doc as ChannelPartner))
    .filter((partner): partner is PublicChannelPartner => partner !== null);
}
