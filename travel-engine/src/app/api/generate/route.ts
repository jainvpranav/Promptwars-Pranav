// src/app/api/generate/route.ts
// Gemini itinerary generation endpoint — server-side only

import { NextRequest, NextResponse } from "next/server";
import { geminiModel, buildItineraryPrompt } from "@/lib/gemini/client";
import { ItinerarySchema } from "@/lib/schemas/itinerary.schema";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      groupSize,
      interests,
      dietary,
      accessibility,
    } = body;

    // Input validation
    if (!destination || !startDate || !endDate || !budget) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (destination.length > 100 || destination.length < 2) {
      return NextResponse.json(
        { error: "Invalid destination" },
        { status: 400 },
      );
    }
    if (
      isNaN(Number(budget)) ||
      Number(budget) < 100 ||
      Number(budget) > 100000
    ) {
      return NextResponse.json(
        { error: "Budget out of valid range" },
        { status: 400 },
      );
    }

    const prompt = buildItineraryPrompt({
      destination: String(destination).slice(0, 100),
      startDate,
      endDate,
      budget: Number(budget),
      travelStyle: String(travelStyle || "balanced"),
      groupSize: Math.min(20, Math.max(1, Number(groupSize || 2))),
      interests: Array.isArray(interests) ? interests.slice(0, 10) : [],
      dietary: Array.isArray(dietary) ? dietary.slice(0, 5) : [],
      accessibility: Array.isArray(accessibility)
        ? accessibility.slice(0, 5)
        : [],
    });

    // Call Gemini
    const result = await geminiModel.generateContent(prompt);
    const rawText = result.response.text();

    // Parse and validate with Zod
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Retry: extract JSON from response if wrapped in markdown
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error("Gemini returned non-JSON response");
      }
    }

    const validation = ItinerarySchema.safeParse(parsed);
    if (!validation.success) {
      console.error("Zod validation failed:", validation.error.flatten());
      return NextResponse.json(
        {
          error: "Invalid itinerary format from AI",
          details: validation.error.flatten(),
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ itinerary: validation.data }, { status: 200 });
  } catch (err) {
    console.error("Gemini generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate itinerary. Please try again." },
      { status: 500 },
    );
  }
}
