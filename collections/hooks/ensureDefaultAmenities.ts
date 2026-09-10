import type { Payload } from 'payload';

type AmenityCategory = 'building' | 'lifestyle' | 'convenience';

type PredefinedAmenity = {
  name: string;
  slug: string;
  category: AmenityCategory;
};

/**
 * Curated Mumbai listing amenity library.
 * Seeded on Payload init; existing records are never updated or deleted.
 */
export const PREDEFINED_AMENITIES: readonly PredefinedAmenity[] = [
  { name: 'Lift', slug: 'lift', category: 'building' },
  { name: 'Security', slug: 'security', category: 'building' },
  { name: 'CCTV Surveillance', slug: 'cctv-surveillance', category: 'building' },
  { name: 'Intercom', slug: 'intercom', category: 'building' },
  { name: 'Fire Safety System', slug: 'fire-safety-system', category: 'building' },
  { name: 'Power Backup', slug: 'power-backup', category: 'building' },
  { name: 'Visitor Parking', slug: 'visitor-parking', category: 'building' },
  { name: 'Swimming Pool', slug: 'swimming-pool', category: 'lifestyle' },
  { name: 'Gymnasium', slug: 'gymnasium', category: 'lifestyle' },
  { name: 'Clubhouse', slug: 'clubhouse', category: 'lifestyle' },
  { name: 'Garden', slug: 'garden', category: 'lifestyle' },
  { name: "Children's Play Area", slug: 'childrens-play-area', category: 'lifestyle' },
  { name: 'Jogging Track', slug: 'jogging-track', category: 'lifestyle' },
  { name: 'Indoor Games', slug: 'indoor-games', category: 'lifestyle' },
  { name: 'Multipurpose Hall', slug: 'multipurpose-hall', category: 'lifestyle' },
  { name: 'Covered Parking', slug: 'covered-parking', category: 'convenience' },
  { name: 'Open Parking', slug: 'open-parking', category: 'convenience' },
  { name: '24 Hour Water Supply', slug: '24-hour-water-supply', category: 'convenience' },
  { name: 'Waste Disposal', slug: 'waste-disposal', category: 'convenience' },
  { name: 'Maintenance Staff', slug: 'maintenance-staff', category: 'convenience' },
];

export async function ensureDefaultAmenities(payload: Payload): Promise<void> {
  for (const amenity of PREDEFINED_AMENITIES) {
    const existing = await payload.find({
      collection: 'amenities',
      where: {
        or: [{ slug: { equals: amenity.slug } }, { name: { equals: amenity.name } }],
      },
      limit: 1,
      overrideAccess: true,
    });

    if (existing.totalDocs > 0) {
      continue;
    }

    await payload.create({
      collection: 'amenities',
      data: {
        name: amenity.name,
        slug: amenity.slug,
        category: amenity.category,
      },
      overrideAccess: true,
    });
  }
}
