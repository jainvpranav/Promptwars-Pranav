// src/lib/heatmap.ts
// Utilities for computing travel density from JSON data
import rawData from '@/data/travel-heatmap.json';

export interface Destination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  continent: string;
  travelerCount: number;
  avgBudget: number;
  tags: string[];
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  destination: Destination;
  adjustedCount: number;
}

/** Get the month key (01–12) from a date string */
function getMonthKey(dateStr: string): string {
  return String(new Date(dateStr).getMonth() + 1).padStart(2, '0');
}

/** Get the day-of-month index (0-based) */
function getDayIndex(dateStr: string): number {
  return new Date(dateStr).getDate() - 1;
}

/**
 * Returns weighted heatmap points for a given vacation period.
 * Multiplier is derived from monthly trends data in the JSON.
 */
export function getHeatmapPoints(startDate: string, endDate: string): HeatmapPoint[] {
  if (!startDate || !endDate) return [];

  const monthKey = getMonthKey(startDate);
  const dayIndex = getDayIndex(startDate);
  const trends = (rawData.monthlyTrends as Record<string, number[]>)[monthKey] ?? [];
  const multiplier = trends[Math.min(dayIndex, trends.length - 1)] ?? 0.7;

  return rawData.destinations.map((d: Destination) => {
    const adjustedCount = Math.round(d.travelerCount * multiplier);
    return {
      lat: d.lat,
      lng: d.lng,
      weight: adjustedCount / 7500, // normalise to 0-1 roughly
      destination: d,
      adjustedCount,
    };
  });
}

/** Get top N destinations by adjusted traveler count */
export function getTopDestinations(startDate: string, endDate: string, n = 5): HeatmapPoint[] {
  return getHeatmapPoints(startDate, endDate)
    .sort((a, b) => b.adjustedCount - a.adjustedCount)
    .slice(0, n);
}

/** Get all unique continents from destination data */
export function getContinents(): string[] {
  return [...new Set(rawData.destinations.map((d: Destination) => d.continent))].sort();
}

/** Filter destinations by continent */
export function getByContinent(continent: string): Destination[] {
  return rawData.destinations.filter((d: Destination) => d.continent === continent);
}

/** Format large numbers with K suffix */
export function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}
