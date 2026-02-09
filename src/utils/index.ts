export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export { getCdwCase, type CdwCase, type BookingWithCdw } from './cdw';
