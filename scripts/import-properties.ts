import fs from 'node:fs';
import { sql } from '@payloadcms/db-postgres';
import { getPayloadClient } from '../lib/payload';
import { createListingForLegacyProperty } from '../lib/listings/createFromLegacy';
import { calculateAgreementEndDate } from '../lib/properties/agreementDates';
import { RER_PROPERTY_ID_SEQUENCE } from '../collections/hooks/assignPropertyId';
import type { Property } from '../payload-types';

/**
 * Permanent CSV → Payload import for the `properties` collection, including
 * `rentHistory`, `ownerDetails` (Owner Name/Contact), `details.parking` and
 * `pricing.parkingCharges`. See docs/CLAUDE/DECISIONS.md for the design
 * rationale (Property ID / sequence handling in particular).
 *
 * DRY RUN unless PROPERTY_IMPORT_APPLY is set:
 *
 *   npx payload run scripts/import-properties.ts -- "<path-to-csv>"
 *   PROPERTY_IMPORT_APPLY=1 npx payload run scripts/import-properties.ts -- "<path-to-csv>"
 *
 * Idempotent: re-running matches on the CSV's exact `Property ID` string —
 * an existing match is UPDATE/SKIP, never a second CREATE.
 *
 * Never deletes, never overwrites a populated field with a blank CSV value,
 * never invents data. See the CSV → Payload mapping table in
 * docs/CLAUDE/DATA-MODEL.md (Properties CSV import section) for the full
 * column-by-column mapping and what is intentionally left unmapped.
 *
 * Optional explicit override — IMPORT_PROPERTY_ID_START=<n>: assigns every
 * CSV data row (in file order) a sequential target ID starting at <n>,
 * instead of trusting the CSV's own Property ID column. Does not change
 * assignPropertyId or add a new ID system — it only changes which number
 * this run primes the sequence to before each create. See
 * docs/CLAUDE/DECISIONS.md ("Property ID range for the first CSV import").
 */

// ============================================================== CSV parsing

/** Minimal RFC4180 parser — handles quoted fields with embedded commas/quotes. No dependency needed for this. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      pushField();
    } else if (c === '\r') {
      // ignore — \n (or end of text) terminates the row
    } else if (c === '\n') {
      pushRow();
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

// ========================================================= value parsing

type Blank = { kind: 'blank' };
type Invalid = { kind: 'invalid'; raw: string };
type Parsed<T> = { kind: 'ok'; value: T } | Blank | Invalid;

const BLANK: Blank = { kind: 'blank' };

function raw(cells: Record<string, string>, header: string): string {
  return (cells[header] ?? '').trim();
}

function parseNumber(text: string): Parsed<number> {
  if (!text) return BLANK;
  let s = text.replace(/[₹,\s]/g, '');
  let multiplier = 1;
  const cr = s.match(/^([\d.]+)\s*Cr$/i);
  const lakh = s.match(/^([\d.]+)\s*L(?:akh)?$/i);
  if (cr) {
    s = cr[1];
    multiplier = 1e7;
  } else if (lakh) {
    s = lakh[1];
    multiplier = 1e5;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return { kind: 'invalid', raw: text };
  return { kind: 'ok', value: n * multiplier };
}

/** DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, or an Excel serial date number. */
function parseDate(text: string): Parsed<{ date: Date; iso: string }> {
  if (!text) return BLANK;

  let m = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return { kind: 'invalid', raw: text };
    }
    return { kind: 'ok', value: { date, iso: date.toISOString() } };
  }

  m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(date.getTime())) return { kind: 'invalid', raw: text };
    return { kind: 'ok', value: { date, iso: date.toISOString() } };
  }

  // Excel serial date (epoch 30 Dec 1899). Only treated as a date when it's
  // a bare integer in a plausible range, so a real integer field is never
  // misread as a date.
  if (/^\d+$/.test(text)) {
    const serial = Number(text);
    if (serial > 20000 && serial < 80000) {
      const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
      const date = new Date(ms);
      if (!Number.isNaN(date.getTime())) {
        return { kind: 'ok', value: { date, iso: date.toISOString() } };
      }
    }
  }

  return { kind: 'invalid', raw: text };
}

function parseBhk(text: string): Parsed<number> {
  if (!text) return BLANK;
  const m = text.match(/^(\d+)\s*BHK$/i);
  if (!m) return { kind: 'invalid', raw: text };
  return { kind: 'ok', value: Number(m[1]) };
}

/** CSV parking values seen: "None" and a bare count (e.g. "1"). "None" means zero spots, not "unknown". */
function parseParking(text: string): Parsed<number> {
  if (!text) return BLANK;
  if (/^none$/i.test(text.trim())) return { kind: 'ok', value: 0 };
  return parseNumber(text);
}

/** Sets `value` at a dot-separated path on `obj`, creating intermediate objects as needed. */
function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (typeof cur[key] !== 'object' || cur[key] === null) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function mapSelect<T extends string>(text: string, options: Record<string, T>): Parsed<T> {
  if (!text) return BLANK;
  const key = text.trim().toLowerCase();
  const value = options[key];
  if (!value) return { kind: 'invalid', raw: text };
  return { kind: 'ok', value };
}

const STATUS_OPTIONS: Record<string, Property['status']> = {
  draft: 'draft',
  available: 'available',
  'under offer': 'under-offer',
  'under-offer': 'under-offer',
  sold: 'sold',
  rented: 'rented',
};

const PURPOSE_OPTIONS: Record<string, Property['purpose']> = {
  sale: 'sale',
  rent: 'rent',
  lease: 'lease',
};

const CATEGORY_OPTIONS: Record<string, NonNullable<Property['propertyCategory']>> = {
  residential: 'residential',
  commercial: 'commercial',
};

const PROPERTY_TYPE_OPTIONS: Record<string, Property['propertyType']> = {
  apartment: 'apartment',
  house: 'house',
  villa: 'villa',
  office: 'office',
  shop: 'shop',
  showroom: 'showroom',
  warehouse: 'warehouse',
  land: 'land',
  other: 'other',
};

const FURNISHING_OPTIONS: Record<string, NonNullable<NonNullable<Property['details']>['furnishing']>> = {
  unfurnished: 'unfurnished',
  'semi-furnished': 'semi-furnished',
  'semi furnished': 'semi-furnished',
  furnished: 'furnished',
  'fully furnished': 'furnished',
};

// carpetAreaUnit and builtUpAreaUnit share the same 'sq-ft' | 'sq-m' option
// set, so one lookup map (typed against either) covers both.
const AREA_UNIT_OPTIONS: Record<string, NonNullable<NonNullable<Property['details']>['carpetAreaUnit']>> = {
  'sq. ft.': 'sq-ft',
  'sq ft': 'sq-ft',
  sqft: 'sq-ft',
  'sq. m.': 'sq-m',
  'sq m': 'sq-m',
  sqm: 'sq-m',
};

// ================================================================ row model

type RowResult = {
  csvRowNumber: number;
  propertyId: string;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'REVIEW' | 'ERROR';
  errors: string[];
  warnings: string[];
  createData?: Record<string, unknown>;
  updateData?: Record<string, unknown>;
  updateChanges?: string[];
  rentHistoryReport?: {
    licensee: string;
    start: string | null;
    termMonths: number | null;
    calculatedEnd: string | null;
    csvEnd: string | null;
    result: 'MATCH' | 'DISCREPANCY' | 'NOT_COMPARABLE';
  };
  newFieldsReport?: {
    ownerName: string | null;
    ownerContact: string | null;
    parking: number | null;
    parkingCharges: number | null;
  };
  sequenceNumber?: number;
};

const HEADERS = {
  propertyId: 'Property ID',
  title: 'Property Title',
  status: 'Status',
  listingType: 'Listing Type',
  category: 'Category',
  propertyType: 'Property Type',
  location: 'Location',
  locality: 'Locality',
  flatNo: 'Flat No.',
  building: 'Building / Society',
  address: 'Address',
  carpetArea: 'Carpet Area',
  carpetAreaUnit: 'Carpet Area Unit',
  builtUpArea: 'Built-up Area',
  builtUpAreaUnit: 'Built-up Area Unit',
  bhk: 'BHK / Configuration',
  floor: 'Floor',
  totalFloors: 'Total Floors',
  furnishing: 'Furnishing',
  propertyAge: 'Property Age',
  askingPrice: 'Asking Price',
  rent: 'Rent',
  deposit: 'Deposit',
  maintenance: 'Maintenance',
  brokerage: 'Brokerage',
  licenseeName: 'Licensee Name',
  licenseeContact: 'Licensee Contact Number',
  agreementTerm: 'Agreement Term',
  agreementStart: 'Agreement Start Date',
  agreementEnd: 'Agreement End Date',
  ownerName: 'Owner Name',
  ownerContact: 'Owner Contact',
  parking: 'Parking',
  parkingCharges: 'Parking Charges',
} as const;

/** CSV columns with no destination in the current Properties schema. Never written. */
const UNMAPPED_COLUMNS: Record<string, string> = {
  Source: 'No "listing source" field exists on Properties. Distinct concept from rentHistory.rentalSource (which is about how the tenancy itself was sourced), so not mapped there either.',
  'Source Contact': 'Same as Source — no destination field.',
  Photos: 'No compatible existing Media mapping — creating Media records or references from a bare CSV value is out of scope and risks broken/fabricated references. Blank in this CSV.',
  Video: 'No video field exists on Properties. Blank in this CSV.',
  Documents: 'No documents field exists on Properties. Blank in this CSV.',
  'Owner Permission': 'No corresponding field. Blank in this CSV.',
  'Last Verified': 'No corresponding field. Blank in this CSV.',
  'Next Verification': 'No corresponding field. Blank in this CSV.',
  'Listing Ready': 'No corresponding field. Blank in this CSV.',
  Website: 'No corresponding field. Blank in this CSV.',
  Portals: 'No corresponding field. Blank in this CSV.',
  'Assigned To': 'No staff-assignment field exists on Properties. Blank in this CSV.',
  Remarks: 'No general internal-notes field at the property level (rentHistory has its own rentalNotes, which is tenancy-specific). Mapping free text into the public `description` field would risk leaking internal notes publicly. Blank in this CSV.',
};

function loadRows(csvPath: string): { headers: string[]; rows: Record<string, string>[] } {
  const text = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
  const table = parseCsv(text);
  const headers = table[0].map((h) => h.trim());
  const rows = table.slice(1).map((cols) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (cols[i] ?? '').trim();
    });
    return record;
  });
  return { headers, rows };
}

/** Same zero-padding convention as collections/hooks/assignPropertyId.ts. */
function formatPropertyId(n: number): string {
  return `RER-${String(n).padStart(5, '0')}`;
}

// =========================================================== main processing

async function main() {
  const csvPath = process.env.IMPORT_CSV_PATH || process.argv[2];
  if (!csvPath) {
    console.error('Usage: npx payload run scripts/import-properties.ts -- "<path-to-csv>"');
    console.error('   or: IMPORT_CSV_PATH="<path>" npx payload run scripts/import-properties.ts');
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exitCode = 1;
    return;
  }

  const apply = ['1', 'true', 'yes'].includes((process.env.PROPERTY_IMPORT_APPLY ?? '').toLowerCase());

  const overrideStartRaw = process.env.IMPORT_PROPERTY_ID_START;
  const overrideStart = overrideStartRaw ? Number(overrideStartRaw) : null;
  if (overrideStartRaw && (!Number.isInteger(overrideStart) || (overrideStart as number) < 1)) {
    console.error(`IMPORT_PROPERTY_ID_START must be a positive integer, got "${overrideStartRaw}".`);
    process.exitCode = 1;
    return;
  }

  const { headers, rows } = loadRows(csvPath);

  // effectiveIds[i] is what actually gets created/matched for row i. Default:
  // trust the CSV's own Property ID column. With the override set: assign
  // sequential IDs in file order instead (see docs/CLAUDE/DECISIONS.md).
  const effectiveIds = rows.map((r, i) =>
    overrideStart != null ? formatPropertyId(overrideStart + i) : raw(r, HEADERS.propertyId),
  );

  console.log(apply ? '\nMODE: APPLY — writes will be committed.\n' : '\nMODE: DRY RUN — set PROPERTY_IMPORT_APPLY=1 to commit.\n');
  if (overrideStart != null) {
    console.log(`PROPERTY ID OVERRIDE ACTIVE: assigning ${formatPropertyId(overrideStart)}–${formatPropertyId(overrideStart + rows.length - 1)} in CSV row order, ignoring the CSV's own Property ID column for identity/matching purposes.\n`);
  }
  console.log(`CSV rows: ${rows.length}\n`);

  const payload = await getPayloadClient();

  // ---------------------------------------------------- existing DB safety
  const existingProps = await payload.find({
    collection: 'properties',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
  });
  const existingById = new Map(
    existingProps.docs.filter((d) => d.propertyId).map((d) => [d.propertyId as string, d]),
  );
  console.log(`Existing properties in database: ${existingProps.totalDocs}`);

  // ------------------------------------------------- structural validation
  const seenInCsv = new Map<string, number>();
  const structuralErrors: string[] = [];
  rows.forEach((r, i) => {
    const id = raw(r, HEADERS.propertyId);
    const csvRow = i + 2; // header is row 1
    if (!id) {
      structuralErrors.push(`Row ${csvRow}: blank Property ID.`);
      return;
    }
    if (seenInCsv.has(id)) {
      structuralErrors.push(`Row ${csvRow}: duplicate Property ID "${id}" also seen at row ${seenInCsv.get(id)}.`);
    }
    seenInCsv.set(id, csvRow);
  });

  // Explicit STOP-on-collision check for the override range: every assigned
  // ID must be genuinely available. This is checked eagerly and separately
  // from the generic create/update branching below, because an override
  // collision must abort rather than silently fall through to an UPDATE.
  if (overrideStart != null) {
    effectiveIds.forEach((id, i) => {
      if (existingById.has(id)) {
        structuralErrors.push(
          `Row ${i + 2}: assigned Property ID "${id}" (via IMPORT_PROPERTY_ID_START) already exists in the database. Refusing to overwrite — choose a different start value or resolve the collision first.`,
        );
      }
    });
  }

  // Rows that will need a brand-new Property ID sequence allocation. Only
  // IDs matching the RER-<digits> shape the sequence itself produces can be
  // forced through nextval() priming (see docs/CLAUDE/DECISIONS.md) — this
  // never reformats the ID string that gets stored, it only tells Postgres
  // what number to hand out next.
  const RER_ID_PATTERN = /^RER-(\d+)$/;
  const createCandidates: { csvRow: number; propertyId: string; num: number }[] = [];
  rows.forEach((r, i) => {
    const id = effectiveIds[i];
    if (!id || existingById.has(id)) return;
    const m = id.match(RER_ID_PATTERN);
    if (m) {
      createCandidates.push({ csvRow: i + 2, propertyId: id, num: Number(m[1]) });
    }
  });
  createCandidates.sort((a, b) => a.num - b.num);

  let sequenceOk = true;
  if (createCandidates.length > 0) {
    const seqState = (await payload.db.drizzle.execute(
      sql.raw(`SELECT last_value, is_called FROM ${RER_PROPERTY_ID_SEQUENCE}`),
    )) as unknown as { rows: { last_value: string; is_called: boolean }[] };
    const { last_value, is_called } = seqState.rows[0];
    const nextExpected = is_called ? Number(last_value) + 1 : Number(last_value);

    // The sequence only ever needs to move FORWARD — skipping unused numbers
    // (e.g. reserved for property IDs that live outside this CSV) is safe,
    // exactly like syncIdSequence.ts already relies on. The only unsafe case
    // is a CSV target that has already been passed (an existing or
    // about-to-be-issued number), or two CSV rows racing for the same number.
    let floor = nextExpected;
    for (const c of createCandidates) {
      if (c.num < floor) {
        structuralErrors.push(
          `Row ${c.csvRow}: Property ID "${c.propertyId}" requires the ID sequence to produce ${c.num}, but the sequence is already past that point (next available = ${floor}). This would either collide with an existing record's ID or with another CSV row processed earlier in this same batch. New Property IDs must be created in ascending order because the collection's assignPropertyId hook always allocates from the sequence and cannot be given an arbitrary value directly (see docs/CLAUDE/DECISIONS.md).`,
        );
        sequenceOk = false;
      } else {
        floor = c.num + 1;
      }
    }
  }

  if (structuralErrors.length > 0) {
    console.log('STRUCTURAL VALIDATION FAILED — aborting before any writes:\n');
    structuralErrors.forEach((e) => console.log(`  - ${e}`));
    console.log('\nFix the CSV (or the database state) and re-run.');
    await payload.destroy();
    process.exitCode = 1;
    return;
  }

  // ------------------------------------------------------------ per-row pass
  const results: RowResult[] = [];

  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const csvRowNumber = i + 2;
    const csvPropertyId = raw(r, HEADERS.propertyId);
    const propertyId = effectiveIds[i];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (overrideStart != null && csvPropertyId && csvPropertyId !== propertyId) {
      warnings.push(`Property ID override active: CSV said "${csvPropertyId}", this run assigns "${propertyId}" instead (see docs/CLAUDE/DECISIONS.md).`);
    }

    const existing = existingById.get(propertyId);

    // ---- parse every field up front, independent of create/update ----
    const title = raw(r, HEADERS.title);
    const status = mapSelect(raw(r, HEADERS.status), STATUS_OPTIONS);
    const purpose = mapSelect(raw(r, HEADERS.listingType), PURPOSE_OPTIONS);
    const category = mapSelect(raw(r, HEADERS.category), CATEGORY_OPTIONS);
    const propertyType = mapSelect(raw(r, HEADERS.propertyType), PROPERTY_TYPE_OPTIONS);
    const location = raw(r, HEADERS.location); // → location.locality (see DECISIONS.md)
    const locality = raw(r, HEADERS.locality); // → location.area
    const flatNo = raw(r, HEADERS.flatNo);
    const building = raw(r, HEADERS.building);
    const address = raw(r, HEADERS.address);
    const carpetArea = parseNumber(raw(r, HEADERS.carpetArea));
    const carpetAreaUnit = raw(r, HEADERS.carpetAreaUnit);
    const builtUpArea = parseNumber(raw(r, HEADERS.builtUpArea));
    const builtUpAreaUnit = raw(r, HEADERS.builtUpAreaUnit);
    const bhk = parseBhk(raw(r, HEADERS.bhk));
    const floor = parseNumber(raw(r, HEADERS.floor));
    const totalFloors = parseNumber(raw(r, HEADERS.totalFloors));
    const furnishing = mapSelect(raw(r, HEADERS.furnishing), FURNISHING_OPTIONS);
    const propertyAge = parseNumber(raw(r, HEADERS.propertyAge));
    const askingPrice = parseNumber(raw(r, HEADERS.askingPrice));
    const rent = parseNumber(raw(r, HEADERS.rent));
    const deposit = parseNumber(raw(r, HEADERS.deposit));
    const maintenance = parseNumber(raw(r, HEADERS.maintenance));
    const brokerage = parseNumber(raw(r, HEADERS.brokerage));
    const licenseeName = raw(r, HEADERS.licenseeName);
    const licenseeContact = raw(r, HEADERS.licenseeContact);
    const agreementTermMonths = parseNumber(raw(r, HEADERS.agreementTerm));
    const agreementStart = parseDate(raw(r, HEADERS.agreementStart));
    const agreementEndCsv = parseDate(raw(r, HEADERS.agreementEnd));
    const ownerName = raw(r, HEADERS.ownerName);
    const ownerContact = raw(r, HEADERS.ownerContact);
    const parking = parseParking(raw(r, HEADERS.parking));
    const parkingCharges = parseNumber(raw(r, HEADERS.parkingCharges));

    if (!propertyId) {
      results.push({ csvRowNumber, propertyId: '(blank)', action: 'ERROR', errors: ['Blank Property ID.'], warnings });
      continue;
    }
    if (!title) errors.push('Property Title is blank — required.');
    if (status.kind === 'blank') errors.push('Status is blank — required.');
    if (status.kind === 'invalid') errors.push(`Status "${status.raw}" does not match a known option (draft/available/under-offer/sold/rented).`);
    if (purpose.kind === 'blank') errors.push('Listing Type is blank — required.');
    if (purpose.kind === 'invalid') errors.push(`Listing Type "${purpose.raw}" does not match a known option (sale/rent/lease).`);
    if (propertyType.kind === 'blank') errors.push('Property Type is blank — required.');
    if (propertyType.kind === 'invalid') errors.push(`Property Type "${propertyType.raw}" does not match a known option.`);
    if (category.kind === 'invalid') errors.push(`Category "${category.raw}" does not match a known option (residential/commercial).`);
    if (!location) errors.push('Location is blank — required (maps to location.locality).');
    if (furnishing.kind === 'invalid') errors.push(`Furnishing "${furnishing.raw}" does not match a known option.`);
    if (bhk.kind === 'invalid') errors.push(`BHK / Configuration "${bhk.raw}" is not in the expected "<N>BHK" shape.`);
    if (carpetArea.kind === 'invalid') errors.push(`Carpet Area "${carpetArea.raw}" is not a valid number.`);
    if (builtUpArea.kind === 'invalid') errors.push(`Built-up Area "${builtUpArea.raw}" is not a valid number.`);
    if (floor.kind === 'invalid') errors.push(`Floor "${floor.raw}" is not a valid number.`);
    if (totalFloors.kind === 'invalid') errors.push(`Total Floors "${totalFloors.raw}" is not a valid number.`);
    if (propertyAge.kind === 'invalid') errors.push(`Property Age "${propertyAge.raw}" is not a valid number.`);
    if (askingPrice.kind === 'invalid') errors.push(`Asking Price "${askingPrice.raw}" is not a valid number.`);
    if (rent.kind === 'invalid') errors.push(`Rent "${rent.raw}" is not a valid number.`);
    if (deposit.kind === 'invalid') errors.push(`Deposit "${deposit.raw}" is not a valid number.`);
    if (maintenance.kind === 'invalid') errors.push(`Maintenance "${maintenance.raw}" is not a valid number.`);
    if (brokerage.kind === 'invalid') errors.push(`Brokerage "${brokerage.raw}" is not a valid number.`);
    if (agreementTermMonths.kind === 'invalid') errors.push(`Agreement Term "${agreementTermMonths.raw}" is not a valid number.`);
    if (agreementStart.kind === 'invalid') errors.push(`Agreement Start Date "${agreementStart.raw}" could not be parsed.`);
    if (agreementEndCsv.kind === 'invalid') errors.push(`Agreement End Date "${agreementEndCsv.raw}" could not be parsed.`);
    if (parking.kind === 'invalid') errors.push(`Parking "${parking.raw}" is not "None" or a valid count.`);
    if (parkingCharges.kind === 'invalid') errors.push(`Parking Charges "${parkingCharges.raw}" is not a valid number.`);
    // Carpet Area and Built-up Area each have their own field
    // (details.carpetArea / details.builtUpArea) — a row with both
    // populated is normal and writes both, no reconciliation needed.

    if (status.kind === 'ok' && status.value === 'rented' && !licenseeName) {
      errors.push('Status is Rented but Licensee Name is blank — at least one Tenancy History entry (with a name) is required when status is Rented.');
    }

    if (errors.length > 0) {
      results.push({ csvRowNumber, propertyId, action: 'ERROR', errors, warnings });
      continue;
    }

    // ---- warnings for CSV columns that exist but have no destination ----
    Object.keys(UNMAPPED_COLUMNS).forEach((col) => {
      if (raw(r, col)) {
        warnings.push(`"${col}" has a value in the CSV ("${raw(r, col)}") but there is no destination field — left unmapped.`);
      }
    });

    const newFieldsReport: RowResult['newFieldsReport'] = {
      ownerName: ownerName || null,
      ownerContact: ownerContact || null,
      parking: parking.kind === 'ok' ? parking.value : null,
      parkingCharges: parkingCharges.kind === 'ok' ? parkingCharges.value : null,
    };

    // ---- area: each figure writes to its own field ----
    const carpetAreaValue = carpetArea.kind === 'ok' ? carpetArea.value : null;
    const carpetAreaUnitValue =
      carpetArea.kind === 'ok' ? ((AREA_UNIT_OPTIONS[carpetAreaUnit.toLowerCase()] ?? null) as string | null) : null;
    const builtUpAreaValue = builtUpArea.kind === 'ok' ? builtUpArea.value : null;
    const builtUpAreaUnitValue =
      builtUpArea.kind === 'ok' ? ((AREA_UNIT_OPTIONS[builtUpAreaUnit.toLowerCase()] ?? null) as string | null) : null;

    // ---- rent history row ----
    let rentHistoryEntry: Record<string, unknown> | null = null;
    let rentHistoryReport: RowResult['rentHistoryReport'];
    if (licenseeName) {
      const calculated =
        agreementStart.kind === 'ok' && agreementTermMonths.kind === 'ok'
          ? calculateAgreementEndDate({ startDate: agreementStart.value.date, termMonths: agreementTermMonths.value })
          : null;

      rentHistoryEntry = {
        licenseeName,
        licenseeContactNumber: licenseeContact || undefined,
        monthlyRent: rent.kind === 'ok' ? rent.value : undefined,
        securityDeposit: deposit.kind === 'ok' ? deposit.value : undefined,
        agreementStartDate: agreementStart.kind === 'ok' ? agreementStart.value.iso : undefined,
        agreementTermMonths: agreementTermMonths.kind === 'ok' ? agreementTermMonths.value : undefined,
      };

      const csvEndIso = agreementEndCsv.kind === 'ok' ? agreementEndCsv.value.iso.slice(0, 10) : null;
      const calcIso = calculated ? calculated.toISOString().slice(0, 10) : null;
      let result: 'MATCH' | 'DISCREPANCY' | 'NOT_COMPARABLE' = 'NOT_COMPARABLE';
      if (calcIso && csvEndIso) {
        result = calcIso === csvEndIso ? 'MATCH' : 'DISCREPANCY';
      }

      rentHistoryReport = {
        licensee: licenseeName,
        start: agreementStart.kind === 'ok' ? agreementStart.value.iso.slice(0, 10) : null,
        termMonths: agreementTermMonths.kind === 'ok' ? agreementTermMonths.value : null,
        calculatedEnd: calcIso,
        csvEnd: csvEndIso,
        result,
      };

      if (result === 'DISCREPANCY') {
        warnings.push(
          `rentHistory: CSV Agreement End Date (${csvEndIso}) differs from the calculated end date (${calcIso} = start + term). The calculated date is authoritative and is what gets stored; the CSV date is not written.`,
        );
      }
    }

    // ================================================================ CREATE
    if (!existing) {
      const createData: Record<string, unknown> = {
        title,
        status: (status as { kind: 'ok'; value: Property['status'] }).value,
        purpose: (purpose as { kind: 'ok'; value: Property['purpose'] }).value,
        propertyType: (propertyType as { kind: 'ok'; value: Property['propertyType'] }).value,
        propertyCategory: category.kind === 'ok' ? category.value : undefined,
        location: {
          locality: location,
          area: locality || undefined,
          address: address || undefined,
          flatNo: flatNo || undefined,
          city: /mumbai/i.test(address) ? 'Mumbai' : undefined,
        },
        pricing: {
          price: askingPrice.kind === 'ok' ? askingPrice.value : undefined,
          rentAmount: rent.kind === 'ok' ? rent.value : undefined,
          securityDeposit: deposit.kind === 'ok' ? deposit.value : undefined,
          maintenanceCharges: maintenance.kind === 'ok' ? maintenance.value : undefined,
          brokerageFee: brokerage.kind === 'ok' ? brokerage.value : undefined,
          parkingCharges: parkingCharges.kind === 'ok' ? parkingCharges.value : undefined,
        },
        details: {
          bedrooms: bhk.kind === 'ok' ? bhk.value : undefined,
          carpetArea: carpetAreaValue ?? undefined,
          carpetAreaUnit: carpetAreaUnitValue ?? undefined,
          builtUpArea: builtUpAreaValue ?? undefined,
          builtUpAreaUnit: builtUpAreaUnitValue ?? undefined,
          furnishing: furnishing.kind === 'ok' ? furnishing.value : undefined,
          propertyAge: propertyAge.kind === 'ok' ? propertyAge.value : undefined,
          parking: parking.kind === 'ok' ? parking.value : undefined,
        },
        buildingDetails: {
          buildingName: building || undefined,
          totalFloors: totalFloors.kind === 'ok' ? totalFloors.value : undefined,
          floorNumber: floor.kind === 'ok' ? floor.value : undefined,
        },
        ownerDetails: {
          ownerName: ownerName || undefined,
          ownerContact: ownerContact || undefined,
        },
        rentHistory: rentHistoryEntry ? [rentHistoryEntry] : undefined,
      };

      const m = propertyId.match(RER_ID_PATTERN);
      results.push({
        csvRowNumber,
        propertyId,
        action: 'CREATE',
        errors,
        warnings,
        createData,
        rentHistoryReport,
        newFieldsReport,
        sequenceNumber: m ? Number(m[1]) : undefined,
      });
      continue;
    }

    // ================================================================ UPDATE
    const updateData: Record<string, unknown> = {};
    const updateChanges: string[] = [];

    const setIfChanged = (path: string, csvValue: unknown, currentValue: unknown, target: Record<string, unknown>) => {
      if (csvValue === undefined || csvValue === null || csvValue === '') return;
      if (currentValue !== undefined && currentValue !== null && currentValue === csvValue) return;
      if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
        // Existing value present and different — do not blindly overwrite.
        warnings.push(`${path}: existing value "${String(currentValue)}" differs from CSV value "${String(csvValue)}" — left unchanged (existing data is not blindly overwritten).`);
        return;
      }
      setNested(target, path, csvValue);
      updateChanges.push(`${path} → ${String(csvValue)}`);
    };

    setIfChanged('title', title || undefined, existing.title, updateData);
    setIfChanged('location.address', address || undefined, existing.location?.address, updateData);
    setIfChanged('ownerDetails.ownerName', ownerName || undefined, existing.ownerDetails?.ownerName, updateData);
    setIfChanged('ownerDetails.ownerContact', ownerContact || undefined, existing.ownerDetails?.ownerContact, updateData);
    setIfChanged('details.parking', parking.kind === 'ok' ? parking.value : undefined, existing.details?.parking, updateData);
    setIfChanged('details.carpetArea', carpetAreaValue ?? undefined, existing.details?.carpetArea, updateData);
    setIfChanged('details.carpetAreaUnit', carpetAreaUnitValue ?? undefined, existing.details?.carpetAreaUnit, updateData);
    setIfChanged('details.builtUpArea', builtUpAreaValue ?? undefined, existing.details?.builtUpArea, updateData);
    setIfChanged(
      'details.builtUpAreaUnit',
      builtUpAreaUnitValue ?? undefined,
      existing.details?.builtUpAreaUnit,
      updateData,
    );
    setIfChanged('pricing.parkingCharges', parkingCharges.kind === 'ok' ? parkingCharges.value : undefined, existing.pricing?.parkingCharges, updateData);

    // rentHistory: additive only — append a new tenancy row when the CSV's
    // tenancy doesn't match the current (last) entry; never rewrite history.
    if (rentHistoryEntry) {
      const history = Array.isArray(existing.rentHistory) ? existing.rentHistory : [];
      const last = history[history.length - 1];
      const isSameTenancy =
        last &&
        last.licenseeName === licenseeName &&
        (last.agreementStartDate ?? '').slice(0, 10) === (rentHistoryEntry.agreementStartDate as string | undefined ?? '').slice(0, 10);

      if (!isSameTenancy) {
        updateData.rentHistory = [...history, rentHistoryEntry];
        updateChanges.push(`rentHistory → append tenancy for "${licenseeName}"`);
      }
    }

    if (Object.keys(updateData).length === 0) {
      results.push({ csvRowNumber, propertyId, action: 'SKIP', errors, warnings, rentHistoryReport, newFieldsReport });
    } else {
      results.push({ csvRowNumber, propertyId, action: 'UPDATE', errors, warnings, updateData, updateChanges, rentHistoryReport, newFieldsReport });
    }
  }

  // ==================================================================== report
  const counts = { CREATE: 0, UPDATE: 0, SKIP: 0, REVIEW: 0, ERROR: 0 };
  results.forEach((r) => counts[r.action]++);

  console.log(`CREATE: ${counts.CREATE}`);
  console.log(`UPDATE: ${counts.UPDATE}`);
  console.log(`SKIP: ${counts.SKIP}`);
  console.log(`REVIEW: ${counts.REVIEW}`);
  console.log(`ERROR: ${counts.ERROR}\n`);

  for (const r of results) {
    console.log(`Row ${r.csvRowNumber}`);
    console.log(`Property ID: ${r.propertyId}`);
    console.log(`Action: ${r.action}`);
    if (r.action === 'CREATE' && r.createData) {
      console.log('Mapped:');
      console.log(`  - propertyId → ${r.propertyId} (via sequence priming to ${r.sequenceNumber})`);
      console.log(`  - ${JSON.stringify(r.createData, null, 2).split('\n').join('\n  ')}`);
    }
    if (r.action === 'UPDATE' && r.updateChanges) {
      console.log('Changes:');
      r.updateChanges.forEach((c) => console.log(`  - ${c}`));
    }
    if (r.newFieldsReport && (r.newFieldsReport.ownerName || r.newFieldsReport.ownerContact)) {
      console.log('Owner Details:');
      console.log(`  Owner Name: ${r.newFieldsReport.ownerName ?? '(blank)'}`);
      console.log(`  Owner Contact: ${r.newFieldsReport.ownerContact ?? '(blank)'}`);
    }
    if (r.newFieldsReport && r.newFieldsReport.parking !== null) {
      console.log('Property Details:');
      console.log(`  Parking: ${r.newFieldsReport.parking}`);
    }
    if (r.newFieldsReport && r.newFieldsReport.parkingCharges !== null) {
      console.log('Pricing:');
      console.log(`  Parking Charges: ${r.newFieldsReport.parkingCharges}`);
    }
    if (r.rentHistoryReport) {
      const rh = r.rentHistoryReport;
      console.log('Rent History:');
      console.log(`  Licensee: ${rh.licensee}`);
      console.log(`  Start: ${rh.start}`);
      console.log(`  Term: ${rh.termMonths} months`);
      console.log(`  Calculated End: ${rh.calculatedEnd}`);
      console.log(`  CSV End: ${rh.csvEnd}`);
      console.log(`  Result: ${rh.result}`);
    }
    if (r.warnings.length > 0) {
      console.log('Warnings:');
      r.warnings.forEach((w) => console.log(`  - ${w}`));
    }
    if (r.errors.length > 0) {
      console.log('Errors:');
      r.errors.forEach((e) => console.log(`  - ${e}`));
    }
    console.log('');
  }

  console.log('UNMAPPED CSV COLUMNS\n');
  Object.entries(UNMAPPED_COLUMNS).forEach(([col, reason]) => {
    console.log(`- ${col}`);
    console.log(`  → ${reason}`);
  });

  if (!apply) {
    console.log('\nDry run complete. Nothing was written. Set PROPERTY_IMPORT_APPLY=1 to apply.');
    await payload.destroy();
    return;
  }

  // ======================================================================= apply
  console.log('\nApplying...\n');
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of results) {
    if (r.action === 'SKIP') {
      skipped += 1;
      continue;
    }

    if (r.action === 'ERROR') {
      console.log(`  x ${r.propertyId} — not written (row has errors, see report above)`);
      failed += 1;
      continue;
    }

    if (r.action === 'CREATE' && r.createData && r.sequenceNumber) {
      // setval(seq, N, false) means "N has not been consumed yet" — the next
      // nextval() returns exactly N without incrementing first. Using N-1
      // with is_called=true (the alternative) breaks at N=1, since sequences
      // have MINVALUE 1 and setval(seq, 0, ...) is out of bounds.
      await payload.db.drizzle.execute(
        sql.raw(`SELECT setval('${RER_PROPERTY_ID_SEQUENCE}', ${r.sequenceNumber}, false)`),
      );
      const doc = await payload.create({
        collection: 'properties',
        data: r.createData as never,
        overrideAccess: true,
        depth: 0,
      });
      if (doc.propertyId !== r.propertyId) {
        console.error(
          `  ! ${r.propertyId} — created as ${doc.propertyId} instead (sequence race). Manual review required — record was NOT deleted.`,
        );
        failed += 1;
        continue;
      }
      console.log(`  + ${r.propertyId} — created`);
      created += 1;

      // A property is only visible through a listing. The CSV still describes the
      // old single-record shape (purpose/status/pricing on the property), so the
      // listing it implies is created straight away by the same planner the
      // one-time migration uses — an imported record cannot bypass the listings
      // model. A failure here leaves the property in place and is reported.
      try {
        const { listingId, issues } = await createListingForLegacyProperty(payload, doc);
        console.log(`      listing ${listingId ?? '(already present)'}`);
        issues.forEach((issue) => console.log(`      ${issue.level}: ${issue.message}`));
      } catch (error) {
        failed += 1;
        console.error(
          `  ! ${r.propertyId} — property created but its listing was NOT: ${error instanceof Error ? error.message : String(error)}. Run scripts/migrate-property-listings.ts to retry.`,
        );
      }
      continue;
    }

    if (r.action === 'UPDATE' && r.updateData) {
      const existing = existingById.get(r.propertyId)!;
      await payload.update({
        collection: 'properties',
        id: existing.id,
        data: r.updateData as never,
        overrideAccess: true,
        depth: 0,
      });
      console.log(`  ~ ${r.propertyId} — updated`);
      updated += 1;

      // Parking charges are a listing-level term now. The importer still fills the
      // legacy property field (kept for the migration's copy), so mirror a newly
      // filled value onto the matching listing — never overwriting one that is set.
      const parking = (r.updateData as { pricing?: { parkingCharges?: number } }).pricing?.parkingCharges;
      if (typeof parking === 'number' && existing.purpose) {
        const found = await payload.find({
          collection: 'listings',
          where: {
            and: [{ property: { equals: existing.id } }, { transactionType: { equals: existing.purpose } }],
          },
          depth: 0,
          limit: 1,
          overrideAccess: true,
        });
        const listing = found.docs[0];
        if (listing && listing.pricing?.parkingCharges == null) {
          await payload.update({
            collection: 'listings',
            id: listing.id,
            data: { pricing: { parkingCharges: parking } },
            overrideAccess: true,
            depth: 0,
            context: { allowIncompleteListingPricing: true },
          });
          console.log(`      listing ${listing.listingId} — parking charges set`);
        }
      }
      continue;
    }
  }

  console.log(`\nSUMMARY: ${created} created, ${updated} updated, ${skipped} skipped, ${failed} failed.`);

  await payload.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
