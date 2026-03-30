// D1 + R2 accessor — mirrors kv.ts pattern

export function getDB(): D1Database {
  const db = (globalThis as any).__d1;
  if (!db) throw new Error('D1 not initialized — check wrangler.toml [[d1_databases]] binding');
  return db;
}

export function getR2(): R2Bucket {
  const r2 = (globalThis as any).__r2;
  if (!r2) throw new Error('R2 not initialized — check wrangler.toml [[r2_buckets]] binding');
  return r2;
}

// ULID-like ID generator (time-sortable, no dependency)
export function generateId(): string {
  const t = Date.now().toString(36).padStart(9, '0');
  const r = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 12);
  return `${t}${r}`;
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
