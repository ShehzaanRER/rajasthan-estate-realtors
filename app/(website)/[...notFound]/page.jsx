import { notFound } from "next/navigation";

/**
 * Catch-all that exists purely so unmatched URLs render RER's own 404.
 *
 * The app has two root layouts — `(website)` and `(payload)` — and each one
 * renders its own `<html>`. When a URL matches no route at all, Next has no
 * way to choose between them, so it cannot render `(website)/not-found.jsx`
 * and falls back to its built-in "404 | This page could not be found" screen:
 * no Navbar, no Footer, no branding and no route back into the site. Only URLs
 * that reach a real route and then call `notFound()` themselves — a sold
 * property, a draft project — were getting the branded page.
 *
 * Claiming the unmatched URL inside `(website)` gives Next an unambiguous
 * layout, and `notFound()` then renders `(website)/not-found.jsx` with the
 * same HTTP 404 as before.
 *
 * This is the lowest-priority route in the app: literal segments and named
 * dynamic segments both outrank a catch-all, so `/properties/[slug]`,
 * `/admin/[[...segments]]`, `/api/[...slug]`, `/sitemap.xml` and every other
 * real route still win. It changes which *page* an unmatched URL renders, not
 * which URLs are unmatched.
 *
 * Deliberately no `loading.jsx` anywhere above this, for the reason documented
 * in PUBLIC-ROUTES.md — a Suspense boundary above a page commits HTTP 200
 * before the body runs, which would turn every one of these back into a soft
 * 404.
 */
export default function NotFoundCatchAll() {
  notFound();
}
