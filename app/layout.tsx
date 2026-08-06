import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_URL = 'https://blackout-protocol.example.com';
const TITLE = 'Blackout Protocol — Season 05 Global Reveal';
const DESCRIPTION =
  'One hundred operators. Eight square kilometres of contested ground. Explore the armoury, the islands, the motor pool and the operators of Blackout Protocol — a cinematic battle-royale reveal.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s · Blackout Protocol',
  },
  description: DESCRIPTION,
  applicationName: 'Blackout Protocol',
  keywords: [
    'battle royale',
    'Blackout Protocol',
    'weapon vault',
    'game reveal',
    'season 05',
    'tactical shooter',
  ],
  authors: [{ name: 'Blackout Protocol' }],
  creator: 'Blackout Protocol',
  category: 'games',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Blackout Protocol',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: '#030405',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** Structured data so the reveal surfaces correctly in search. */
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Blackout Protocol',
  description: DESCRIPTION,
  genre: ['Battle Royale', 'Tactical Shooter'],
  gamePlatform: ['PC', 'PlayStation 5', 'Xbox Series X'],
  playMode: ['MultiPlayer', 'CoOp'],
  numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 100 },
  applicationCategory: 'Game',
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Static, author-controlled object — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
