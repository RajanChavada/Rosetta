import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rosetta — One source of truth for AI agents across every IDE',
  description:
    'Rosetta keeps Claude Code, Cursor, Windsurf, and 7 more IDEs in lockstep. One spec, every agent stays in sync.',
  metadataBase: new URL('https://rosetta.dev'),
  openGraph: {
    title: 'Rosetta',
    description: 'One source of truth for AI agents across every IDE.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
