'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getHeatmapPoints, getTopDestinations, getContinents, formatCount, type HeatmapPoint } from '@/lib/heatmap';
import styles from './dashboard.module.css';

const WorldHeatmap = dynamic(
  () => import('@/components/WorldHeatmap').then(m => m.WorldHeatmap),
  { ssr: false, loading: () => <div className={styles.mapLoading}><div className="spinner" /></div> }
);

const CATEGORY_ICONS: Record<string, string> = {
  beach: '🏖️', culture: '🏛️', food: '🍜', romance: '💑', luxury: '💎',
  adventure: '🧗', nature: '🌿', nightlife: '🎉', history: '📜', wellness: '🧘',
  technology: '⚡', shopping: '🛍️', diving: '🤿', canals: '🚣', music: '🎵',
  aurora: '🌌', beer: '🍺',
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startDate = searchParams.get('start') || '';
  const endDate   = searchParams.get('end')   || '';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [continent, setContinent]   = useState<string>('All');

  const allPoints = useMemo(() => getHeatmapPoints(startDate, endDate), [startDate, endDate]);
  const topDests  = useMemo(() => getTopDestinations(startDate, endDate, 8), [startDate, endDate]);
  const continents = useMemo(() => ['All', ...getContinents()], []);

  const filteredPoints = useMemo(
    () => continent === 'All' ? allPoints : allPoints.filter(p => p.destination.continent === continent),
    [allPoints, continent]
  );

  const selectedPoint = useMemo(
    () => allPoints.find(p => p.destination.id === selectedId) ?? null,
    [allPoints, selectedId]
  );

  const totalTravelers = useMemo(
    () => filteredPoints.reduce((s, p) => s + p.adjustedCount, 0),
    [filteredPoints]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handlePlanTrip = useCallback((dest?: HeatmapPoint) => {
    const target = dest ?? selectedPoint;
    if (!target) return;
    router.push(`/plan?destination=${encodeURIComponent(target.destination.name)}&start=${startDate}&end=${endDate}&budget=${target.destination.avgBudget}`);
  }, [selectedPoint, startDate, endDate, router]);

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className={styles.layout} aria-label="Travel density dashboard">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className={styles.nav} aria-label="WANDR navigation">
        <div className={styles.navBrand}>
          <span className={styles.navLogo}>W</span>
          <span className={styles.navName}>ANDR</span>
        </div>
        <div className={styles.navPeriod} aria-label={`Vacation period: ${formatDate(startDate)} to ${formatDate(endDate)}`}>
          <span className={styles.navPeriodLabel}>Vacation Period</span>
          <span className={styles.navPeriodDates}>
            {formatDate(startDate)} — {formatDate(endDate)}
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push('/')}
          aria-label="Change vacation dates"
        >
          Change Dates
        </button>
      </nav>

      <div className={styles.body}>

        {/* ── Left Sidebar ─────────────────────────────── */}
        <aside className={styles.sidebar} aria-label="Top destinations sidebar">

          {/* Stats header */}
          <div className={styles.statsRow}>
            <div className={styles.statCard} aria-label={`${formatCount(totalTravelers)} total travelers`}>
              <span className={styles.statNum}>{formatCount(totalTravelers)}</span>
              <span className={styles.statLabel}>Travelers</span>
            </div>
            <div className={styles.statCard} aria-label={`${filteredPoints.length} destinations`}>
              <span className={styles.statNum}>{filteredPoints.length}</span>
              <span className={styles.statLabel}>Destinations</span>
            </div>
          </div>

          {/* Continent filter */}
          <div className={styles.continentFilter} role="group" aria-label="Filter by continent">
            {continents.map(c => (
              <button
                key={c}
                className={`${styles.contBtn} ${continent === c ? styles.contBtnActive : ''}`}
                onClick={() => setContinent(c)}
                aria-pressed={continent === c}
              >
                {c === 'All' ? '🌍 All' : c}
              </button>
            ))}
          </div>

          {/* Top destinations list */}
          <div className={styles.sidebarTitle}>
            <span className="pulse-dot" aria-hidden="true" />
            Top Destinations
          </div>

          <ul className={styles.destList} role="list" aria-label="Top destinations by traveler count">
            {topDests.map((p, i) => (
              <li key={p.destination.id}>
                <button
                  className={`${styles.destItem} ${selectedId === p.destination.id ? styles.destItemSelected : ''}`}
                  onClick={() => handleSelect(p.destination.id)}
                  aria-pressed={selectedId === p.destination.id}
                  aria-label={`${p.destination.name}: ${p.adjustedCount.toLocaleString()} travelers, average budget $${p.destination.avgBudget}`}
                >
                  <span className={styles.destRank} aria-hidden="true">#{i + 1}</span>
                  <div className={styles.destInfo}>
                    <span className={styles.destName}>{p.destination.name}</span>
                    <div className={styles.destTags}>
                      {p.destination.tags.slice(0, 2).map(t => (
                        <span key={t} className={styles.destTag} aria-label={t}>
                          {CATEGORY_ICONS[t] || '✨'} {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.destMeta}>
                    <span className={styles.destCount}>{formatCount(p.adjustedCount)}</span>
                    <span className={styles.destBudget}>${p.destination.avgBudget.toLocaleString()}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Plan CTA */}
          <button
            className={`btn btn-primary ${styles.planCta}`}
            onClick={() => handlePlanTrip()}
            disabled={!selectedId}
            aria-label={selectedId ? `Plan trip to ${selectedPoint?.destination.name}` : 'Select a destination to plan a trip'}
          >
            {selectedId ? `Plan Trip to ${selectedPoint?.destination.name.split(',')[0]}` : 'Select a Destination'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </aside>

        {/* ── Map Area ──────────────────────────────────── */}
        <main className={styles.mapArea} aria-label="Interactive world heatmap">

          {/* Heat legend */}
          <div className={styles.legendBar} aria-label="Heatmap density legend">
            <span className={styles.legendLabel}>Fewer travelers</span>
            <div className="heat-bar" aria-hidden="true" />
            <span className={styles.legendLabel}>More travelers</span>
          </div>

          <WorldHeatmap
            points={filteredPoints}
            selected={selectedId}
            onSelect={handleSelect}
          />

          {/* Selected destination tooltip */}
          {selectedPoint && (
            <div className={styles.destTooltip} role="status" aria-live="polite">
              <div className={styles.tooltipHeader}>
                <h2 className={styles.tooltipName}>{selectedPoint.destination.name}</h2>
                <button
                  className={styles.tooltipClose}
                  onClick={() => setSelectedId(null)}
                  aria-label="Close destination info"
                >✕</button>
              </div>
              <div className={styles.tooltipStats}>
                <div className={styles.tooltipStat}>
                  <span className={styles.tooltipStatNum}>{selectedPoint.adjustedCount.toLocaleString()}</span>
                  <span className={styles.tooltipStatLabel}>travelers</span>
                </div>
                <div className={styles.tooltipStat}>
                  <span className={styles.tooltipStatNum}>${selectedPoint.destination.avgBudget.toLocaleString()}</span>
                  <span className={styles.tooltipStatLabel}>avg budget</span>
                </div>
                <div className={styles.tooltipStat}>
                  <span className={styles.tooltipStatNum}>{selectedPoint.destination.continent}</span>
                  <span className={styles.tooltipStatLabel}>continent</span>
                </div>
              </div>
              <div className={styles.tooltipTags}>
                {selectedPoint.destination.tags.map(t => (
                  <span key={t} className="badge badge-aurora">
                    {CATEGORY_ICONS[t] || '✨'} {t}
                  </span>
                ))}
              </div>
              <button
                className={`btn btn-primary btn-sm ${styles.tooltipPlanBtn}`}
                onClick={() => handlePlanTrip(selectedPoint)}
                aria-label={`Plan trip to ${selectedPoint.destination.name}`}
              >
                Plan this Trip →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
