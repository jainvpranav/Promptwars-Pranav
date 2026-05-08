// src/lib/schemas/itinerary.schema.ts
import { z } from 'zod';

export const PlaceSchema = z.object({
  name: z.string(),
  address: z.string(),
  category: z.enum(['food', 'lodging', 'attraction', 'transport', 'activity', 'shopping']),
  duration: z.number().describe('minutes'),
  estimatedCost: z.number().describe('USD'),
  notes: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  rating: z.number().min(1).max(5).optional(),
  tip: z.string().optional(),
});

export const DayPlanSchema = z.object({
  dayNumber: z.number(),
  date: z.string(),
  theme: z.string(),
  emoji: z.string(),
  places: z.array(PlaceSchema),
  totalCost: z.number(),
  summary: z.string(),
});

export const ItinerarySchema = z.object({
  title: z.string(),
  destination: z.string(),
  days: z.array(DayPlanSchema),
  totalBudget: z.number(),
  currency: z.string().default('USD'),
  travelTips: z.array(z.string()),
  packingEssentials: z.array(z.string()),
  bestTimeToVisit: z.string(),
  transportationAdvice: z.string(),
});

export type Place = z.infer<typeof PlaceSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;
export type Itinerary = z.infer<typeof ItinerarySchema>;
