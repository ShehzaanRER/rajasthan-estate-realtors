"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import PropertyCard from "../properties/PropertyCard";
import ProjectCard from "../projects/ProjectCard";
import CardSlider from "../ui/CardSlider";

/**
 * Track count drives the column count from `md` up. A fixed three-column grid
 * holding a single card leaves two empty columns, which reads as a broken
 * template rather than a curated selection. Below `md` the slider shows one
 * card at a time, so the count does not affect the layout there.
 */
function gridClassesFor(count) {
  if (count === 1) {
    return "md:max-w-xl md:grid-cols-1";
  }

  if (count === 2) {
    return "md:grid-cols-2 lg:max-w-4xl";
  }

  return "md:grid-cols-2 lg:grid-cols-3";
}

// whitespace-nowrap and the smaller mobile step keep both tabs on one line at
// 375px: stacked tabs read as two headings rather than as a choice.
function tabClasses(isActive) {
  return [
    "-mb-px whitespace-nowrap border-b-2 pb-2 font-serif text-xl font-medium tracking-tight transition-colors duration-200 sm:pb-3 sm:text-3xl md:text-4xl",
    isActive
      ? "border-[#B8862F] text-[#081221]"
      : "border-transparent text-slate-400 hover:text-[#081221]",
  ].join(" ");
}

/**
 * One section, two answers to "what does RER have right now" — resale units
 * and new developments. The visitor chooses; nothing rotates on its own.
 */
function FeaturedShowcase({ properties = [], projects = [] }) {
  const [activeTab, setActiveTab] = useState("properties");
  const tabRefs = useRef({});

  const tabs = [
    {
      key: "properties",
      label: "Featured Properties",
      blurb:
        "A selection of residential and commercial properties across Mumbai's Western Suburbs.",
      href: "/properties",
      linkLabel: "View All Properties",
      items: properties,
      emptyHeading: "Featured properties will appear here shortly.",
      emptyBody:
        "Please check back soon, or browse the full collection of properties currently available through Rajasthan Estate Realtors.",
      emptyLinkLabel: "Browse all properties",
    },
    {
      key: "projects",
      label: "New Projects",
      blurb:
        "New developments we are currently tracking across Jogeshwari, Andheri, Goregaon and Malad.",
      href: "/projects",
      linkLabel: "View All Projects",
      items: projects,
      emptyHeading: "No new launches are listed at the moment.",
      emptyBody:
        "We hear about new developments before they are widely marketed. Browse the projects currently on our books, or tell us what you are looking for.",
      emptyLinkLabel: "Browse all projects",
    },
  ];

  const active = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const count = active.items.length;

  // Arrow keys move between tabs the way a tablist is expected to behave;
  // the Tab key still moves out of the tablist to the panel below.
  const onTabKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();

    const index = tabs.findIndex((tab) => tab.key === activeTab);
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + offset + tabs.length) % tabs.length];

    setActiveTab(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <section id="properties" className="bg-[#F7F5F1] py-8 sm:py-12">

      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <h2 className="sr-only">Featured properties and new projects</h2>

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

          <div className="max-w-2xl">

            <div
              role="tablist"
              aria-label="Featured properties and new projects"
              onKeyDown={onTabKeyDown}
              className="flex items-end gap-x-6 border-b border-slate-300 sm:gap-x-8"
            >
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    id={`showcase-tab-${tab.key}`}
                    aria-selected={isActive}
                    aria-controls={`showcase-panel-${tab.key}`}
                    tabIndex={isActive ? 0 : -1}
                    ref={(node) => {
                      tabRefs.current[tab.key] = node;
                    }}
                    onClick={() => setActiveTab(tab.key)}
                    className={tabClasses(isActive)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-base leading-7 text-slate-600">
              {active.blurb}
            </p>

          </div>

          {/* The link follows the selection — it must never send someone
              looking at projects to the property listing. */}
          <Link
            href={active.href}
            className="group inline-flex w-fit items-center gap-3 border-b border-slate-300 pb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
          >
            {active.linkLabel}

            <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>

        <div
          role="tabpanel"
          id={`showcase-panel-${active.key}`}
          aria-labelledby={`showcase-tab-${active.key}`}
          tabIndex={-1}
        >
          {count === 0 ? (
            <div className="border border-slate-200 bg-white px-8 py-16 text-center sm:px-12">
              <p className="font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
                {active.emptyHeading}
              </p>

              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                {active.emptyBody}
              </p>

              <Link
                href={active.href}
                className="group mt-8 inline-flex items-center gap-3 border-b border-slate-300 pb-2 text-sm font-semibold uppercase tracking-[0.15em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
              >
                {active.emptyLinkLabel}

                <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          ) : (
            <CardSlider
              key={active.key}
              label={active.key === "properties" ? "property" : "project"}
              gridClassName={gridClassesFor(count)}
            >
              {active.key === "properties"
                ? active.items.map((property, index) => (
                    <PropertyCard
                      key={property.slug}
                      property={property}
                      priority={index === 0}
                    />
                  ))
                : active.items.map((project) => (
                    <ProjectCard key={project.slug} project={project} />
                  ))}
            </CardSlider>
          )}
        </div>

      </div>

    </section>
  );
}

export default FeaturedShowcase;
