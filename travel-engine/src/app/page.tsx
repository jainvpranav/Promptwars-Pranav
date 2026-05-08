'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const FLOATING_STATS = [
  { count: '6.3K', dest: 'Paris', emoji: '🗼', delay: 0 },
  { count: '5.5K', dest: 'Tokyo', emoji: '⛩️', delay: 800 },
  { count: '4.8K', dest: 'Bali', emoji: '🌺', delay: 1600 },
  { count: '4.6K', dest: 'Dubai', emoji: '🌆', delay: 2400 },
  { count: '3.9K', dest: 'Cancún', emoji: '🏖️', delay: 3200 },
];

export default function LandingPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  function handleExplore(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) { setError('Please select both dates.'); return; }
    if (new Date(endDate) <= new Date(startDate)) { setError('End date must be after start date.'); return; }
    setError('');
    router.push(`/dashboard?start=${startDate}&end=${endDate}`);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <main className={styles.landing} aria-label="WANDR landing page">
      {/* Starfield particles */}
      <div className={styles.stars} aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className={styles.star} style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }} />
        ))}
      </div>

      {/* Floating destination stats */}
      <div className={styles.floatingStats} aria-hidden="true">
        {FLOATING_STATS.map((s, i) => (
          <div key={i} className={styles.floatCard} style={{ animationDelay: `${s.delay}ms` }}>
            <span className={styles.floatEmoji}>{s.emoji}</span>
            <div>
              <div className={styles.floatCount}>{s.count}</div>
              <div className={styles.floatDest}>{s.dest}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className={`${styles.hero} ${visible ? styles.heroVisible : ''}`}>
        {/* Logo */}
        <div className={styles.logo} aria-label="WANDR">
          <span className={styles.logoW}>W</span>
          <span>ANDR</span>
          <div className={styles.logoDot} aria-hidden="true" />
        </div>

        <h1 className={styles.headline}>
          <span className={styles.headlineLine1}>See where the world</span>
          <span className={styles.headlineLine2}>
            is going <span className={styles.headlineAccent}>this season.</span>
          </span>
        </h1>

        <p className={styles.subheadline}>
          Enter your vacation period and discover real-time travel density across the globe —
          then let AI craft your perfect itinerary.
        </p>

        {/* Date form */}
        <form
          onSubmit={handleExplore}
          className={styles.dateForm}
          aria-label="Vacation period selection"
        >
          <div className={styles.dateInputGroup}>
            <div className={styles.dateField}>
              <label htmlFor="start-date">Departure</label>
              <input
                id="start-date"
                type="date"
                className={`input-field ${styles.dateInput}`}
                value={startDate}
                min={today}
                onChange={e => setStartDate(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className={styles.dateSeparator} aria-hidden="true">→</div>
            <div className={styles.dateField}>
              <label htmlFor="end-date">Return</label>
              <input
                id="end-date"
                type="date"
                className={`input-field ${styles.dateInput}`}
                value={endDate}
                min={startDate || today}
                onChange={e => setEndDate(e.target.value)}
                required
                aria-required="true"
              />
            </div>
          </div>

          {error && (
            <p className={styles.errorMsg} role="alert" aria-live="polite">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.ctaBtn}`}
            aria-label="Explore where travelers are going"
          >
            <span className={styles.ctaBtnIcon} aria-hidden="true">🌍</span>
            Explore the Heatmap
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>

        {/* Social proof */}
        <div className={styles.socialProof} aria-label="Platform statistics">
          <div className={styles.proofItem}>
            <span className={styles.proofNum}>30+</span>
            <span className={styles.proofLabel}>Destinations</span>
          </div>
          <div className={styles.proofDivider} aria-hidden="true" />
          <div className={styles.proofItem}>
            <span className={styles.proofNum}>AI</span>
            <span className={styles.proofLabel}>Powered Plans</span>
          </div>
          <div className={styles.proofDivider} aria-hidden="true" />
          <div className={styles.proofItem}>
            <span className={styles.proofNum}>Live</span>
            <span className={styles.proofLabel}>Density Data</span>
          </div>
        </div>
      </div>

      {/* Globe hint */}
      <div className={styles.globeHint} aria-hidden="true">
        <div className={styles.globeRing} />
        <div className={styles.globeRing} style={{ animationDelay: '0.5s' }} />
        <div className={styles.globeRing} style={{ animationDelay: '1s' }} />
      </div>
    </main>
  );
}
