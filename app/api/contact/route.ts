import { NextResponse } from 'next/server';
import { getPayloadClient } from '../../../lib/payload';

export const runtime = 'nodejs';

const REQUIREMENT_VALUES = [
  'buy-property',
  'rent-property',
  'sell-property',
  'new-project',
  'commercial-property',
  'general-enquiry',
] as const;

const NAME_MAX = 120;
const EMAIL_MAX = 254;
const PHONE_MAX = 20;
const MESSAGE_MAX = 2000;
const SOURCE_MAX = 200;

/** Loose but real-world Indian-friendly phone check: 7-15 digits, optional +/spaces/dashes. */
const PHONE_PATTERN = /^[+]?[\d\s-]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimum time between the form rendering and submitting. A real visitor
 * reading a form and typing into it takes longer than this; a bot that
 * fills and submits immediately on page load does not. Paired with the
 * honeypot field below as a lightweight, dependency-free spam deterrent —
 * intentionally not a captcha or third-party anti-spam service.
 */
const MIN_SUBMIT_MS = 2000;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid request body.');
  }

  // Honeypot: a real visitor never sees or fills this field. Any value here
  // means the request almost certainly came from an automated bot.
  if (isNonEmptyString(body.company)) {
    // Respond as if successful so the bot gets no signal to adapt on.
    return NextResponse.json({ ok: true });
  }

  const renderedAt = typeof body.renderedAt === 'number' ? body.renderedAt : null;
  if (renderedAt !== null) {
    const elapsed = Date.now() - renderedAt;
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
      return badRequest('Please try again.');
    }
  }

  const name = isNonEmptyString(body.name) ? body.name.trim().slice(0, NAME_MAX) : '';
  const phone = isNonEmptyString(body.phone) ? body.phone.trim().slice(0, PHONE_MAX) : '';
  const emailRaw = isNonEmptyString(body.email) ? body.email.trim().slice(0, EMAIL_MAX) : '';
  const requirement = typeof body.requirement === 'string' ? body.requirement : '';
  const message = isNonEmptyString(body.message) ? body.message.trim().slice(0, MESSAGE_MAX) : '';
  const source = isNonEmptyString(body.source) ? body.source.trim().slice(0, SOURCE_MAX) : null;

  if (!name || name.length < 2) {
    return badRequest('Please enter your name.');
  }

  if (!phone || !PHONE_PATTERN.test(phone)) {
    return badRequest('Please enter a valid phone number.');
  }

  if (emailRaw && !EMAIL_PATTERN.test(emailRaw)) {
    return badRequest('Please enter a valid email address.');
  }

  if (!REQUIREMENT_VALUES.includes(requirement as (typeof REQUIREMENT_VALUES)[number])) {
    return badRequest('Please select what you are looking for.');
  }

  if (!message || message.length < 5) {
    return badRequest('Please enter a short message.');
  }

  const payload = await getPayloadClient();

  await payload.create({
    collection: 'contact-inquiries',
    // Built explicitly field-by-field (never spread `body`) so a client can
    // never set privileged fields like `status` or `notes`.
    data: {
      name,
      phone,
      email: emailRaw || undefined,
      requirement: requirement as (typeof REQUIREMENT_VALUES)[number],
      message,
      source: source ?? undefined,
    },
    overrideAccess: true,
  });

  return NextResponse.json({ ok: true });
}
