// Framework-agnostic domain types for Quiko.
// NO React / Next imports here — this layer is reused as-is by the future
// React Native app. Keep it pure TypeScript.

export type Role = "sender" | "traveler";

export type TransportMode = "flight" | "train" | "bus";

export type TimePreference = "same_day" | "next_day" | "flexible";

export type City =
  | "Chennai"
  | "Mumbai"
  | "Delhi"
  | "Bangalore"
  | "Hyderabad"
  | "Kolkata";

/** A sender's package draft / posting. */
export interface PackageDraft {
  from: City;
  to: City;
  date: string; // ISO date
  weightKg: number;
  declaredValue: number; // ₹
  timePreference: TimePreference;
  description: string;
  offerPrice: number; // ₹ — what the sender offers (≤ maxPrice)
}

/** A traveler listing shown to senders when browsing. */
export interface Traveler {
  id: string;
  name: string;
  avatar: string; // emoji for now
  rating: number; // 0–5
  deliveries: number;
  verificationLevel: 1 | 2 | 3 | 4;
  transport: TransportMode;
  from: City;
  to: City;
  date: string;
  capacityKg: number;
  pickupArea: string;
  deliveryArea: string;
}

/** A package listing shown to travelers when browsing. */
export interface PackageListing {
  id: string;
  senderName: string;
  senderRating: number;
  from: City;
  to: City;
  date: string;
  weightKg: number;
  declaredValue: number;
  offerPrice: number;
  pickupArea: string;
}
