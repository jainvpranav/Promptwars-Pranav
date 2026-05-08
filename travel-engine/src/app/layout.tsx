import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WANDR — Travel Planning & Experience Engine',
  description:
    'Plan your perfect trip with AI-powered itineraries, real-time travel density heatmaps, and personalised recommendations.',
  keywords: ['travel planning', 'AI itinerary', 'trip planner', 'travel heatmap'],
  openGraph: {
    title: 'WANDR — Travel Planning & Experience Engine',
    description: 'See where the world is going, then plan your perfect trip.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
