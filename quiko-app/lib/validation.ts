import { z } from "zod";

export const createPackageSchema = z
  .object({
    fromLabel: z.string().min(1, "Set a pickup location").max(120),
    fromLat: z.number().min(-90).max(90),
    fromLng: z.number().min(-180).max(180),
    toLabel: z.string().min(1, "Set a destination").max(120),
    toLat: z.number().min(-90).max(90),
    toLng: z.number().min(-180).max(180),
    travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional(),
    weightKg: z.number().min(0.1).max(15),
    declaredValue: z.number().int().min(0).max(1_000_000).optional(),
    timePreference: z.enum(["same_day", "next_day", "flexible"]),
    serviceLevel: z.enum(["flexible", "standard", "fast", "express"]).default("standard"),
    description: z.string().trim().min(3, "Add a short description").max(300),
    receiverName: z.string().trim().min(2).max(60).optional(),
    receiverPhone: z
      .string()
      .transform((s) => s.replace(/\D/g, ""))
      .refine((p) => p.length === 0 || (p.length >= 10 && p.length <= 15), "Enter a valid receiver phone")
      .optional(),
    offerPrice: z.number().int().positive(),
  })
  .refine((v) => v.fromLat !== v.toLat || v.fromLng !== v.toLng, {
    message: "Pickup and destination must differ",
    path: ["toLabel"],
  });

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

export const createTripSchema = z
  .object({
    fromLabel: z.string().min(1, "Set a start location").max(120),
    fromLat: z.number().min(-90).max(90),
    fromLng: z.number().min(-180).max(180),
    toLabel: z.string().min(1, "Set a destination").max(120),
    toLat: z.number().min(-90).max(90),
    toLng: z.number().min(-180).max(180),
    travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    arriveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    departTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
    arriveTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
    transport: z.enum(["flight", "train", "bus", "car"]),
    capacityKg: z.number().min(1).max(30),
    extraDetourKm: z.number().int().min(0).max(10).optional().default(0),
  })
  .refine((v) => v.fromLat !== v.toLat || v.fromLng !== v.toLng, {
    message: "Start and destination must differ",
    path: ["toLabel"],
  })
  .refine(
    (v) => v.arriveDate > v.travelDate || (v.arriveDate === v.travelDate && v.arriveTime >= v.departTime),
    { message: "Arrival must be after departure", path: ["arriveTime"] },
  );

export type CreateTripInput = z.infer<typeof createTripSchema>;

// Profile fields. Shared by onboarding and profile editing so the two paths
// can't drift — the bounds here are the server-side truth (the `maxLength`
// attributes in the forms are only a client-side hint).
export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(60, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(120, "Email is too long"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
