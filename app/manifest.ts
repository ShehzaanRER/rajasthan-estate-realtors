import type { MetadataRoute } from 'next';
import { SITE_NAME } from '../lib/siteConfig';

/**
 * Minimal manifest: enough for Android/Chrome to use the RER mark and brand
 * colours when a visitor adds the site to their home screen.
 *
 * Deliberately not a PWA. There is no service worker, no offline strategy and
 * no install prompt, so `display: 'browser'` is the honest value — claiming
 * `standalone` would strip the browser chrome from a site that has no
 * in-app navigation of its own to replace it.
 *
 * The icons are the same asset as `app/icon.png` and `app/apple-icon.png` —
 * the navy house mark from `public/logo-HOUSE.svg`, centred on an opaque white
 * square — so the tab icon and the home-screen icon match.
 *
 * The white ground is deliberate and is why these are opaque rather than
 * transparent: the mark exists only in navy and in white, so on a transparent
 * canvas one of the two browser themes would always lose it. A white tile
 * reads correctly in both.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'RER',
    description:
      "Residential and commercial real estate across Mumbai's Western Suburbs.",
    start_url: '/',
    display: 'browser',
    background_color: '#081221',
    theme_color: '#081221',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
