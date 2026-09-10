// Deterministic, keyword-based page classification. No AI API involved.
// Convenience only — the UI always lets a human override the result.

const CATEGORIES = [
  "developer-branding",
  "building-exterior",
  "building-exterior-night",
  "building-interior",
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "amenities",
  "swimming-pool",
  "clubhouse",
  "gym",
  "landscape",
  "floor-plan",
  "site-plan",
  "location-map",
  "connectivity-map",
  "commercial-office",
  "commercial-shop",
  "retail",
  "construction",
  "other",
];

// Ordered rules: first match wins. Order matters (strong/specific signals first).
const RULES = [
  { category: "floor-plan", keywords: ["floor plan", "carpet area", "built up area", "super built", "bhk", "rera carpet", "unit plan", "typical floor", "saleable area"] },
  { category: "site-plan", keywords: ["site plan", "master plan", "layout plan"] },
  { category: "connectivity-map", keywords: ["connectivity", "proximity to", "minutes from", "distance from", "nearby landmarks", "how to reach"] },
  { category: "location-map", keywords: ["location map", "location advantage", "google map", "situated at", "location "] },
  { category: "swimming-pool", keywords: ["swimming pool", "infinity pool", "poolside", "pool deck"] },
  { category: "clubhouse", keywords: ["clubhouse", "club house"] },
  { category: "gym", keywords: ["gymnasium", " gym ", "fitness centre", "fitness center"] },
  { category: "amenities", keywords: ["amenities", "lifestyle features", "world class features", "specifications & amenities"] },
  { category: "living-room", keywords: ["living room", "living area", "drawing room"] },
  { category: "bedroom", keywords: ["master bedroom", "bedroom"] },
  { category: "kitchen", keywords: ["modular kitchen", "kitchen"] },
  { category: "bathroom", keywords: ["bathroom", "washroom", "toilet"] },
  { category: "commercial-office", keywords: ["office space", "commercial office", "it park", "business hub", "corporate office"] },
  { category: "commercial-shop", keywords: ["shop no", "showroom", "retail shop", "commercial shop"] },
  { category: "retail", keywords: ["retail space", "retail outlet", "high street retail"] },
  { category: "construction", keywords: ["construction update", "under construction", "work in progress", "construction status", "progress as on"] },
  { category: "building-exterior-night", keywords: ["night view"] },
  { category: "building-exterior", keywords: ["elevation", "exterior view", "tower view", "facade", "skyline view"] },
  { category: "building-interior", keywords: ["interior view", "interiors"] },
  { category: "landscape", keywords: ["landscape", "garden", "green spaces", "podium garden"] },
];

function normalize(text) {
  return ` ${String(text || "").toLowerCase().replace(/\s+/g, " ")} `;
}

/**
 * @param {object} params
 * @param {string} params.text - extracted text for the page (may be empty)
 * @param {number} params.pageIndex - 0-based page index
 * @param {number} params.pageCount - total pages in the document
 * @returns {string} one of CATEGORIES
 */
function classifyPage({ text, pageIndex, pageCount }) {
  try {
    const normalized = normalize(text);
    const wordCount = normalized.trim().length ? normalized.trim().split(/\s+/).length : 0;

    for (const rule of RULES) {
      if (rule.keywords.some((kw) => normalized.includes(kw))) {
        return rule.category;
      }
    }

    // No keyword match: fall back to simple positional/text-density heuristics.
    if (pageIndex === 0 && wordCount < 25) {
      return "developer-branding";
    }
    if (wordCount < 15) {
      // Very little text and no keyword match: likely a full-bleed photo page.
      return pageIndex === 0 ? "developer-branding" : "building-exterior";
    }

    return "other";
  } catch {
    // Classification must never fail the overall conversion.
    return "other";
  }
}

module.exports = { CATEGORIES, classifyPage };
