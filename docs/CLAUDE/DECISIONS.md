# Architectural decisions

Decisions that shape how work is done in this repository. Each one is
supported by the current implementation; add new entries as decisions are
made, and update an entry if the code moves away from it.

## Payload is the source of truth for content

Property, project, amenity, partner and media content is entered in Payload and
drives the public website. The site reads it through the Payload **Local API**
(`lib/payload.ts`) inside server components — never by calling its own REST API
over HTTP. Nothing editable is hardcoded in React.

*Consequence:* new editable content means a collection or a field, not a
constant in a component.

## Properties and Projects stay separate

A Property is a single unit RER transacts on; a Project is a development with
configurations, towers and possession timelines. They have separate
collections, separate status vocabularies, separate `lib/` modules and separate
routes. The only things they share are the `amenities` master list, the `media`
collection and the media-folder hook.

*Consequence:* do not add a relationship between them, reuse one's mapper for
the other, or assume a feature built for one applies to the other. The rental
architecture and Channel Partners are Property/homepage concerns and do not
touch Projects.

## Public visibility is a query-layer rule, not a UI one

Whether a record reaches the public site is decided by status plus `where`
clauses in `lib/*/publicScope.ts`, applied with `overrideAccess: false`, and
backed by collection-level `read` access. It is never handled by omitting a
card in a component.

*Consequence:* the same rule automatically covers listings, detail routes,
feeds, related-items queries and the sitemap. Hiding something in the frontend
only would leave its slug, its API response and its sitemap entry live.

## Rental information belongs to the Property

`status: 'rented'` keeps the record in Payload and out of public inventory, and
the executed-agreement details live in a `rentDetails` group on the Property
itself, guarded by field-level read access and referenced by no public code.

There is deliberately **no separate rental-management system** — no tenancy
collection, no agreements collection, no relationships. Do not build one unless
it is explicitly requested.

## Channel Partners are a small dedicated collection

Partner logos are a five-field `channel-partners` collection (`name`, `logo`,
`websiteUrl`, `displayOrder`, `active`) rather than hardcoded frontend data,
so staff can add, reorder and retire partners without a code change.

It is deliberately not a partner CRM: no contacts, no agreements, no mapping to
projects. If richer partner data is ever needed, that is a new decision.

## One media delivery pipeline

Every CMS image goes through `toDeliveryImage()` (`lib/mediaUrl.ts`) and
`next/image`. The bounded `large` WebP derivative is the optimizer's input, not
the original upload, because feeding `next/image` a 48-megapixel camera file
cost a full download plus decode per generated width.

*Consequence:* do not introduce a second image system, a different optimizer,
or direct bucket URLs. Use the allow-listed `qualities` values only — Next 16
returns HTTP 400 for any other value.

Related: WebP only, no AVIF, because Next rescales the `quality` prop before
the AVIF encoder and the resulting quality ceiling visibly softened property
photography. And SVG uploads bypass the optimizer entirely (`unoptimized`),
since Payload produces no derivatives for them and rasterising a vector logo is
the one thing guaranteed to make it blurry.

## The partner carousel is CSS, not a dependency

The Official Channel Partners marquee is a CSS keyframe animation
(`src/index.css`) over a track that renders the partner sequence twice and
translates `-50%`, so the loop restart is invisible. The project had no
carousel or animation library, and a continuous logo ribbon did not justify
adding one. It needs no client JavaScript, so the section stays a server
component.

The existing `components/ui/CardSlider.jsx` was not reused: it is a discrete,
index-based, mobile-only slider with a "3 / 7" counter, which is a different
interaction from a continuous ribbon. For the same reason the marquee has no
arrows — hover and `:focus-within` pause it instead, and
`prefers-reduced-motion` turns it into a plain horizontal scroller.

## Interface text is unselectable; content is not

`src/index.css` marks real controls (`button, summary, [role="button"]`)
`user-select: none` at zero specificity, and decorative text opts in with
Tailwind's `select-none` on the element. Meaningful content — titles,
descriptions, prices, addresses, contact details — stays selectable and
copyable. Do not make the site broadly unselectable.
