---
name: review-google-services
description: >
  Audits the codebase for usage of Google Cloud, Firebase, Google Maps,
  Google Analytics, and other Google services. Checks for best practices,
  deprecated APIs, missing error handling, cost-optimization opportunities,
  quota-limit risks, and opportunities to leverage additional Google services
  for better results. Provides an upgrade and optimisation roadmap.
---

# Skill: Google Services Usage Review

## Purpose
Ensure Google service integrations are correct, cost-efficient, resilient,
and leverage the full power of the Google ecosystem — catching deprecated
patterns and missed opportunities before they become outages or surprise bills.

## When to Use
- Before production launch of any Google-service-dependent feature
- After Google announces deprecations (e.g., Maps API, Firebase SDK versions)
- During infrastructure cost reviews
- Triggered by: "google services review", "firebase review", "GCP review",
  "google maps review", "google analytics review", "review google usage"

---

## Execution Steps

### 1 — Service Discovery
Scan the codebase for Google service indicators:

```python
# Services to detect
GOOGLE_PATTERNS = {
    "Firebase Auth":        ["firebase/auth", "getAuth(", "signInWith"],
    "Firestore":            ["firebase/firestore", "getFirestore", "collection("],
    "Firebase Storage":     ["firebase/storage", "getStorage", "uploadBytes"],
    "Firebase Functions":   ["firebase/functions", "getFunctions", "httpsCallable"],
    "Firebase Analytics":   ["firebase/analytics", "logEvent("],
    "Google Maps":          ["@googlemaps", "google.maps", "GoogleMap", "useJsApiLoader"],
    "Google Analytics 4":   ["gtag(", "G-", "ga4"],
    "Google OAuth":         ["google-auth", "GoogleLogin", "useGoogleLogin"],
    "Cloud Vision":         ["@google-cloud/vision", "ImageAnnotatorClient"],
    "Vertex AI / Gemini":   ["@google/generative-ai", "GenerativeModel", "gemini-"],
    "BigQuery":             ["@google-cloud/bigquery", "BigQuery("],
    "Cloud Storage":        ["@google-cloud/storage", "Storage("],
    "Cloud Run / GCE":      ["Dockerfile", "cloudbuild.yaml", "app.yaml"],
    "Pub/Sub":              ["@google-cloud/pubsub", "PubSub("],
    "Secret Manager":       ["@google-cloud/secret-manager", "SecretManagerServiceClient"],
}
```

### 2 — Per-Service Best Practices Audit

#### Firebase / Firestore
| Check | Details | Severity |
|---|---|---|
| SDK version | Using Firebase 9+ (modular) not v8 compat | High |
| Security Rules | Firestore / Storage rules not set to `allow read, write: if true` | Critical |
| Offline persistence | `enableIndexedDbPersistence()` enabled for PWA | Medium |
| Missing indexes | Compound queries without composite indexes | High |
| Large document reads | Fetching entire collections without pagination | High |
| Real-time listener leaks | `onSnapshot` listeners without cleanup (`unsubscribe()`) | High |
| Bundle SDK bloat | Importing `firebase/app` instead of tree-shakeable modules | Medium |
| Missing error handling | Firebase calls without `.catch()` or `try/catch` | High |

#### Google Maps JavaScript API
| Check | Details | Severity |
|---|---|---|
| API key restrictions | Key restricted to HTTP referrers / APIs | Critical |
| Loading strategy | Using `@googlemaps/js-api-loader` not inline `<script>` | Medium |
| Libraries loaded | Only loading needed libraries (`places`, `geometry`, etc.) | Medium |
| Map instance leak | Map created but not destroyed on component unmount | High |
| Deprecated APIs | `google.maps.Marker` → migrate to `AdvancedMarkerElement` | High |
| Missing error handling | No `status` check on Geocoder / Directions responses | Medium |

#### Google Analytics 4
| Check | Details | Severity |
|---|---|---|
| GA4 not UA | Universal Analytics retired; must be GA4 | Critical |
| Event naming | Custom events follow GA4 naming conventions | Low |
| User ID tracking | `userId` set for logged-in users | Medium |
| Consent mode | `gtag('consent', 'update', …)` implemented for GDPR | High |
| Debug mode | `debug_mode: true` not in production | Medium |
| PII in events | No email/phone passed in event parameters | Critical |

#### Vertex AI / Gemini
| Check | Details | Severity |
|---|---|---|
| API key in client code | Gemini API key exposed in frontend | Critical |
| Model selection | Using latest stable model (gemini-1.5-pro / gemini-2.0-flash) | Medium |
| Safety settings | `HarmCategory` / `HarmBlockThreshold` configured | High |
| Streaming | Using `generateContentStream` for long responses | Medium |
| Retry logic | Exponential backoff on 429 / 503 responses | High |
| Token limits | `maxOutputTokens` set to prevent runaway costs | High |
| System instructions | Using system instructions for consistent persona | Medium |

### 3 — Cost Optimisation Analysis
Estimate potential cost impact of detected patterns:

| Service | Risk Pattern | Estimated Impact |
|---|---|---|
| Firestore | Unbounded real-time listeners | $$$+ per day |
| Maps API | Loading Maps on every page render | $$+ per day |
| Gemini API | No token limits set | $$$+ per request |
| Cloud Storage | No lifecycle rules on old objects | $$ per month |
| Functions | No maximum instance count set | $$$+ on traffic spike |

### 4 — Missed Opportunity Analysis
Based on the services already in use, suggest adjacent Google services
that would add significant value:

| Current Service | Opportunity | Value |
|---|---|---|
| Firebase Auth | Add Google Sign-In with one-tap UX | UX improvement |
| Firestore | Firebase Extensions for email / Stripe | Dev speed |
| Cloud Storage | Cloud CDN for public assets | Performance |
| Analytics | BigQuery Export for custom analysis | Business intelligence |
| Any LLM feature | Vertex AI RAG Engine | Accuracy improvement |
| Backend | Cloud Run instead of always-on VM | 80% cost reduction |

### 5 — Compile the Google Services Report
Write to `review_output/google_services_report.md`:

```markdown
# Google Services Review — {date}

## Services Detected
- Firebase Auth ✅
- Firestore ✅
- Google Maps ✅
- GA4 ✅
- Vertex AI / Gemini ✅

## Critical Issues

### 🚨 CRITICAL — Firestore Security Rules are open
**File:** `firestore.rules`
**Issue:** `allow read, write: if true;` allows anyone to read/write all data.
**Fix:**
\```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
\```

## Cost Risk Summary
| Service | Monthly Risk | Mitigation |
|---|---|---|
| Maps API | $200+ | Restrict API key; cache geocoding results |

## Upgrade Opportunities
| Action | Effort | Value |
|---|---|---|
| Migrate to Firebase Modular SDK v9+ | 4h | 30% smaller bundle |
| Add Consent Mode for GDPR | 2h | Legal compliance |

## Missed Google Service Opportunities
| Service | Why Use It | Docs |
|---|---|---|
| Vertex AI RAG | Your app has a chatbot — RAG will improve accuracy | link |
| Firebase Remote Config | Control feature flags without deploys | link |
```

---

## Leveraging This Skill for Better Results

**Tip 1 — Enable Firebase App Check**
Protect your Firebase backend from abuse by enabling App Check (reCAPTCHA v3
for web). Pair with this review to ensure all Firebase calls are protected.

**Tip 2 — Use Google Cloud Architecture Center**
Cross-reference your architecture against the Google Cloud Architecture Center
reference patterns for your use case (e.g. "scalable web app", "RAG pipeline").

**Tip 3 — Set Up Budget Alerts**
In Google Cloud Console, set budget alerts at 50%, 90%, and 100% of your
monthly estimate. This review identifies the risk; alerts contain the blast radius.

**Tip 4 — Firebase Emulator Suite**
Use the Firebase Emulator for local development to avoid hitting production
quotas and to test security rules safely.

**Tip 5 — Combine with Security Review**
Google API keys and Firebase service account keys are the most common
secrets found in repos. Always run `review-security` alongside this skill.

**Tip 6 — Leverage Gemini in Antigravity**
If you use Gemini API in your app, you can use Antigravity's own Gemini
integration to test and refine your prompts and system instructions inline.
