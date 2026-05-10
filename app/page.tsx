import { readFile } from 'node:fs/promises';
import path from 'node:path';
import LandingPage from './components/LandingPage';

// Spectral is bound globally on the body (see app/layout.tsx). Brand
// className is inherited via var(--font-serif) where used in CSS;
// LandingPage's brandClassName is now empty since the font cascades.
export default async function Home() {
  const trustContent = await readFile(
    path.join(process.cwd(), 'public', 'docs', 'Trust.md'),
    'utf8',
  );
  return <LandingPage brandClassName="" trustContent={trustContent} />;
}
