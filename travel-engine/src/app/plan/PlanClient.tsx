"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./plan.module.css";

const TRAVEL_STYLES = [
  {
    id: "budget",
    label: "Budget Explorer",
    icon: "🎒",
    desc: "Local, affordable, authentic",
  },
  {
    id: "balanced",
    label: "Balanced Traveler",
    icon: "🌟",
    desc: "Mix of comfort and value",
  },
  {
    id: "comfort",
    label: "Comfort Seeker",
    icon: "🏨",
    desc: "Quality stays & experiences",
  },
  {
    id: "luxury",
    label: "Luxury Voyager",
    icon: "💎",
    desc: "Premium everything",
  },
];

const INTERESTS = [
  "🏛️ Culture",
  "🍜 Food",
  "🏖️ Beach",
  "🧗 Adventure",
  "🌿 Nature",
  "🎉 Nightlife",
  "🛍️ Shopping",
  "📸 Photography",
  "🎭 Arts",
  "⚽ Sports",
  "🧘 Wellness",
  "📜 History",
  "🎵 Music",
  "🍷 Wine & Dine",
];

const DIETARY = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "No restrictions",
];
const ACCESSIBILITY = [
  "Wheelchair accessible",
  "Limited walking",
  "No stairs",
  "All abilities",
];

export default function PlanClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    destination: searchParams.get("destination") || "",
    startDate: searchParams.get("start") || "",
    endDate: searchParams.get("end") || "",
    budget: searchParams.get("budget") || "1500",
    travelStyle: "balanced",
    groupSize: "2",
    interests: [] as string[],
    dietary: [] as string[],
    accessibility: [] as string[],
  });

  function toggleItem(
    field: "interests" | "dietary" | "accessibility",
    val: string,
  ) {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(val)
          ? arr.filter((x) => x !== val)
          : [...arr, val],
      };
    });
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          budget: Number(form.budget),
          travelStyle: form.travelStyle,
          groupSize: Number(form.groupSize),
          interests: form.interests.map((i) => i.replace(/^.+? /, "")),
          dietary: form.dietary,
          accessibility: form.accessibility,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        return;
      }
      sessionStorage.setItem("wandr_itinerary", JSON.stringify(data.itinerary));
      router.push("/itinerary");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 3;
  const canNext1 =
    form.destination &&
    form.startDate &&
    form.endDate &&
    Number(form.budget) >= 100;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          ← Back
        </button>
        <div className={styles.headerTitle}>
          <h1 className={styles.headerH1}>Plan Your Trip</h1>
          <p className={styles.headerSub}>
            AI-powered, personalised just for you
          </p>
        </div>
        <div
          className={styles.stepIndicatorWrap}
          aria-label={`Step ${step} of ${totalSteps}`}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i + 1 === step ? "active" : i + 1 < step ? "done" : ""}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </header>

      <div className={styles.content}>
        <div className={`${styles.card} glass-bright`}>
          {step === 1 && (
            <fieldset className={styles.step} aria-label="Step 1: Trip basics">
              <legend className={styles.stepLegend}>
                <span className={styles.stepNum}>01</span>
                Where & When?
              </legend>

              <div className={styles.field}>
                <label htmlFor="destination">Destination</label>
                <input
                  id="destination"
                  type="text"
                  className="input-field"
                  placeholder="e.g. Bali, Indonesia"
                  value={form.destination}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, destination: e.target.value }))
                  }
                  required
                  aria-required="true"
                  maxLength={100}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="start-date-plan">Departure</label>
                  <input
                    id="start-date-plan"
                    type="date"
                    className="input-field"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="end-date-plan">Return</label>
                  <input
                    id="end-date-plan"
                    type="date"
                    className="input-field"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="budget">
                    Total Budget (USD) — ${Number(form.budget).toLocaleString()}
                  </label>
                  <input
                    id="budget"
                    type="range"
                    min="200"
                    max="15000"
                    step="100"
                    className={styles.rangeInput}
                    value={form.budget}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, budget: e.target.value }))
                    }
                    aria-valuemin={200}
                    aria-valuemax={15000}
                    aria-valuenow={Number(form.budget)}
                    aria-label={`Budget: $${Number(form.budget).toLocaleString()}`}
                  />
                  <div className={styles.rangeLabels}>
                    <span>$200</span>
                    <span>$15,000</span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label htmlFor="group-size">Group Size</label>
                  <select
                    id="group-size"
                    className="input-field"
                    value={form.groupSize}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, groupSize: e.target.value }))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Person" : "People"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStep(2)}
                disabled={!canNext1}
                style={{ marginTop: "var(--s-4)" }}
              >
                Continue → Travel Style
              </button>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset
              className={styles.step}
              aria-label="Step 2: Travel style and interests"
            >
              <legend className={styles.stepLegend}>
                <span className={styles.stepNum}>02</span>
                Your Travel Vibe
              </legend>

              <div className={styles.field}>
                <label>Travel Style</label>
                <div
                  className={styles.styleGrid}
                  role="radiogroup"
                  aria-label="Travel style selection"
                >
                  {TRAVEL_STYLES.map((s) => (
                    <label
                      key={s.id}
                      className={`${styles.styleCard} ${form.travelStyle === s.id ? styles.styleCardActive : ""}`}
                    >
                      <input
                        type="radio"
                        name="travelStyle"
                        value={s.id}
                        checked={form.travelStyle === s.id}
                        onChange={() =>
                          setForm((p) => ({ ...p, travelStyle: s.id }))
                        }
                        className={styles.srOnly}
                      />
                      <span className={styles.styleIcon}>{s.icon}</span>
                      <span className={styles.styleLabel}>{s.label}</span>
                      <span className={styles.styleDesc}>{s.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>
                  Interests{" "}
                  <span className={styles.optional}>
                    (select all that apply)
                  </span>
                </label>
                <div
                  className={styles.chipGrid}
                  role="group"
                  aria-label="Interests"
                >
                  {INTERESTS.map((i) => (
                    <label
                      key={i}
                      className={`${styles.chip} ${form.interests.includes(i) ? styles.chipActive : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.interests.includes(i)}
                        onChange={() => toggleItem("interests", i)}
                        className={styles.srOnly}
                      />
                      {i}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.stepButtons}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  Continue → Preferences
                </button>
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset
              className={styles.step}
              aria-label="Step 3: Dietary and accessibility preferences"
            >
              <legend className={styles.stepLegend}>
                <span className={styles.stepNum}>03</span>
                Preferences & Generate
              </legend>

              <div className={styles.field}>
                <label>Dietary Requirements</label>
                <div
                  className={styles.chipGrid}
                  role="group"
                  aria-label="Dietary requirements"
                >
                  {DIETARY.map((d) => (
                    <label
                      key={d}
                      className={`${styles.chip} ${form.dietary.includes(d) ? styles.chipActive : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.dietary.includes(d)}
                        onChange={() => toggleItem("dietary", d)}
                        className={styles.srOnly}
                      />
                      {d}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Accessibility Needs</label>
                <div
                  className={styles.chipGrid}
                  role="group"
                  aria-label="Accessibility needs"
                >
                  {ACCESSIBILITY.map((a) => (
                    <label
                      key={a}
                      className={`${styles.chip} ${form.accessibility.includes(a) ? styles.chipActive : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={form.accessibility.includes(a)}
                        onChange={() => toggleItem("accessibility", a)}
                        className={styles.srOnly}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.summary} aria-label="Trip summary">
                <div className={styles.summaryItem}>
                  <span>📍</span>
                  <span>{form.destination}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>📅</span>
                  <span>
                    {form.startDate} → {form.endDate}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span>💰</span>
                  <span>${Number(form.budget).toLocaleString()} budget</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>👥</span>
                  <span>{form.groupSize} people</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>
                    {TRAVEL_STYLES.find((s) => s.id === form.travelStyle)?.icon}
                  </span>
                  <span>
                    {
                      TRAVEL_STYLES.find((s) => s.id === form.travelStyle)
                        ?.label
                    }
                  </span>
                </div>
              </div>

              {error && (
                <p className={styles.errorMsg} role="alert" aria-live="polite">
                  ⚠ {error}
                </p>
              )}

              <div className={styles.stepButtons}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  className={`btn btn-primary btn-lg ${styles.generateBtn}`}
                  onClick={handleGenerate}
                  disabled={loading}
                  aria-label="Generate AI itinerary"
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <div
                        className="spinner"
                        style={{ width: "18px", height: "18px" }}
                        aria-hidden="true"
                      />{" "}
                      Generating with AI…
                    </>
                  ) : (
                    <>✨ Generate My Itinerary</>
                  )}
                </button>
              </div>
            </fieldset>
          )}
        </div>
      </div>
    </div>
  );
}
