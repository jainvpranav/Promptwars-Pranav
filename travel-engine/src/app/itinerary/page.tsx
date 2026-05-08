'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Itinerary, DayPlan, Place } from '@/lib/schemas/itinerary.schema';
import styles from './itinerary.module.css';

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍜', lodging: '🏨', attraction: '🏛️',
  transport: '🚆', activity: '🎯', shopping: '🛍️',
};
const CATEGORY_COLORS: Record<string, string> = {
  food: 'badge-sunset', lodging: 'badge-aurora', attraction: 'badge-emerald',
  transport: 'badge-rose', activity: 'badge-aurora', shopping: 'badge-sunset',
};

function PlaceCard({ place, index }: { place: Place; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      className={styles.placeCard}
      style={{ animationDelay: `${index * 60}ms` }}
      aria-label={`${place.name}: ${place.category}`}
    >
      <div className={styles.placeTimeline} aria-hidden="true">
        <div className={styles.placeTimelineDot} />
        <div className={styles.placeTimelineLine} />
      </div>
      <div className={styles.placeBody}>
        <div className={styles.placeHeader}>
          <div>
            <div className={styles.placeTopRow}>
              <span className={`badge ${CATEGORY_COLORS[place.category] || 'badge-aurora'}`}>
                {CATEGORY_ICONS[place.category] || '📍'} {place.category}
              </span>
              <span className={styles.placeDuration} aria-label={`${place.duration} minutes`}>
                ⏱ {place.duration}m
              </span>
            </div>
            <h3 className={styles.placeName}>{place.name}</h3>
            <p className={styles.placeAddress}>📍 {place.address}</p>
          </div>
          <div className={styles.placeCost} aria-label={`Estimated cost: $${place.estimatedCost}`}>
            <span className={styles.placeCostNum}>${place.estimatedCost}</span>
            <span className={styles.placeCostLabel}>est.</span>
          </div>
        </div>

        {place.notes && (
          <p className={styles.placeNotes}>{place.notes}</p>
        )}

        {place.tip && (
          <button
            className={styles.tipToggle}
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
            aria-controls={`tip-${place.name.replace(/\s/g, '-')}`}
          >
            💡 {expanded ? 'Hide' : 'Local tip'}
          </button>
        )}
        {place.tip && expanded && (
          <div
            id={`tip-${place.name.replace(/\s/g, '-')}`}
            className={styles.tipContent}
            role="note"
          >
            {place.tip}
          </div>
        )}

        {place.rating && (
          <div className={styles.placeRating} aria-label={`Rating: ${place.rating} out of 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} aria-hidden="true" className={i < Math.round(place.rating!) ? styles.starFull : styles.starEmpty}>★</span>
            ))}
            <span className={styles.ratingNum}>{place.rating}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function DaySection({ day, isActive, onClick }: { day: DayPlan; isActive: boolean; onClick: () => void }) {
  return (
    <section className={`${styles.daySection} ${isActive ? styles.daySectionActive : ''}`} aria-label={`Day ${day.dayNumber}: ${day.theme}`}>
      <button className={styles.dayTab} onClick={onClick} aria-expanded={isActive} aria-controls={`day-${day.dayNumber}`}>
        <span className={styles.dayEmoji} aria-hidden="true">{day.emoji}</span>
        <div className={styles.dayTabInfo}>
          <span className={styles.dayNum}>Day {day.dayNumber}</span>
          <span className={styles.dayTheme}>{day.theme}</span>
        </div>
        <span className={styles.dayCost} aria-label={`Day cost: $${day.totalCost}`}>${day.totalCost}</span>
        <svg className={`${styles.dayChevron} ${isActive ? styles.dayChevronOpen : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isActive && (
        <div id={`day-${day.dayNumber}`} className={styles.dayContent}>
          <p className={styles.daySummary}>{day.summary}</p>
          <div className={styles.placeList} role="list">
            {day.places.map((place, i) => (
              <div key={`${place.name}-${i}`} role="listitem">
                <PlaceCard place={place} index={i} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ItineraryPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'tips' | 'packing'>('itinerary');

  useEffect(() => {
    const raw = sessionStorage.getItem('wandr_itinerary');
    if (!raw) { router.replace('/plan'); return; }
    try { setItinerary(JSON.parse(raw)); } catch { router.replace('/plan'); }
  }, [router]);

  if (!itinerary) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading itinerary">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Loading your itinerary…</p>
      </div>
    );
  }

  const totalSpend = itinerary.days.reduce((s, d) => s + d.totalCost, 0);
  const budgetPct = Math.min(100, Math.round((totalSpend / itinerary.totalBudget) * 100));

  return (
    <div className={styles.layout}>

      {/* Hero */}
      <header className={styles.hero} aria-label="Trip overview">
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroNav}>
            <button className="btn btn-ghost btn-sm" onClick={() => router.back()} aria-label="Go back">← Back</button>
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const data = JSON.stringify(itinerary, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = `${itinerary.destination.replace(/,\s*/g, '-')}-itinerary.json`; a.click();
            }} aria-label="Download itinerary as JSON">
              ↓ Export
            </button>
          </div>
          <div className={styles.heroBadge}>
            <span className="badge badge-aurora">✨ AI Generated</span>
          </div>
          <h1 className={styles.heroTitle}>{itinerary.title}</h1>
          <p className={styles.heroDestination}>📍 {itinerary.destination}</p>
          <div className={styles.heroStats} aria-label="Trip statistics">
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{itinerary.days.length}</span>
              <span className={styles.heroStatLabel}>Days</span>
            </div>
            <div className={styles.heroStatDiv} aria-hidden="true" />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>${totalSpend.toLocaleString()}</span>
              <span className={styles.heroStatLabel}>Est. Spend</span>
            </div>
            <div className={styles.heroStatDiv} aria-hidden="true" />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{itinerary.days.reduce((s,d) => s + d.places.length, 0)}</span>
              <span className={styles.heroStatLabel}>Places</span>
            </div>
          </div>
          {/* Budget bar */}
          <div className={styles.budgetBar} aria-label={`Budget used: ${budgetPct}% ($${totalSpend} of $${itinerary.totalBudget})`}>
            <div className={styles.budgetBarLabels}>
              <span>Budget Used</span>
              <span>{budgetPct}% — ${totalSpend.toLocaleString()} / ${itinerary.totalBudget.toLocaleString()}</span>
            </div>
            <div className={styles.budgetTrack} role="progressbar" aria-valuenow={budgetPct} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.budgetFill} style={{ width: `${budgetPct}%`, background: budgetPct > 90 ? 'var(--c-rose)' : budgetPct > 70 ? 'var(--c-sunset)' : 'var(--c-aurora)' }} />
            </div>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <nav className={styles.tabNav} aria-label="Itinerary sections">
        {(['itinerary', 'tips', 'packing'] as const).map(t => (
          <button key={t} className={`${styles.tabBtn} ${activeTab === t ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(t)} aria-selected={activeTab === t} role="tab">
            {t === 'itinerary' ? '📅 Itinerary' : t === 'tips' ? '💡 Travel Tips' : '🎒 Packing List'}
          </button>
        ))}
      </nav>

      {/* Body */}
      <main className={styles.body}>

        {activeTab === 'itinerary' && (
          <div className={styles.itineraryLayout}>
            {itinerary.days.map((day, i) => (
              <DaySection key={day.dayNumber} day={day} isActive={activeDay === i}
                onClick={() => setActiveDay(prev => prev === i ? -1 : i)} />
            ))}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className={styles.tipsGrid} role="list" aria-label="Travel tips">
            {itinerary.travelTips.map((tip, i) => (
              <div key={i} className={`${styles.tipCard} glass`} role="listitem">
                <span className={styles.tipNumber} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <p>{tip}</p>
              </div>
            ))}
            {itinerary.bestTimeToVisit && (
              <div className={`${styles.tipCard} ${styles.tipCardHighlight} glass`}>
                <span className={styles.tipNumber} aria-hidden="true">🕐</span>
                <div>
                  <strong>Best Time to Visit</strong>
                  <p>{itinerary.bestTimeToVisit}</p>
                </div>
              </div>
            )}
            {itinerary.transportationAdvice && (
              <div className={`${styles.tipCard} ${styles.tipCardHighlight} glass`}>
                <span className={styles.tipNumber} aria-hidden="true">🚌</span>
                <div>
                  <strong>Getting Around</strong>
                  <p>{itinerary.transportationAdvice}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'packing' && (
          <div className={styles.packingGrid} role="list" aria-label="Packing essentials">
            {itinerary.packingEssentials.map((item, i) => (
              <label key={i} className={`${styles.packItem} glass`} role="listitem">
                <input type="checkbox" className={styles.packCheck} aria-label={`Pack: ${item}`} />
                <span className={styles.packCheckBox} aria-hidden="true" />
                <span className={styles.packLabel}>{item}</span>
              </label>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
