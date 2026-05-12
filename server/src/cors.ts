/** CORS — single source of truth for allowed origins. */

export function getAllowedOrigins(): string[] {
  const bases = ['https://alexandria-library.com', 'https://alexandria-library.com'];
  return [
    ...bases,
    ...bases.map((b) => b.replace('https://', 'https://www.')),
    'http://localhost:3000',
  ];
}
