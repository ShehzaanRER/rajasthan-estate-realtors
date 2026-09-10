import type { Property } from '../../payload-types';
import type { PublicPricing } from './types';

const PRICE_ON_REQUEST = 'Price on request';

function trimNumericString(value: string): string {
  if (!value.includes('.')) {
    return value;
  }

  return value.replace(/\.?0+$/, '');
}

function formatCroreOrLakhAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return trimNumericString(rounded.toFixed(2));
}

function formatIndianGroupedInteger(amount: number): string {
  const digits = String(Math.abs(Math.round(amount)));

  if (digits.length <= 3) {
    return digits;
  }

  const lastThree = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const groups: string[] = [];

  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }

  if (rest) {
    groups.unshift(rest);
  }

  return `${groups.join(',')},${lastThree}`;
}

export function formatInrDisplay(amount: number | null | undefined): string | null {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (amount >= 10_000_000) {
    return `₹${formatCroreOrLakhAmount(amount / 10_000_000)} Cr`;
  }

  if (amount >= 100_000) {
    return `₹${formatCroreOrLakhAmount(amount / 100_000)} Lakh`;
  }

  return `₹${formatIndianGroupedInteger(amount)}`;
}

function rentPeriodSuffix(period: PublicPricing['rentPeriod']): string {
  if (period === 'quarterly') {
    return '/ quarter';
  }

  if (period === 'yearly') {
    return '/ year';
  }

  return '/ month';
}

function asPositiveNumber(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

export function mapPricing(
  purpose: Property['purpose'],
  pricing: Property['pricing'] | null | undefined,
): PublicPricing {
  const priceOnRequest = pricing?.priceOnRequest === true;
  const rentPeriod = pricing?.rentPeriod ?? (purpose === 'rent' ? 'monthly' : null);

  const salePrice = asPositiveNumber(pricing?.price);
  const rentAmount = asPositiveNumber(pricing?.rentAmount);
  const monthlyLeasePayment = asPositiveNumber(pricing?.monthlyLeasePayment);
  const totalLeaseAmount = asPositiveNumber(pricing?.totalLeaseAmount);

  let primaryAmount: number | null = null;
  let displayPrice = PRICE_ON_REQUEST;

  if (priceOnRequest) {
    displayPrice = PRICE_ON_REQUEST;
    primaryAmount = null;
  } else if (purpose === 'sale') {
    primaryAmount = salePrice;
    displayPrice = formatInrDisplay(salePrice) ?? PRICE_ON_REQUEST;
  } else if (purpose === 'rent') {
    primaryAmount = rentAmount ?? salePrice;
    const formatted = formatInrDisplay(primaryAmount);
    displayPrice = formatted
      ? `${formatted} ${rentPeriodSuffix(rentPeriod)}`
      : PRICE_ON_REQUEST;
  } else {
    if (monthlyLeasePayment) {
      primaryAmount = monthlyLeasePayment;
      const formatted = formatInrDisplay(monthlyLeasePayment);
      displayPrice = formatted ? `${formatted} / month` : PRICE_ON_REQUEST;
    } else if (totalLeaseAmount) {
      primaryAmount = totalLeaseAmount;
      const formatted = formatInrDisplay(totalLeaseAmount);
      displayPrice = formatted ? `${formatted} total` : PRICE_ON_REQUEST;
    } else {
      primaryAmount = salePrice;
      displayPrice = formatInrDisplay(salePrice) ?? PRICE_ON_REQUEST;
    }
  }

  return {
    currency: 'INR',
    priceOnRequest: priceOnRequest || displayPrice === PRICE_ON_REQUEST,
    negotiable: pricing?.negotiable === true,
    displayPrice,
    primaryAmount,
    rentPeriod: purpose === 'rent' ? rentPeriod : null,
    pricePerSqFt: asPositiveNumber(pricing?.pricePerSqFt),
    additionalCharges: asPositiveNumber(pricing?.additionalCharges),
    securityDeposit: asPositiveNumber(pricing?.securityDeposit),
    maintenanceCharges: asPositiveNumber(pricing?.maintenanceCharges),
    maintenanceIncluded: pricing?.maintenanceIncluded === true,
    brokerageFee: asPositiveNumber(pricing?.brokerageFee),
    totalLeaseAmount,
    monthlyLeasePayment,
  };
}
