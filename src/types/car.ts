// src/types/car.ts

export type Car = {
  subCategory: any;
  onEdit(original: Car): void;
  id: string;
  vin: string;
  title: string;
  model: string;
  carClass?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  year: number;
  fuelType: string;
  transmission: string;
  mileage: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  description?: string;
  addresses?: {
    id: string;
    addressLabel: string;
  }[];
};
