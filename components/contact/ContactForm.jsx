"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { recordEngagement } from "../../lib/enquiryPopupStorage";

const REQUIREMENT_OPTIONS = [
  { value: "buy-property", label: "Buy Property" },
  { value: "rent-property", label: "Rent Property" },
  { value: "sell-property", label: "Sell Property" },
  { value: "new-project", label: "New Project" },
  { value: "commercial-property", label: "Commercial Property" },
  { value: "general-enquiry", label: "General Enquiry" },
];

const PHONE_PATTERN = /^[+]?[\d\s-]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClasses =
  "h-14 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] md:text-sm";
const errorFieldClasses = "border-red-400 focus:border-red-400 focus:ring-red-400";

function validate(values) {
  const errors = {};

  if (!values.name.trim() || values.name.trim().length < 2) {
    errors.name = "Please enter your name.";
  }

  if (!values.phone.trim() || !PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.requirement) {
    errors.requirement = "Please select what you are looking for.";
  }

  if (!values.message.trim() || values.message.trim().length < 5) {
    errors.message = "Please tell us a little about your requirement.";
  }

  return errors;
}

/** Only accept an incoming intent that matches a real option in the select. */
function normalizeRequirement(value) {
  return REQUIREMENT_OPTIONS.some((option) => option.value === value) ? value : "";
}

function ContactForm({ defaultRequirement = "" }) {
  const pathname = usePathname();
  const [renderedAt] = useState(() => Date.now());
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    requirement: normalizeRequirement(defaultRequirement),
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [serverError, setServerError] = useState("");

  const updateField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setStatus("submitting");
    setServerError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          source: pathname || "/contact",
          renderedAt,
          company: "",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setServerError(
          data?.message || "Something went wrong. Please try again, or reach us directly.",
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      recordEngagement();
      setValues({
        name: "",
        phone: "",
        email: "",
        requirement: normalizeRequirement(defaultRequirement),
        message: "",
      });
    } catch {
      setServerError("Something went wrong. Please try again, or reach us directly.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#B8862F]/30 bg-[#F5F0E8] p-8 text-center sm:p-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B8862F]">
          Thank You
        </p>
        <p className="mt-4 font-serif text-2xl font-medium text-[#081221] sm:text-3xl">
          Thank you. Your enquiry has been received.
        </p>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Our team will get in touch shortly.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-[#081221]/25 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#081221] transition-colors duration-300 hover:border-[#B8862F] hover:text-[#B8862F]"
        >
          Send Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(8,18,33,0.08)] sm:p-8"
    >
      {/* Honeypot field: hidden from sighted and screen-reader users, left
          empty by real visitors. Any bot that fills every field trips it.
          `sr-only` (not an off-screen absolute offset) so it never affects
          document width or introduces horizontal scroll. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company || ""}
          onChange={(event) =>
            setValues((current) => ({ ...current, company: event.target.value }))
          }
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-name"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500"
          >
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={updateField("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={`${fieldClasses} ${errors.name ? errorFieldClasses : ""}`}
          />
          {errors.name ? (
            <p id="contact-name-error" className="text-xs text-red-500">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-phone"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500"
          >
            Phone
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={updateField("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            className={`${fieldClasses} ${errors.phone ? errorFieldClasses : ""}`}
          />
          {errors.phone ? (
            <p id="contact-phone-error" className="text-xs text-red-500">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-email"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500"
          >
            Email <span className="normal-case text-slate-400">(optional)</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={updateField("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={`${fieldClasses} ${errors.email ? errorFieldClasses : ""}`}
          />
          {errors.email ? (
            <p id="contact-email-error" className="text-xs text-red-500">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="contact-requirement"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500"
          >
            I Am Looking To
          </label>
          <select
            id="contact-requirement"
            value={values.requirement}
            onChange={updateField("requirement")}
            aria-invalid={Boolean(errors.requirement)}
            aria-describedby={errors.requirement ? "contact-requirement-error" : undefined}
            className={`${fieldClasses} ${errors.requirement ? errorFieldClasses : ""}`}
          >
            <option value="">Select an option</option>
            {REQUIREMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.requirement ? (
            <p id="contact-requirement-error" className="text-xs text-red-500">
              {errors.requirement}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label
            htmlFor="contact-message"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            value={values.message}
            onChange={updateField("message")}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-800 outline-none transition focus:border-[#B8862F] focus:ring-1 focus:ring-[#B8862F] md:text-sm ${
              errors.message ? errorFieldClasses : ""
            }`}
          />
          {errors.message ? (
            <p id="contact-message-error" className="text-xs text-red-500">
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      {serverError ? (
        <p role="alert" className="mt-5 text-sm font-medium text-red-500">
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group mt-7 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#B8862F] px-7 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#081221] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#CCA251] hover:shadow-[0_12px_30px_rgba(184,134,47,0.25)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
      >
        {status === "submitting" ? "Sending..." : "Send Enquiry"}
      </button>
    </form>
  );
}

export default ContactForm;
