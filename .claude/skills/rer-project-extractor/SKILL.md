---
name: rer-project-extractor
description: Extracts structured real-estate project data from a brochure, PDF text, or project marketing material into the exact JSON format required by Rajasthan Estate Realtors' "Brochure Convert" admin import tool. Use when the user pastes/uploads a property or project brochure and asks to convert it, extract it, or produce RER project JSON from it.
---

# RER Project Extractor

Convert real-estate brochure or project marketing material into a single JSON object matching RER's Brochure Convert import contract (v3) exactly. The output is pasted by an RER admin into an internal tool that validates it, runs deterministic matching/dedup logic, and creates an **unpublished draft** for human review — it is never published automatically. That human review is the safety net for anything this Skill gets wrong, which is exactly why accuracy and honesty about uncertainty matter more than completeness.

## Non-negotiable rules

1. **Extract only what is explicitly present in the supplied material.** Never invent, infer, guess, round, "fill in a typical value," or complete a partial fact — not a price, not a RERA number, not a location, not a unit count, not an amenity. If it isn't stated, the value is `null` (or `[]` for lists).
2. **When uncertain, prefer `null` over a plausible-sounding guess.** There is no follow-up turn to correct a wrong guess before the admin sees it.
3. **Output ONLY the JSON object.** No markdown code fences, no prose before or after it, no explanation, no commentary — just the raw JSON, ready to paste directly into Brochure Convert.
4. **Emit every key shown in the shape below, even when the value is `null` or `[]`.** Never omit a key. Never add a key that isn't in the shape.
5. **Never output `projectId`, `status`, or `slug`.** These are server-controlled by the RER application (a permanent sequential ID, a mandatory draft status, and an auto-generated slug). They are not part of this contract, are silently ignored if present, and this Skill must not emit them under any circumstance — not even as `null`.
6. **Enum fields must use one of their exact listed values, or `null`.** Any other string is invalid. The allowed enums are:
   - `configurations[].areaUnit`: `"sq-ft"` | `"sq-m"`
   - `configurations[].availability`: `"available"` | `"limited"` | `"sold-out"`
   - `projectDetails.projectType`: `"residential"` | `"commercial"` | `"mixed-use"`
   - `projectDetails.propertyType`: `"apartment"` | `"villa"` | `"office"` | `"shop"` | `"showroom"` | `"other"`
   - `projectDetails.possessionStatus`: `"ready-to-move"` | `"under-construction"`
   - `nearbyConnectivity.connections[].category`: `"transport"` | `"metro"` | `"railway-station"` | `"airport"` | `"road-highway"` | `"school"` | `"college"` | `"hospital"` | `"shopping"` | `"restaurant"` | `"business-district"` | `"park"` | `"religious-place"` | `"other"`
   - `nearbyConnectivity.connections[].distanceUnit`: `"km"` | `"m"`

## Field-specific rules

- **Pricing**: only put a number in `startingPrice`/`maxPrice` when the source states a single, unambiguous, absolute figure (e.g. "Rs. 85,00,000"). If the source uses wording like "onwards", "starting from", "approx", a range, "*T&C apply", or any other non-numeric qualifier — including common Indian real-estate phrasing like "₹1.35 Cr onwards" — leave `startingPrice` and `maxPrice` as `null` and copy the price text **verbatim** into `priceLabel`. Never convert lakhs/crore into a number yourself unless it is a single clean figure with no qualifying words. When in doubt, treat it as text, not a number.
- **RERA numbers**: copy exactly as printed in the source, character for character. Never invent, guess, or complete a partial or unclear RERA number.
- **Configurations**: list every distinct unit configuration mentioned (e.g. "1 BHK", "2 BHK", "3 BHK", "Retail Shop") as a **separate** object in `configurations` — do not merge, average, or collapse similarly-named configurations that have different areas or prices into one entry.
- **Amenities**: a flat list of amenity names/phrases exactly as they appear in the source (e.g. "Swimming Pool", "Clubhouse", "24x7 Security") — one string per amenity, no categorization, no added amenities. Never add commonly-expected amenities (e.g. "parking", "security") just because they're typical for this kind of project — only list what the source actually names.
- **Location**: `locality`, `area`, `city`, `state`, and `pincode` must each come from text actually present in the source. If the source only names a locality but never states the city, leave `city` as `null` rather than inferring it from common knowledge (e.g. do not infer `"city": "Mumbai"` just because a locality is a well-known Mumbai neighborhood — only set it if the source states it).
- **`possessionDate`**: free text exactly as stated (e.g. "December 2027", "Ready to move", "A and B wing ready, C wing by December 2026") — never reformatted or coerced into a calendar date.
- **Numeric project statistics** (`numberOfTowers`, `numberOfFloors`, `totalUnits`, `carpetArea`, `minArea`, `maxArea`, connectivity `distance`/`travelTimeMinutes`): must come directly from a number printed in the source. Never estimate, round to a "typical" value, or infer one number from another (e.g. do not infer `totalUnits` from `numberOfTowers` × `numberOfFloors`).
- **Nearby connectivity**: capture named nearby places with a stated distance or category (metro stations, highways, railway stations, schools, hospitals, etc.) as separate entries in `nearbyConnectivity.connections`. Only include a `category` value from the enum list above; if nothing fits, use `"other"` rather than guessing a more specific one. If no such places are mentioned, return `"connections": []`.
- **Specifications**: only include a `{label, value}` pair when the source states a specific spec (e.g. "Flooring" / "Vitrified tiles"). Do not fabricate a specifications table if the source has none — return `[]`.
- **Description**: a short plain-text summary drawn from the source's own project description wording, not your own paraphrase invented to sound complete. If the source has no descriptive text, use `null`.

## If the material doesn't look like a real-estate brochure at all

Still return the full JSON shape below with every field `null`/`[]` — do not refuse, and do not output anything other than that JSON object.

## Exact JSON shape to produce

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

**Never include `projectId`, `status`, or `slug` anywhere in the output — they do not appear in the shape above for a reason.**

## Complete worked example

Given brochure text such as:

> Ruparel SkyGreens — A 41 Storey Magnificent Tower with luxurious Amenities in the heart of the city @ New Linking Road - Kandivali West. 3 Towers A B C. 4 Signature Residences Per Floor. Current Status: A and B wing ready possession, C wing possession by December 2026. 1BHK - 423 - Rera Carpet @ 1.35 Cr All Inc + parking. 2BHK - 530 - Rera Carpet @ 1.65 Cr All Inc + parking. Rera Num: P51800012513. C wing 22nd Slab in progress. Amenities: Swimming Pool, Pool Deck, Society Office. Location: DhanukarWadi Junction, New Linking Road, Kandivali West. Western Express Highway – 3 km. Kandivali Railway Station – 2.8 km. Dahanukarwadi Metro Station – 500 M.

The correct output is:

```json
{
  "name": "Ruparel SkyGreens",
  "developer": null,
  "location": {
    "address": "DhanukarWadi Junction, New Linking Road",
    "locality": "Kandivali West",
    "area": null,
    "city": null,
    "state": null,
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
      "availability": null
    }
  ],
  "projectDetails": {
    "projectType": "residential",
    "propertyType": "apartment",
    "possessionStatus": "under-construction",
    "possessionDate": "A and B wing ready possession, C wing possession by December 2026",
    "constructionStatus": "C wing 22nd slab in progress",
    "numberOfTowers": 3,
    "numberOfFloors": null,
    "totalUnits": null,
    "parkingInfo": null,
    "developerDescription": null
  },
  "amenities": ["Swimming Pool", "Pool Deck", "Society Office"],
  "specifications": [],
  "nearbyConnectivity": {
    "connections": [
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
      },
      {
        "name": "Dahanukarwadi Metro Station",
        "category": "metro",
        "travelTimeMinutes": null,
        "distance": 500,
        "distanceUnit": "m"
      }
    ]
  }
}
```

Note what this example deliberately gets "wrong" by design: `developer`, `city`, `state`, `numberOfFloors`, and `parkingInfo` are all `null` because the sample text never states them — even though a real Ruparel SkyGreens brochure or general knowledge might suggest plausible values (e.g. the city is obviously Mumbai to a human reader). **This Skill must never fill those in from outside knowledge.** Only extract what this specific source document says.

## Workflow

1. Read the supplied brochure/project material in full (text, pasted content, or PDF text the user has already extracted).
2. Walk through the rules above field by field.
3. Produce exactly one JSON object matching the shape exactly — nothing before it, nothing after it.
4. Do not ask the user clarifying questions before producing output; if something is ambiguous or missing, resolve it with `null`/`[]` per the rules above and let the RER admin's human review step handle it.
