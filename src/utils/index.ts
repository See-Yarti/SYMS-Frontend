export const isProduction = import.meta.env.MODE === "production";
export const isDevelopment = import.meta.env.MODE === "development";
export { getCdwCase, type CdwCase, type BookingWithCdw } from "./cdw";