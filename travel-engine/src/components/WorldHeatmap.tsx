'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { HeatmapPoint } from '@/lib/heatmap';
import styles from './WorldHeatmap.module.css';

/* ── Dark map style ────────────────────────────────────── */
const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry',       stylers: [{ color: '#060d1a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a6080' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#060d1a' }] },
  { featureType: 'water',          elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'water',          elementType: 'labels.text.fill', stylers: [{ color: '#1a3050' }] },
  { featureType: 'landscape',      elementType: 'geometry', stylers: [{ color: '#0d1a2e' }] },
  { featureType: 'road',           elementType: 'geometry', stylers: [{ color: '#122040' }] },
  { featureType: 'road',           elementType: 'geometry.stroke', stylers: [{ color: '#0a1628' }] },
  { featureType: 'poi',            stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',        stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a3050' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#2a4060' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#2a4060' }] },
];

/* ── Inner heatmap layer (needs map context) ───────────── */
function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');
  const layerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !visualization) return;

    layerRef.current?.setMap(null);
    layerRef.current = new visualization.HeatmapLayer({
      data: points.map(p => ({
        location: new google.maps.LatLng(p.lat, p.lng),
        weight: Math.max(0.1, p.weight * 12),
      })),
      map,
      radius: 55,
      opacity: 0.85,
      gradient: [
        'rgba(0, 212, 255, 0)',
        'rgba(0, 212, 255, 0.4)',
        'rgba(80, 130, 255, 0.6)',
        'rgba(124, 58, 237, 0.75)',
        'rgba(200, 80, 180, 0.85)',
        'rgba(249, 115, 22, 0.92)',
        'rgba(244, 63, 94, 1)',
      ],
    });

    return () => { layerRef.current?.setMap(null); };
  }, [map, visualization, points]);

  return null;
}

/* ── Marker pin for selected/hovered destination ──────── */
function DestinationMarkers({
  points,
  selected,
  onSelect,
}: {
  points: HeatmapPoint[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listeners: google.maps.MapsEventListener[] = [];
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];

    points.forEach(p => {
      const isTop = p.adjustedCount > 3000;
      if (!isTop && p.destination.id !== selected) return;

      const pin = document.createElement('div');
      pin.className = `${styles.mapPin} ${p.destination.id === selected ? styles.mapPinActive : ''}`;
      pin.innerHTML = `<span>${p.destination.name.split(',')[0]}</span>`;
      pin.setAttribute('aria-label', `${p.destination.name}: ${p.adjustedCount.toLocaleString()} travelers`);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: p.lat, lng: p.lng },
        content: pin,
        title: p.destination.name,
      });

      const l = marker.addListener('click', () => onSelect(p.destination.id));
      listeners.push(l);
      markers.push(marker);
    });

    return () => {
      listeners.forEach(l => google.maps.event.removeListener(l));
      markers.forEach(m => { m.map = null; });
    };
  }, [map, points, selected, onSelect]);

  return null;
}

/* ── Main export ───────────────────────────────────────── */
export function WorldHeatmap({
  points,
  selected,
  onSelect,
}: {
  points: HeatmapPoint[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const mapsKey = process.env.NEXT_PUBLIC_MAPS_KEY || '';
  const handleSelect = useCallback((id: string) => onSelect(id), [onSelect]);

  if (!mapsKey) {
    return (
      <div className={styles.noKey} role="alert">
        <p>🗺️ Add <code>NEXT_PUBLIC_MAPS_KEY</code> to <code>.env.local</code> to enable the live heatmap.</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={mapsKey} libraries={['visualization', 'marker']}>
      <Map
        className={styles.map}
        defaultCenter={{ lat: 20, lng: 10 }}
        defaultZoom={2.2}
        minZoom={1.5}
        maxZoom={10}
        disableDefaultUI
        gestureHandling="greedy"
        mapId="wandr-dark-map"
        styles={DARK_STYLES}
        aria-label="World travel density heatmap"
      >
        <HeatLayer points={points} />
        <DestinationMarkers points={points} selected={selected} onSelect={handleSelect} />
      </Map>
    </APIProvider>
  );
}
