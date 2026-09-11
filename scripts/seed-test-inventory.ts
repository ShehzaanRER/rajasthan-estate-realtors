import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { RequiredDataFromCollectionSlug } from 'payload';
import sharp from 'sharp';
import { getPayloadClient } from '../lib/payload';

/**
 * Creates a persistent set of clearly-labelled QA records (5 properties,
 * 5 projects) through the normal Payload collections, so the public site can
 * be exercised against realistic inventory.
 *
 * Every record is named "RER Test …" and every developer is fictional, so the
 * entries are easy to identify and delete by hand later. Re-running the script
 * updates the existing records rather than creating duplicates (matched on
 * slug), so it is safe to run more than once.
 *
 * Imagery is generated locally rather than downloaded, so no third party's
 * marketing material ends up in the media library.
 */

type Palette = { from: string; to: string; accent: string };

const PALETTES: Palette[] = [
  { from: '#1f3348', to: '#4a6b84', accent: '#c8a45c' },
  { from: '#2c3e50', to: '#6b7f92', accent: '#d8c9a8' },
  { from: '#3b3a36', to: '#7d7a6f', accent: '#b8862f' },
  { from: '#243b3a', to: '#5e8481', accent: '#cfd8c6' },
  { from: '#33283a', to: '#75617f', accent: '#c9a6cf' },
  { from: '#1d2f3f', to: '#547089', accent: '#e0cfa0' },
];

/** Abstract architectural placeholder — no text, so no font dependency. */
function placeholderSvg(palette: Palette, seed: number): string {
  const width = 1600;
  const height = 1067;
  const bars = Array.from({ length: 6 }, (_, index) => {
    const barWidth = 90 + ((seed * 37 + index * 53) % 120);
    const barHeight = 220 + ((seed * 61 + index * 97) % 520);
    const x = 90 + index * 250;
    const y = height - barHeight - 90;
    const opacity = 0.12 + ((index + seed) % 4) * 0.06;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#ffffff" opacity="${opacity.toFixed(2)}" rx="4"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.from}"/>
        <stop offset="100%" stop-color="${palette.to}"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    ${bars}
    <rect x="0" y="${height - 70}" width="${width}" height="70" fill="${palette.accent}" opacity="0.25"/>
  </svg>`;
}

async function buildImageFile(dir: string, name: string, seed: number): Promise<string> {
  const palette = PALETTES[seed % PALETTES.length];
  const filePath = path.join(dir, `${name}.jpg`);
  await sharp(Buffer.from(placeholderSvg(palette, seed))).jpeg({ quality: 78 }).toFile(filePath);
  return filePath;
}

/** Minimal valid Lexical state, matching what the rest of the app expects. */
function richText(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        version: 1,
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        children: [
          {
            type: 'text',
            version: 1,
            text,
            format: 0,
            detail: 0,
            mode: 'normal' as const,
            style: '',
          },
        ],
      })),
    },
  };
}

const AMENITY = {
  lift: 1,
  security: 2,
  cctv: 3,
  intercom: 4,
  fireSafety: 5,
  powerBackup: 6,
  visitorParking: 7,
  swimmingPool: 8,
  gymnasium: 9,
  clubhouse: 10,
  garden: 11,
  playArea: 12,
  joggingTrack: 13,
  indoorGames: 14,
  multipurposeHall: 15,
  coveredParking: 16,
  openParking: 17,
  waterSupply: 18,
  wasteDisposal: 19,
  maintenanceStaff: 20,
  basementParking: 21,
};

type Payload = Awaited<ReturnType<typeof getPayloadClient>>;

/** Identifier fields are assigned by collection hooks, not by this script. */
type SeededDoc = { id: number | string; propertyId?: string | null; projectId?: string | null };

/**
 * Creates the record, or updates it in place when a record with the same slug
 * already exists, so re-running the script never produces duplicates.
 *
 * `collection` is kept as a literal at each call site: Payload's create/update
 * signatures resolve per-collection, and a union widens them into the
 * draft-only overload.
 */
async function findExistingId(payload: Payload, collection: 'properties' | 'projects', slug: string) {
  const existing = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  return existing.docs[0]?.id;
}

async function main() {
  const payload = await getPayloadClient();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rer-test-media-'));

  // ---------------------------------------------------------------- media
  const mediaIds: Record<string, number> = {};

  const imageSpecs = [
    ['test-andheri-2bhk', 'RER test image — Andheri West 2 BHK apartment'],
    ['test-juhu-3bhk', 'RER test image — Juhu 3 BHK apartment'],
    ['test-juhu-3bhk-living', 'RER test image — Juhu 3 BHK living area'],
    ['test-juhu-3bhk-balcony', 'RER test image — Juhu 3 BHK balcony view'],
    ['test-goregaon-1bhk', 'RER test image — Goregaon East 1 BHK'],
    ['test-malad-2bhk', 'RER test image — Malad West 2 BHK'],
    ['test-lowerparel-office', 'RER test image — Lower Parel office floor'],
    ['test-project-andheri', 'RER test image — Andheri West project exterior'],
    ['test-project-andheri-lobby', 'RER test image — Andheri West project lobby'],
    ['test-project-jogeshwari', 'RER test image — Jogeshwari East project exterior'],
    ['test-project-goregaon', 'RER test image — Goregaon West project exterior'],
    ['test-project-malad', 'RER test image — Malad West project exterior'],
    ['test-project-business-park', 'RER test image — Andheri East business park'],
    ['test-project-masterplan', 'RER test image — indicative master plan layout'],
  ] as const;

  for (const [index, [name, alt]] of imageSpecs.entries()) {
    const existing = await payload.find({
      collection: 'media',
      where: { alt: { equals: alt } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (existing.docs.length > 0) {
      mediaIds[name] = existing.docs[0].id as number;
      continue;
    }

    const filePath = await buildImageFile(tmpDir, name, index);
    const doc = await payload.create({
      collection: 'media',
      filePath,
      data: { alt },
      overrideAccess: true,
    });
    mediaIds[name] = doc.id as number;
  }

  console.log(`Media ready: ${Object.keys(mediaIds).length} items.`);

  // ----------------------------------------------------------- properties
  const properties = [
    {
      slug: 'rer-test-residence-andheri-west-2bhk',
      title: 'RER Test Residence — Andheri West 2 BHK',
      purpose: 'sale',
      propertyCategory: 'residential',
      propertyType: 'apartment',
      status: 'available',
      tags: ['featured', 'residential', 'ready-to-move'],
      description: richText([
        'TEST LISTING. A well-planned 2 BHK apartment in a mid-rise building close to Andheri West market and the metro corridor.',
        'This is fictional inventory created to exercise the Rajasthan Estate Realtors website. It does not represent a real property.',
      ]),
      location: {
        locality: 'Andheri West',
        area: 'Lokhandwala',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Test Plot 14, Sample Road, Andheri West, Mumbai 400053',
      },
      pricing: { currency: 'INR', price: 24500000, pricePerSqFt: 31410, negotiable: true, priceOnRequest: false },
      details: {
        bedrooms: 2,
        bathrooms: 2,
        area: 780,
        areaUnit: 'sq-ft',
        furnishing: 'semi-furnished',
        balconies: 1,
        propertyAge: 6,
        possessionStatus: 'ready-to-move',
      },
      buildingDetails: { buildingName: 'RER Test Tower A', totalFloors: 14, floorNumber: 7, liftAvailable: true },
      amenities: [AMENITY.lift, AMENITY.security, AMENITY.cctv, AMENITY.powerBackup, AMENITY.coveredParking, AMENITY.garden],
      media: { featuredImage: mediaIds['test-andheri-2bhk'] },
    },
    {
      slug: 'rer-test-heights-juhu-3bhk-sea-facing',
      title: 'RER Test Heights — Juhu 3 BHK Sea-Facing Apartment with Private Terrace',
      purpose: 'sale',
      propertyCategory: 'residential',
      propertyType: 'apartment',
      status: 'available',
      tags: ['featured', 'premium', 'residential'],
      description: richText([
        'TEST LISTING. A spacious 3 BHK apartment on a high floor with a private terrace and open western views.',
        'The layout separates the living and sleeping wings, with a utility area off the kitchen and dedicated parking in the basement.',
        'This is fictional inventory created to exercise the Rajasthan Estate Realtors website. It does not represent a real property, building, or developer.',
      ]),
      location: {
        locality: 'Juhu',
        area: 'Juhu Tara Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Test Plot 2, Sample Tara Road, Juhu, Mumbai 400049',
      },
      pricing: { currency: 'INR', price: 69000000, pricePerSqFt: 47586, negotiable: false, priceOnRequest: false },
      details: {
        bedrooms: 3,
        bathrooms: 3,
        area: 1450,
        areaUnit: 'sq-ft',
        furnishing: 'furnished',
        balconies: 2,
        propertyAge: 2,
        possessionStatus: 'ready-to-move',
      },
      buildingDetails: { buildingName: 'RER Test Heights', totalFloors: 22, floorNumber: 18, liftAvailable: true },
      amenities: [
        AMENITY.lift, AMENITY.security, AMENITY.cctv, AMENITY.powerBackup, AMENITY.swimmingPool,
        AMENITY.gymnasium, AMENITY.clubhouse, AMENITY.basementParking, AMENITY.intercom, AMENITY.fireSafety,
      ],
      media: {
        featuredImage: mediaIds['test-juhu-3bhk'],
        gallery: [mediaIds['test-juhu-3bhk-living'], mediaIds['test-juhu-3bhk-balcony']],
      },
    },
    {
      slug: 'rer-test-studio-goregaon-east-1bhk',
      title: 'RER Test Studio — Goregaon East 1 BHK',
      purpose: 'rent',
      propertyCategory: 'residential',
      propertyType: 'apartment',
      status: 'available',
      tags: ['featured', 'residential'],
      description: richText([
        'TEST LISTING. A compact 1 BHK suited to a single occupant or couple, within walking distance of the station road.',
        'This is fictional inventory created to exercise the Rajasthan Estate Realtors website.',
      ]),
      location: {
        locality: 'Goregaon East',
        area: 'Aarey Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Test Building 9, Sample Aarey Road, Goregaon East, Mumbai 400063',
      },
      pricing: {
        currency: 'INR',
        rentAmount: 32000,
        rentPeriod: 'monthly',
        securityDeposit: 192000,
        maintenanceCharges: 2500,
        maintenanceIncluded: false,
        brokerageFee: 32000,
        priceOnRequest: false,
      },
      details: {
        bedrooms: 1,
        bathrooms: 1,
        area: 420,
        areaUnit: 'sq-ft',
        furnishing: 'unfurnished',
        balconies: 1,
        propertyAge: 11,
        possessionStatus: 'ready-to-move',
      },
      buildingDetails: { buildingName: 'RER Test Residency', totalFloors: 8, floorNumber: 3, liftAvailable: true },
      amenities: [AMENITY.lift, AMENITY.security, AMENITY.waterSupply, AMENITY.openParking],
      media: { featuredImage: mediaIds['test-goregaon-1bhk'] },
    },
    {
      slug: 'rer-test-apartment-malad-west-2bhk',
      title: 'RER Test Apartment — Malad West 2 BHK',
      purpose: 'rent',
      propertyCategory: 'residential',
      propertyType: 'apartment',
      status: 'available',
      tags: ['residential'],
      description: richText([
        'TEST LISTING. A furnished 2 BHK in a gated development with a clubhouse and children’s play area, available on an eleven-month agreement.',
        'This is fictional inventory created to exercise the Rajasthan Estate Realtors website.',
      ]),
      location: {
        locality: 'Malad West',
        area: 'Link Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Test Plot 31, Sample Link Road, Malad West, Mumbai 400064',
      },
      pricing: {
        currency: 'INR',
        rentAmount: 58000,
        rentPeriod: 'monthly',
        securityDeposit: 348000,
        maintenanceCharges: 0,
        maintenanceIncluded: true,
        brokerageFee: 58000,
        priceOnRequest: false,
      },
      details: {
        bedrooms: 2,
        bathrooms: 2,
        area: 850,
        areaUnit: 'sq-ft',
        furnishing: 'furnished',
        balconies: 1,
        propertyAge: 4,
        possessionStatus: 'ready-to-move',
      },
      buildingDetails: { buildingName: 'RER Test Gardens', totalFloors: 16, floorNumber: 11, liftAvailable: true },
      amenities: [
        AMENITY.lift, AMENITY.security, AMENITY.cctv, AMENITY.clubhouse,
        AMENITY.playArea, AMENITY.gymnasium, AMENITY.coveredParking, AMENITY.powerBackup,
      ],
      media: { featuredImage: mediaIds['test-malad-2bhk'] },
    },
    {
      slug: 'rer-test-commercial-suite-lower-parel',
      title: 'RER Test Commercial Suite — Lower Parel Office Floor',
      purpose: 'sale',
      propertyCategory: 'commercial',
      propertyType: 'office',
      status: 'available',
      tags: ['featured', 'commercial'],
      description: richText([
        'TEST LISTING. A fitted office floor in a managed commercial building, arranged as four cabins, an open workstation bay and two meeting rooms.',
        'This is fictional inventory created to exercise the Rajasthan Estate Realtors website. It does not represent a real property or business address.',
      ]),
      location: {
        locality: 'Lower Parel',
        area: 'Senapati Bapat Marg',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Test Unit 501, Sample Corporate Park, Lower Parel, Mumbai 400013',
      },
      pricing: { currency: 'INR', price: 42000000, pricePerSqFt: 23333, negotiable: true, priceOnRequest: false },
      details: {
        area: 1800,
        areaUnit: 'sq-ft',
        furnishing: 'furnished',
        cabins: 4,
        workstations: 24,
        meetingRooms: 2,
        pantryAvailable: true,
        fitOutStatus: 'fitted',
      },
      buildingDetails: { buildingName: 'RER Test Corporate Park', totalFloors: 12, floorNumber: 5, liftAvailable: true },
      amenities: [
        AMENITY.lift, AMENITY.security, AMENITY.cctv, AMENITY.powerBackup,
        AMENITY.fireSafety, AMENITY.visitorParking, AMENITY.basementParking, AMENITY.maintenanceStaff,
      ],
      media: { featuredImage: mediaIds['test-lowerparel-office'] },
    },
  ];

  const propertyResults: string[] = [];
  for (const property of properties) {
    const existingId = await findExistingId(payload, 'properties', property.slug);
    const data = property as unknown as RequiredDataFromCollectionSlug<'properties'>;

    const doc = (existingId
      ? await payload.update({ collection: 'properties', id: existingId, data, overrideAccess: true })
      : await payload.create({ collection: 'properties', data, overrideAccess: true })) as SeededDoc;

    propertyResults.push(
      `${existingId ? 'updated' : 'created'} | id=${doc.id} | ${doc.propertyId} | ${property.slug} | ${property.purpose}/${property.propertyCategory}`,
    );
  }

  // ------------------------------------------------------------- projects
  const projects = [
    {
      slug: 'rer-test-residences-andheri-west',
      name: 'RER Test Residences — Andheri West',
      developer: 'RER Test Developments',
      status: 'under-construction',
      description: richText([
        'TEST PROJECT. A mid-premium residential development of 1, 2 and 3 BHK homes arranged across two towers, with a podium-level amenity deck.',
        'This is fictional data created to exercise the Rajasthan Estate Realtors website. It does not represent a real project, building or developer.',
      ]),
      highlights: [
        { text: 'Two towers of 21 floors each' },
        { text: 'Podium-level amenity deck' },
        { text: 'Walking distance to the metro corridor' },
      ],
      legal: { reraNumber: 'TESTRERA-AW-0001', reraInfo: 'Test RERA reference. Not a real registration number.' },
      location: {
        locality: 'Andheri West',
        area: 'Lokhandwala',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        address: 'Test Plot 44, Sample Link Road, Andheri West, Mumbai',
      },
      configurations: [
        { name: '1 BHK', carpetArea: 425, areaUnit: 'sq-ft', startingPrice: 13500000, availability: 'limited' },
        { name: '2 BHK', carpetArea: 690, areaUnit: 'sq-ft', startingPrice: 21900000, availability: 'available' },
        { name: '3 BHK', carpetArea: 980, areaUnit: 'sq-ft', startingPrice: 32500000, availability: 'available' },
      ],
      projectDetails: {
        projectType: 'residential',
        propertyType: 'apartment',
        possessionStatus: 'under-construction',
        constructionStatus: 'Tower A 14th slab in progress',
        numberOfTowers: 2,
        numberOfFloors: 21,
        totalUnits: 248,
        parkingInfo: 'Two levels of basement parking',
        developerDescription: 'RER Test Developments is a fictional developer used for website testing.',
      },
      amenities: [AMENITY.swimmingPool, AMENITY.gymnasium, AMENITY.clubhouse, AMENITY.playArea, AMENITY.joggingTrack, AMENITY.security, AMENITY.powerBackup],
      specifications: [
        { label: 'Flooring', value: 'Vitrified tiles in living and bedrooms' },
        { label: 'Kitchen', value: 'Granite counter with stainless steel sink' },
        { label: 'Windows', value: 'Powder-coated aluminium sliding windows' },
      ],
      nearbyConnectivity: {
        connections: [
          { name: 'Test Metro Station', category: 'metro', distance: 700, distanceUnit: 'm', displayOnWebsite: true },
          { name: 'Sample Link Road', category: 'road-highway', distance: 1.2, distanceUnit: 'km', displayOnWebsite: true },
          { name: 'Test International School', category: 'school', distance: 2.1, distanceUnit: 'km', displayOnWebsite: true },
        ],
      },
      media: {
        featuredImage: mediaIds['test-project-andheri'],
        gallery: [mediaIds['test-project-andheri-lobby']],
        masterPlan: mediaIds['test-project-masterplan'],
      },
    },
    {
      slug: 'rer-test-enclave-jogeshwari-east',
      name: 'RER Test Enclave — Jogeshwari East',
      developer: 'Test Estate Builders LLP',
      status: 'ready-to-move',
      description: richText([
        'TEST PROJECT. A completed residential enclave of 2 and 3 BHK homes with ready possession and a landscaped central garden.',
        'This is fictional data created to exercise the Rajasthan Estate Realtors website.',
      ]),
      highlights: [{ text: 'Ready possession' }, { text: 'Landscaped central garden' }],
      legal: { reraNumber: 'TESTRERA-JE-0002' },
      location: {
        locality: 'Jogeshwari East',
        area: 'Western Express Highway',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400060',
        address: 'Test Plot 7, Sample Service Road, Jogeshwari East, Mumbai',
      },
      configurations: [
        { name: '2 BHK', carpetArea: 640, areaUnit: 'sq-ft', startingPrice: 16800000, availability: 'available' },
        { name: '3 BHK', carpetArea: 910, areaUnit: 'sq-ft', startingPrice: 24200000, availability: 'limited' },
      ],
      projectDetails: {
        projectType: 'residential',
        propertyType: 'apartment',
        possessionStatus: 'ready-to-move',
        numberOfTowers: 1,
        numberOfFloors: 17,
        totalUnits: 96,
        parkingInfo: 'Stack parking at ground level',
        developerDescription: 'Test Estate Builders LLP is a fictional developer used for website testing.',
      },
      amenities: [AMENITY.garden, AMENITY.security, AMENITY.lift, AMENITY.cctv, AMENITY.playArea],
      specifications: [{ label: 'Flooring', value: 'Vitrified tiles' }],
      nearbyConnectivity: {
        connections: [
          { name: 'Western Express Highway', category: 'road-highway', distance: 900, distanceUnit: 'm', displayOnWebsite: true },
          { name: 'Test Railway Station', category: 'railway-station', distance: 1.6, distanceUnit: 'km', displayOnWebsite: true },
        ],
      },
      media: { featuredImage: mediaIds['test-project-jogeshwari'] },
    },
    {
      slug: 'rer-test-greens-goregaon-west',
      name: 'RER Test Greens — Goregaon West',
      developer: 'RER Test Developments',
      status: 'upcoming',
      description: richText([
        'TEST PROJECT. An upcoming development of compact 1 and 2 BHK homes aimed at first-time buyers, with pricing yet to be announced.',
        'This is fictional data created to exercise the Rajasthan Estate Realtors website.',
      ]),
      highlights: [{ text: 'Pre-launch registration open' }],
      location: {
        locality: 'Goregaon West',
        area: 'S.V. Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400062',
      },
      configurations: [
        { name: '1 BHK', carpetArea: 390, areaUnit: 'sq-ft', priceLabel: 'Price on request', availability: 'available' },
        { name: '2 BHK', carpetArea: 615, areaUnit: 'sq-ft', priceLabel: 'Price on request', availability: 'available' },
      ],
      projectDetails: {
        projectType: 'residential',
        propertyType: 'apartment',
        possessionStatus: 'under-construction',
        constructionStatus: 'Pre-launch',
        numberOfTowers: 1,
        numberOfFloors: 19,
        totalUnits: 132,
        developerDescription: 'RER Test Developments is a fictional developer used for website testing.',
      },
      amenities: [AMENITY.gymnasium, AMENITY.garden, AMENITY.security, AMENITY.lift],
      media: { featuredImage: mediaIds['test-project-goregaon'] },
    },
    {
      slug: 'rer-test-crown-malad-west',
      name: 'RER Test Crown — Malad West',
      developer: 'Sample Realty Test Group',
      status: 'under-construction',
      description: richText([
        'TEST PROJECT. A higher-band residential tower offering 2, 3 and 4 BHK homes, including duplex units on the upper floors.',
        'Amenities are arranged across a two-level club with a lap pool, indoor games room and a multipurpose hall.',
        'This is fictional data created to exercise the Rajasthan Estate Realtors website. It does not represent a real project or developer.',
      ]),
      highlights: [
        { text: 'Duplex units on upper floors' },
        { text: 'Two-level club with lap pool' },
        { text: 'Three levels of basement parking' },
        { text: 'Sea-facing units on the west side' },
      ],
      legal: { reraNumber: 'TESTRERA-MW-0004', reraInfo: 'Test RERA reference. Not a real registration number.' },
      location: {
        locality: 'Malad West',
        area: 'Marve Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400064',
        address: 'Test Plot 88, Sample Marve Road, Malad West, Mumbai',
      },
      configurations: [
        { name: '2 BHK', carpetArea: 745, areaUnit: 'sq-ft', startingPrice: 23900000, availability: 'available' },
        { name: '3 BHK', carpetArea: 1120, areaUnit: 'sq-ft', startingPrice: 36500000, availability: 'available' },
        { name: '4 BHK Duplex', carpetArea: 1980, minArea: 1980, maxArea: 2240, areaUnit: 'sq-ft', startingPrice: 68000000, maxPrice: 79000000, availability: 'limited' },
      ],
      projectDetails: {
        projectType: 'residential',
        propertyType: 'apartment',
        possessionStatus: 'under-construction',
        constructionStatus: '23rd slab in progress',
        numberOfTowers: 1,
        numberOfFloors: 34,
        totalUnits: 178,
        parkingInfo: 'Three levels of basement parking',
        developerDescription: 'Sample Realty Test Group is a fictional developer used for website testing.',
      },
      amenities: [
        AMENITY.swimmingPool, AMENITY.gymnasium, AMENITY.clubhouse, AMENITY.indoorGames,
        AMENITY.multipurposeHall, AMENITY.joggingTrack, AMENITY.playArea, AMENITY.basementParking,
        AMENITY.security, AMENITY.cctv, AMENITY.powerBackup, AMENITY.fireSafety,
      ],
      specifications: [
        { label: 'Flooring', value: 'Imported marble in living, engineered wood in bedrooms' },
        { label: 'Kitchen', value: 'Modular fittings with built-in hob and chimney' },
        { label: 'Doors', value: 'Engineered veneer main door with digital lock' },
        { label: 'Air conditioning', value: 'VRV provision in all rooms' },
      ],
      nearbyConnectivity: {
        connections: [
          { name: 'Test Metro Station', category: 'metro', distance: 1.4, distanceUnit: 'km', displayOnWebsite: true },
          { name: 'Sample Beach', category: 'park', distance: 2.8, distanceUnit: 'km', displayOnWebsite: true },
          { name: 'Test Multispeciality Hospital', category: 'hospital', distance: 1.1, distanceUnit: 'km', displayOnWebsite: true },
          { name: 'Sample Mall', category: 'shopping', distance: 3.2, distanceUnit: 'km', displayOnWebsite: true },
        ],
      },
      media: { featuredImage: mediaIds['test-project-malad'] },
    },
    {
      slug: 'rer-test-business-park-andheri-east',
      name: 'RER Test Business Park — Andheri East',
      developer: 'RER Test Developments',
      status: 'ready-to-move',
      description: richText([
        'TEST PROJECT. A commercial development of office suites and ground-floor retail units, with ready possession and fitted common areas.',
        'This is fictional data created to exercise the Rajasthan Estate Realtors website. It does not represent a real project, business park or developer.',
      ]),
      highlights: [{ text: 'Ready possession' }, { text: 'Ground-floor retail frontage' }],
      legal: { reraNumber: 'TESTRERA-AE-0005' },
      location: {
        locality: 'Andheri East',
        area: 'MIDC',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400093',
        address: 'Test Plot 12, Sample MIDC Road, Andheri East, Mumbai',
      },
      configurations: [
        { name: 'Office Suite', carpetArea: 640, minArea: 640, maxArea: 1250, areaUnit: 'sq-ft', startingPrice: 15400000, availability: 'available' },
        { name: 'Retail Unit', carpetArea: 410, areaUnit: 'sq-ft', startingPrice: 21800000, availability: 'limited' },
      ],
      projectDetails: {
        projectType: 'commercial',
        propertyType: 'office',
        possessionStatus: 'ready-to-move',
        numberOfTowers: 1,
        numberOfFloors: 11,
        totalUnits: 64,
        parkingInfo: 'Two levels of basement parking with visitor bays',
        developerDescription: 'RER Test Developments is a fictional developer used for website testing.',
      },
      amenities: [AMENITY.lift, AMENITY.security, AMENITY.cctv, AMENITY.powerBackup, AMENITY.fireSafety, AMENITY.visitorParking, AMENITY.maintenanceStaff],
      specifications: [
        { label: 'Common areas', value: 'Fitted lobby with reception counter' },
        { label: 'Lifts', value: 'Four passenger lifts and one service lift' },
      ],
      nearbyConnectivity: {
        connections: [
          { name: 'Test Metro Station', category: 'metro', distance: 850, distanceUnit: 'm', displayOnWebsite: true },
          { name: 'Sample International Airport', category: 'airport', distance: 4.5, distanceUnit: 'km', displayOnWebsite: true },
        ],
      },
      media: { featuredImage: mediaIds['test-project-business-park'] },
    },
  ];

  const projectResults: string[] = [];
  for (const project of projects) {
    const existingId = await findExistingId(payload, 'projects', project.slug);
    const data = project as unknown as RequiredDataFromCollectionSlug<'projects'>;

    const doc = (existingId
      ? await payload.update({ collection: 'projects', id: existingId, data, overrideAccess: true })
      : await payload.create({ collection: 'projects', data, overrideAccess: true })) as SeededDoc;

    projectResults.push(
      `${existingId ? 'updated' : 'created'} | id=${doc.id} | ${doc.projectId} | ${project.slug} | ${project.status}`,
    );
  }

  await fs.rm(tmpDir, { recursive: true, force: true });

  console.log('\n=== PROPERTIES ===');
  console.log(propertyResults.join('\n'));
  console.log('\n=== PROJECTS ===');
  console.log(projectResults.join('\n'));
  console.log('\nTest inventory is persistent. Delete manually from the admin when finished.');

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
