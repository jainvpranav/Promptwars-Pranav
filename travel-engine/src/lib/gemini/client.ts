// src/lib/gemini/client.ts
// SERVER-ONLY — never import in client components
import "server-only";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      (process.env.NODE_ENV === "production" ? "" : "dummy");
    if (!apiKey)
      throw new Error("GEMINI_API_KEY environment variable is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export const geminiModel = getGenAI().getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `You are WANDR, an expert travel planning AI. 
You create detailed, personalised, day-by-day travel itineraries.
You always respond with valid JSON matching the exact schema provided.
You consider local culture, opening hours, travel time between places, and budget constraints.
You suggest off-the-beaten-path gems alongside must-see highlights.`,
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 4096,
    temperature: 0.8,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

export function buildItineraryPrompt(params: {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelStyle: string;
  groupSize: number;
  interests: string[];
  dietary: string[];
  accessibility: string[];
}): string {
  const days = Math.ceil(
    (new Date(params.endDate).getTime() -
      new Date(params.startDate).getTime()) /
      86_400_000,
  );

  return `Create a ${days}-day travel itinerary for ${params.destination}.

Trip details:
- Start: ${params.startDate}, End: ${params.endDate} (${days} days)
- Total Budget: $${params.budget} USD
- Travel Style: ${params.travelStyle}
- Group Size: ${params.groupSize} people
- Interests: ${params.interests.join(", ")}
- Dietary Requirements: ${params.dietary.length ? params.dietary.join(", ") : "None"}
- Accessibility Needs: ${params.accessibility.length ? params.accessibility.join(", ") : "None"}

Return a JSON object with this EXACT structure:
{
  "title": "trip title",
  "destination": "${params.destination}",
  "days": [
    {
      "dayNumber": 1,
      "date": "${params.startDate}",
      "theme": "Arrival & First Impressions",
      "emoji": "✈️",
      "summary": "Brief day summary",
      "totalCost": 150,
      "places": [
        {
          "name": "Place name",
          "address": "Full address",
          "category": "attraction",
          "duration": 120,
          "estimatedCost": 25,
          "notes": "What to do/see here",
          "coordinates": { "lat": 0.0, "lng": 0.0 },
          "rating": 4.5,
          "tip": "Local insider tip"
        }
      ]
    }
  ],
  "totalBudget": ${params.budget},
  "currency": "USD",
  "travelTips": ["tip1", "tip2", "tip3"],
  "packingEssentials": ["item1", "item2"],
  "bestTimeToVisit": "description",
  "transportationAdvice": "advice"
}

Include 3-6 places per day. Ensure coordinates are accurate. Budget per person.`;
}
