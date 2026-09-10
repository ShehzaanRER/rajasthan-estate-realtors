import config from '@payload-config';
import { getPayload } from 'payload';

/**
 * Server-only Payload Local API instance.
 * Do not import this module from Client Components or call `/api/properties` over HTTP.
 */
export async function getPayloadClient() {
  return getPayload({ config });
}
