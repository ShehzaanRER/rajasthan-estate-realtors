# Rajasthan Estate Realtors
## Product Requirements Document

Version: 1.0

---

# 1. Product Overview

Rajasthan Estate Realtors (RER) is a family-run real estate consultancy in Mumbai operating since 1988.

The website is intended to become the company's primary digital presence and lead-generation platform.

The website should communicate the trust, local knowledge and relationship-driven nature of the business while providing a modern, easy-to-use property discovery experience.

The website is not intended to become an unnecessarily complex real-estate portal.

---

# 2. Business Positioning

RER should be positioned as:

- Experienced
- Trustworthy
- Local
- Relationship-driven
- Professional
- Knowledgeable
- Premium but approachable

The business has a long-standing connection with Jogeshwari and Mumbai's Western Suburbs.

The founder/proprietor is Mr. Hanif Zamindar.

The business was started in 1988, with the founder establishing the business as one of the early real-estate agents in Jogeshwari.

The website should communicate the company's history through authentic storytelling rather than exaggerated claims.

---

# 3. Primary Website Goals

## Goal 1 — Generate property enquiries

Visitors should be able to quickly:

- discover properties
- understand property details
- contact RER
- enquire through appropriate channels

## Goal 2 — Generate seller/landlord leads

The website should eventually support owners looking to:

- sell
- rent
- lease
- market their property

## Goal 3 — Establish local authority

The website should build RER's organic and brand authority around:

- Jogeshwari
- Mumbai Western Suburbs
- relevant surrounding locations

## Goal 4 — Build trust

Trust should come from:

- company history
- founder story
- genuine reviews
- local expertise
- professional presentation
- transparent information
- consistent brand identity

## Goal 5 — Showcase property opportunities

RER should be able to present:

- residential properties
- commercial properties
- resale opportunities
- rental opportunities
- new developments
- relevant projects

---

# 4. Target Audiences

## Buyers

People looking for residential or commercial property.

## Tenants

People looking for rental opportunities.

## Sellers

Property owners seeking professional assistance.

## Landlords

Owners looking for tenants and rental assistance.

## Investors

People evaluating Mumbai real-estate opportunities.

## New Development Enquirers

People interested in new projects/developments in or around Jogeshwari.

---

# 5. Homepage Objectives

The homepage should be concise.

It should not become a long collection of generic sections.

Potential structure:

1. Hero
2. Property search
3. Featured properties
4. New developments
5. RER trust/legacy
6. Founder/company story
7. Strong enquiry CTA
8. Footer

The final structure may change after additional competitor research and UX review.

---

# 6. Hero

The hero is the primary visual statement.

It should:

- communicate RER's positioning
- establish location relevance
- provide a clear action
- work perfectly on mobile
- load quickly
- use high-quality imagery

AI-generated imagery may be used for hero backgrounds where appropriate.

Text should remain HTML rather than being embedded into the image.

---

# 7. Property Search

The search interface should eventually allow users to identify:

- transaction purpose
- property type
- location
- budget
- other relevant filters

The current search interface is a visual foundation and is not yet fully connected to data.

Future search functionality must be designed around the actual property database.

---

# 8. Featured Properties

Featured properties should be data-driven.

The admin system should eventually allow an authorized user to mark a listing as featured.

The homepage should display a limited number of strong opportunities.

Do not create an enormous property grid on the homepage.

---

# 9. New Developments

A dedicated homepage section should highlight relevant new projects/developments in or near Jogeshwari.

This section should be concise.

New developments should eventually be managed through the same property/project administration system rather than hardcoded into the homepage.

---

# 10. Property Pages

Every property should have a unique URL.

Target structure:

/properties/[slug]

Each property page should contain only information useful to a prospective buyer/tenant/investor.

Potential content:

- property title
- location
- price
- property type
- transaction type
- area
- bedrooms
- bathrooms
- images
- description
- amenities/features
- relevant tags
- enquiry actions

---

# 11. Property Data & Tags

The property system must use structured data rather than relying on hardcoded property objects.

Every property must have a permanent, unique RER Property ID.

Example:

RER-000001

The RER Property ID must:

- be automatically generated
- be unique
- remain permanently associated with the property
- never be reused
- not depend on the property title or URL slug
- not be manually editable during normal administration

## Core Property Classification

Properties should support:

- Residential
- Commercial

Property types should be appropriate to the selected category.

Examples:

Residential:
- Apartment
- Villa
- Bungalow
- Penthouse
- Plot

Commercial:
- Office
- Shop
- Showroom
- Warehouse
- Commercial Building
- Plot

## Transaction Type

Properties should support:

- Sale
- Rent

The system should remain extensible for future transaction types where justified.

## Website Controls

The following controls are separate from property tags:

- Active / Inactive
- Featured
- New Listing

Active / Inactive controls whether the property is publicly available.

Featured controls whether the property can appear in Featured Properties.

New Listing controls whether the property can appear in New Listings.

These controls should not be implemented merely as ordinary marketing tags.

## Controlled Property Tags

Properties should support multiple controlled tags.

Initial tag vocabulary:

### Listing / Opportunity

- Exclusive
- Hot Property
- Price Reduced
- Investment Opportunity
- Value Buy
- High Rental Yield
- Distress Sale
- Urgent Sale
- Below Market Value

### Development

- New Build
- New Development
- Under Construction
- Near Possession
- Ready to Move
- Redevelopment
- Redevelopment Opportunity
- Pre-Launch
- Recently Completed

### Property Condition

- Resale
- Brand New
- Fully Renovated
- Partly Renovated
- Fully Furnished
- Semi-Furnished
- Unfurnished
- Bare Shell

The controlled tag vocabulary should be reviewed periodically and expanded only when useful for RER's actual inventory and user journeys.

Tags should be reusable and selectable rather than manually typed for every property.

## Features & Amenities

Features and amenities should remain separate from marketing/opportunity tags.

Examples:

- Parking
- Lift
- Security
- Power Backup
- Gym
- Swimming Pool
- Clubhouse
- Garden
- Balcony
- Modular Kitchen
- Air Conditioning
- Natural Light
- Sea View

The final feature taxonomy should remain manageable and relevant to RER's inventory.

## Property Relationships

Properties should support relationships to:

- Area
- Project
- Builder
- Features/Amenities
- Media

Project and Builder relationships should be optional because not every resale or independent property will belong to a defined project or builder.

## Development / Project Information

New developments and projects should support project-level information such as:

- Project name
- Builder
- Area
- Project description
- Configurations
- Amenities
- Builder schemes/offers
- Possession information
- Project images
- Active/inactive status

Builder schemes should initially support flexible descriptive content rather than a complex financial system.

## Property Images

The property system must support:

- multiple image uploads
- image reordering
- cover image selection
- image removal
- appropriate image optimisation
- image metadata such as alt text where appropriate

The original uploaded image should not necessarily be served directly to every website visitor. Responsive/optimised versions should be used where appropriate.

## Property Publication State

Properties should support:

- Draft
- Published

A published property can then be:

- Active
- Inactive

An inactive property should be hidden from public property listings while remaining in the database.

Properties should not be deleted merely because they are sold, rented, leased or otherwise unavailable.

Where useful, future availability statuses may include:

- Available
- Sold
- Rented
- Leased

The final relationship between publication state, visibility and availability should be established during technical implementation.

## Database as Source of Truth

The long-term property source of truth must be the database.

The existing:

src/data/properties.js

file is temporary migration data.

Once database integration is verified, public property components should read from the database rather than relying on hardcoded property inventory.

Existing property UI components should be reused where practical rather than unnecessarily rebuilt.

---

# 12. Admin Panel

The future admin panel should allow non-technical RER staff to manage listings.

Potential functions:

- login
- create property
- edit property
- publish/unpublish
- upload images
- manage property information
- assign location
- assign type
- assign transaction type
- assign tags
- mark featured
- manage new developments
- manage status

The admin panel should not be developed until the property model is finalized.

---

# 13. About Page

The About page should explain:

- RER's history
- founder story
- local expertise
- relationship-driven philosophy
- current direction

The founder portrait is stored in:

public/Hanif_AboutUs.png

The founder should be identified accurately as:

Mr. Hanif Zamindar
Founder / Proprietor

---

# 14. Mobile Experience

Mobile is a critical requirement.

The current website has mobile layout issues that must eventually be corrected.

Priority areas:

- hero
- navbar
- property cards
- search
- typography
- image cropping
- spacing
- CTA buttons
- footer

The mobile website must feel intentionally designed rather than compressed from desktop.

---

# 15. SEO

SEO is a major objective.

The website should eventually include:

- unique metadata
- crawlable routes
- property URLs
- location pages where justified
- internal linking
- sitemap
- robots.txt
- structured data
- optimized images
- semantic HTML
- strong local relevance

Primary strategic focus:

Mumbai Western Suburbs and particularly Jogeshwari.

SEO must be natural and useful.

---

# 16. Performance

The website should prioritize:

- fast initial load
- optimized hero images
- responsive images
- minimal client JavaScript
- server rendering where appropriate
- optimized fonts
- minimal dependencies

Core Web Vitals should be monitored before launch.

---

# 17. Technology

Current migration target:

- Next.js App Router
- React
- Tailwind CSS v4
- Next Image
- Next Font
- GitHub

Current Express backend remains temporarily during migration.

Future architecture may use:

- Next.js Route Handlers
- database
- authentication
- admin panel

Final choices will be made before implementation.

---

# 18. Design Philosophy

The website should be:

- Minimal
- Premium
- Readable
- Elegant
- Trustworthy
- Fast
- Mobile-first

Avoid unnecessary sections and decorative complexity.

---

# 19. Competitor Strategy

Gupta & Sen is a key strategic benchmark.

The benchmark should focus on:

- SEO/location-page architecture
- content strategy
- seller lead generation
- trust signals
- market intelligence/report concept
- real-estate authority positioning

RER should learn from strategic strengths without copying visual design or inconsistent elements.

Additional competitor research will be documented separately.

---

# 20. Success Criteria

The website should ultimately:

- look professional on desktop and mobile
- clearly communicate RER's identity
- allow users to discover properties easily
- generate enquiries
- support scalable property management
- support strong local SEO
- load quickly
- be maintainable by developers
- allow future admin/database integration
- provide a strong foundation for long-term digital growth