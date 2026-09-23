import Script from "next/script";

/**
 * Optional, cookieless analytics. Renders nothing at all until it is
 * configured, so the site ships with no tracking and no third-party request
 * unless someone deliberately turns it on.
 *
 * Why it is shaped as "provide a script URL" rather than naming a vendor:
 *
 * The one constraint that actually matters here is the cookie banner. RER
 * currently sets no cookies and runs no tracking, so it needs no consent
 * banner — see the Cookies section of /privacy-policy. Google Analytics would
 * end that: it writes `_ga` cookies and processes personal data, which under
 * the DPDP Act and for any EU visitor means a real consent mechanism, and a
 * consent mechanism means a banner on every page. That is a large, permanent
 * UX cost for a brochure site.
 *
 * A cookieless, aggregate-only product (Plausible, or a self-hosted Umami)
 * avoids that entirely, and both are loaded exactly this way: one deferred
 * script tag carrying the site's domain. So the integration is written once,
 * against that shape, and the operator picks the product.
 *
 * To enable, set both in the hosting environment and redeploy — they are
 * inlined at build time:
 *
 *   NEXT_PUBLIC_ANALYTICS_SRC     the vendor's script URL, https only
 *                                 e.g. https://plausible.io/js/script.js
 *   NEXT_PUBLIC_ANALYTICS_DOMAIN  the site domain the vendor registered
 *                                 e.g. rajasthanestaterealtors.in
 *
 * No values are committed to this repository; there is nothing to invent here
 * and a wrong value silently sends traffic data to the wrong account.
 *
 * `strategy="afterInteractive"` keeps it off the critical path: it loads after
 * hydration, so it cannot delay first paint or block the hero image. If the
 * chosen vendor ever needs a cookie, revisit the banner question first — do
 * not just swap the URL.
 */
export default function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;

  if (!src || !domain) {
    return null;
  }

  // An http:// or javascript: value here would be a mixed-content warning or
  // worse on every page of the site. Cheap to check, and it fails visibly in
  // the build log rather than quietly shipping.
  if (!src.startsWith("https://")) {
    console.warn(
      `[RER] NEXT_PUBLIC_ANALYTICS_SRC must be an https:// URL. Analytics not loaded (got "${src}").`,
    );
    return null;
  }

  return <Script src={src} data-domain={domain} strategy="afterInteractive" defer />;
}
