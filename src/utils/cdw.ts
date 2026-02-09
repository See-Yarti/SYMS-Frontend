/**
 * CDW case determination for single & list booking APIs.
 * Use with GET /booking/get-booking-by-id/:bookingId or each booking in list APIs.
 *
 * Cases:
 * - NONE: No CDW selected
 * - 1: PART_OF_RENTAL – tax was on (rental + CDW)
 * - 2: SEPARATE, no tax on CDW
 * - 3: SEPARATE, tax on CDW
 */
export type CdwCase = 'NONE' | 1 | 2 | 3;

export interface BookingWithCdw {
  cdwSelected?: boolean;
  cdwOption?: string | null;
  cdwBreakdown?: {
    taxOnCdwApplicable?: boolean;
    taxOnCdwAmount?: number | string;
    [key: string]: unknown;
  } | null;
}

export function getCdwCase(booking: BookingWithCdw): CdwCase {
  if (!booking.cdwSelected || booking.cdwOption == null) return 'NONE';
  if (booking.cdwOption === 'PART_OF_RENTAL') return 1;
  const taxOnCdw =
    booking.cdwBreakdown?.taxOnCdwApplicable === true ||
    Number(booking.cdwBreakdown?.taxOnCdwAmount ?? 0) > 0;
  return taxOnCdw ? 3 : 2;
}
