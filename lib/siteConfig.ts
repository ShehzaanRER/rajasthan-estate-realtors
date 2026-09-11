export const SITE_NAME = 'Rajasthan Estate Realtors';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export type Contact = {
  name: string;
  display: string;
  tel: string;
  whatsapp: string;
};

/**
 * Both partners' numbers. Names are only surfaced on /contact — everywhere
 * else the numbers are shown without names, so the site doesn't read as a
 * personal directory on every page.
 */
export const CONTACTS: Contact[] = [
  {
    name: 'Ayub Zamindar',
    display: '+91 9892371329',
    tel: '+919892371329',
    whatsapp: '919892371329',
  },
  {
    name: 'Shehzaan Zamindar',
    display: '+91 8657703113',
    tel: '+918657703113',
    whatsapp: '918657703113',
  },
];

/** Used where a single line of contact is correct: one "Call us" action, structured data. */
export const PRIMARY_CONTACT = CONTACTS[0];

export const CONTACT_PHONE_DISPLAY = PRIMARY_CONTACT.display;
export const CONTACT_PHONE_TEL = PRIMARY_CONTACT.tel;
export const CONTACT_WHATSAPP_NUMBER = PRIMARY_CONTACT.whatsapp;

export const CONTACT_EMAIL = 'rajasthanestaterealtors@gmail.com';
