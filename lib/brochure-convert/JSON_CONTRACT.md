# Brochure Convert — JSON Contract (v3)

This is the exact JSON shape the RER Claude Skill must produce for the admin to paste into **Brochure Convert** (`/admin/brochure-convert`). It is validated against `ExtractedProjectData` in [types.ts](./types.ts) by `validateExtractedProject` in [validateProject.ts](./validateProject.ts) — those two files are the single source of truth; this document must be kept in sync with them.

## Rules for the skill

- **Emit every key shown below, even when the value is `null` or `[]`.** Never omit a key.
- **Never invent data not present in the source.** Use `null`/`[]` for anything not stated. When uncertain, prefer `null` over a plausible-sounding guess — there is no follow-up turn to correct a wrong guess.
- **Prices**: only put a number in `startingPrice`/`maxPrice` for a single, unambiguous, absolute figure. Anything with "onwards", "starting from", "approx", a range, or other qualifying words must have `startingPrice`/`maxPrice` as `null` and the exact price text copied verbatim into `priceLabel`.
- **RERA numbers**: copy exactly as printed, character for character. Never invent or complete a partial number.
- **Configurations**: one array entry per distinct unit configuration — never merge or average.
- **Amenities**: flat list of names/phrases exactly as printed, no categorization.
- **`possessionDate`**: free text exactly as stated (e.g. `"December 2027"`) — never reformatted into a calendar date.
- **Never set `projectId`, `status`, or `slug`.** These are server-controlled. If included, they are ignored and the admin is shown a warning — but the skill should not emit them at all.
- **Enum fields** (`areaUnit`, `projectType`, `propertyType`, `possessionStatus`, `availability`, `nearbyConnectivity.connections[].category`, `nearbyConnectivity.connections[].distanceUnit`) must use one of the exact values listed below, or `null`. Any other string is treated as invalid, nulled, and flagged for the admin.

## Shape

```json
{
  "name": "string | null",
  "developer": "string | null",
  "location": {
    "address": "string | null",
    "locality": "string | null",
    "area": "string | null",
    "city": "string | null",
    "state": "string | null",
    "pincode": "string | null"
  },
  "legal": {
    "reraNumber": "string | null",
    "reraInfo": "string | null"
  },
  "description": "string | null",
  "highlights": ["string"],
  "configurations": [
    {
      "name": "string | null",
      "carpetArea": "number | null",
      "minArea": "number | null",
      "maxArea": "number | null",
      "areaUnit": "'sq-ft' | 'sq-m' | null",
      "startingPrice": "number | null",
      "maxPrice": "number | null",
      "priceLabel": "string | null",
      "notes": "string | null",
      "availability": "'available' | 'limited' | 'sold-out' | null"
    }
  ],
  "projectDetails": {
    "projectType": "'residential' | 'commercial' | 'mixed-use' | null",
    "propertyType": "'apartment' | 'villa' | 'office' | 'shop' | 'showroom' | 'other' | null",
    "possessionStatus": "'ready-to-move' | 'under-construction' | null",
    "possessionDate": "string | null",
    "constructionStatus": "string | null",
    "numberOfTowers": "number | null",
    "numberOfFloors": "number | null",
    "totalUnits": "number | null",
    "parkingInfo": "string | null",
    "developerDescription": "string | null"
  },
  "amenities": ["string"],
  "specifications": [{ "label": "string", "value": "string" }],
  "nearbyConnectivity": {
    "connections": [
      {
        "name": "string | null",
        "category": "'transport' | 'metro' | 'railway-station' | 'airport' | 'road-highway' | 'school' | 'college' | 'hospital' | 'shopping' | 'restaurant' | 'business-district' | 'park' | 'religious-place' | 'other' | null",
        "travelTimeMinutes": "number | null",
        "distance": "number | null",
        "distanceUnit": "'km' | 'm' | null"
      }
    ]
  }
}
```

## Complete example

```json
{
  "name": "Ruparel SkyGreens",
  "developer": null,
  "location": {
    "address": "DhanukarWadi Junction, New Linking Road",
    "locality": "Kandivali West",
    "area": null,
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": null
  },
  "legal": {
    "reraNumber": "P51800012513",
    "reraInfo": null
  },
  "description": "A 41 storey tower with luxurious amenities in the heart of the city at New Linking Road, Kandivali West.",
  "highlights": [
    "41 Storey Magnificent Tower",
    "3 Towers A, B, C",
    "4 Signature Residences Per Floor"
  ],
  "configurations": [
    {
      "name": "1 BHK",
      "carpetArea": 423,
      "minArea": null,
      "maxArea": null,
      "areaUnit": "sq-ft",
      "startingPrice": null,
      "maxPrice": null,
      "priceLabel": "1.35 Cr All Inc + parking",
      "notes": null,
      "availability": null
    },
    {
      "name": "2 BHK",
      "carpetArea": 530,
      "minArea": null,
      "maxArea": null,
      "areaUnit": "sq-ft",
      "startingPrice": null,
      "maxPrice": null,
      "priceLabel": "1.65 Cr All Inc + parking",
      "notes": null,
      "availability": "limited"
    }
  ],
  "projectDetails": {
    "projectType": "residential",
    "propertyType": "apartment",
    "possessionStatus": "under-construction",
    "possessionDate": "December 2026",
    "constructionStatus": "C wing 22nd slab in progress",
    "numberOfTowers": 3,
    "numberOfFloors": 41,
    "totalUnits": null,
    "parkingInfo": "Separate Car Park Tower",
    "developerDescription": null
  },
  "amenities": ["Swimming Pool", "Pool Deck", "Society Office"],
  "specifications": [],
  "nearbyConnectivity": {
    "connections": [
      {
        "name": "Dahanukarwadi Metro Station",
        "category": "metro",
        "travelTimeMinutes": null,
        "distance": 500,
        "distanceUnit": "m"
      },
      {
        "name": "Western Express Highway",
        "category": "road-highway",
        "travelTimeMinutes": null,
        "distance": 3,
        "distanceUnit": "km"
      },
      {
        "name": "Kandivali Railway Station",
        "category": "railway-station",
        "travelTimeMinutes": null,
        "distance": 2.8,
        "distanceUnit": "km"
      }
    ]
  }
}
```

## What still requires human review after import (by design)

- **`projectDetails.possessionDate`** is captured as free text but is never written to the Payload `possessionDate` date field (which requires an exact month/year) — it's surfaced as a review note on the draft for the admin to set manually.
- **Unmatched amenities** (names that don't exactly match an existing Amenities record) are not added to the project — they're surfaced as a review note. No new Amenity records are ever auto-created.
- **`configurations[].availability`** and **`nearbyConnectivity.connections[]`** are new as of contract v3 — always double-check them in the editor, since this is their first round of live use.
- Nothing this contract produces is ever published automatically. Every import creates a `status: 'draft'` project; a human must review and change the status in the normal Payload editor.
