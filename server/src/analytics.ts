/**
 * General compounding — append-only event log.
 *
 * Every tool call produces one JSONL line. No user data. No content.
 * No tokens. Just event type, timestamp, and open-ended metadata.
 *
 * Storage: KV namespace with daily keys (events:YYYY-MM-DD).
 * In-memory summary for fast /analytics reads (warm between requests).
 */

import { appendEvent, getAllEvents, getRecentDaysEvents } from './kv.js';

// Metrics epoch — dashboard counts events from this date forward.
// Set 2026-04-11T16:58:53.562Z: manual clean-slate reset requested by founder.
const METRICS_EPOCH = '2026-04-11T16:58:53.562Z';

// ---------------------------------------------------------------------------
// Types — intentionally open-ended
// ---------------------------------------------------------------------------

/** Any string key-value pairs. No fixed schema. Evolves with the system. */
export type EventMeta = Record<string, string>;

// ---------------------------------------------------------------------------
// In-memory summary (fast reads for /analytics, warm between requests)
// ---------------------------------------------------------------------------

interface Summary {
  total: number;
  by_key: Record<string, number>;
  since: string;
  last_event: string | null;
}

const summary: Summary = {
  total: 0,
  by_key: {},
  since: new Date().toISOString(),
  last_event: null,
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

// Pending JSONL lines — collected during request, flushed as one KV write.
// Batching avoids read-modify-write races between concurrent appends.
let pendingLines: string[] = [];

/**
 * Log an event. One JSONL line queued in memory, update in-memory summary.
 * KV write happens in flushEvents() — call via ctx.waitUntil() to ensure completion.
 */
export function logEvent(type: string, meta?: EventMeta): void {
  const now = new Date().toISOString();

  // In-memory summary
  summary.total++;
  summary.last_event = now;
  const parts: string[] = [type, ...Object.values(meta || {})];
  const key = parts.join(':');
  summary.by_key[key] = (summary.by_key[key] || 0) + 1;

  // JSONL entry — flat, open-ended
  const entry: Record<string, string> = { t: now, e: type, ...meta };
  pendingLines.push(JSON.stringify(entry) + '\n');
}

/**
 * Flush all pending event lines as one KV write. Call via ctx.waitUntil(flushEvents())
 * to ensure KV writes complete before the Worker isolate is killed.
 * Single write per flush eliminates read-modify-write races between events.
 */
export function flushEvents(): Promise<void> {
  if (pendingLines.length === 0) return Promise.resolve();
  const batch = pendingLines.splice(0).join('');
  return appendEvent(batch).catch((err) => {
    console.error('[analytics] Failed to flush events:', err);
  });
}

/**
 * Get summary counts (fast, in-memory).
 */
export function getAnalytics(): Summary {
  return { ...summary, by_key: { ...summary.by_key } };
}

/**
 * Get full event log as raw JSONL string.
 */
export async function getEventLog(): Promise<string> {
  try {
    return await getAllEvents();
  } catch {
    return '';
  }
}

/**
 * Monitoring dashboard — verification signals.
 */
export async function getDashboard(): Promise<Record<string, unknown> & { _events?: Record<string, string>[] }> {
  let events: Record<string, string>[] = [];
  let parseErrors = 0;
  try {
    const raw = await getRecentDaysEvents(30);
    if (!raw) return { status: 'no data', message: 'No events logged yet.' };
    const lines = raw.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        events.push(JSON.parse(line));
      } catch {
        parseErrors++;
      }
    }
    if (parseErrors > 0) {
      console.error(`[analytics] Skipped ${parseErrors} corrupted event log lines`);
    }
  } catch {
    return { status: 'no data', message: 'No events logged yet.' };
  }

  if (events.length === 0) {
    return { status: 'no data', message: 'No events logged yet.' };
  }

  // 1. Heartbeats (hooks ran) — backward compat: old "end" events count as heartbeats
  // Filter automated/test traffic by prefix convention — no hardcoded list to maintain
  const isSmoke = (s: string) => /^(smoke_|test_|debug_|lifecycle-)/.test(s) || s === 'verification' || s === 'github_smoke';
  const isReal = (e: Record<string, string>) =>
    e.e === 'prosumer_session' && !isSmoke(e.event) && !isSmoke(e.platform);
  const heartbeats = events.filter(e => isReal(e) && (e.event === 'heartbeat' || e.event === 'end' || e.event === 'active' || e.event === 'auto')).length;

  // Time range + staleness
  const firstEvent = events[0]?.t || null;
  const lastEvent = events[events.length - 1]?.t || null;
  const hoursSinceLastEvent = lastEvent
    ? Math.round((Date.now() - new Date(lastEvent).getTime()) / (1000 * 60 * 60) * 10) / 10
    : null;
  const stale = hoursSinceLastEvent !== null && hoursSinceLastEvent > 24;

  // Anomaly detection
  const sessionEvents = events.filter(e => e.e === 'prosumer_session');
  const lastSessionEvent = sessionEvents.length > 0 ? sessionEvents[sessionEvents.length - 1].t : null;
  const hoursSinceLastSession = lastSessionEvent
    ? Math.round((Date.now() - new Date(lastSessionEvent).getTime()) / (1000 * 60 * 60) * 10) / 10
    : null;

  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  const smokeFailures24h = events.filter(
    e => e.event === 'hook_failure' && new Date(e.t).getTime() > twentyFourHoursAgo
  ).length;

  // Cron execution status
  let cronStatus: Record<string, unknown> = {};
  try {
    const { getKV } = await import('./kv.js');
    const kv = getKV();
    for (const job of ['followup', 'engagement', 'health_digest']) {
      const raw = await kv.get(`cron:${job}`);
      cronStatus[job] = raw ? JSON.parse(raw) : { t: null, status: 'never_run' };
    }
  } catch { /* non-fatal */ }

  // Active users — per-author stats (from epoch forward for clean metrics)
  // Deterministic model with session_id sets (plus legacy fallback when session_id is absent).
  const authorStats: Record<string, {
    start_ids: Set<string>;
    end_ids: Set<string>;
    active_ids: Set<string>;
    active_from_end_ids: Set<string>;
    orphan_end_ids: Set<string>;
    recovered_end_ids: Set<string>;
    legacy_starts: number;
    legacy_ends: number;
    legacy_active: number;
    auto_attempt: number;
    auto_legacy: number;
    failures: number;
    unknown: number;
    last_seen: string;
    platforms: Set<string>;
  }> = {};
  let startsWithId = 0;
  let startsWithoutId = 0;
  let endsWithId = 0;
  let endsWithoutId = 0;
  for (const e of events) {
    if (e.e !== 'prosumer_session' || !e.author) continue;
    if (e.t < METRICS_EPOCH) continue;
    if (isSmoke(e.event)) continue;
    if (!authorStats[e.author]) {
      authorStats[e.author] = {
        start_ids: new Set(),
        end_ids: new Set(),
        active_ids: new Set(),
        active_from_end_ids: new Set(),
        orphan_end_ids: new Set(),
        recovered_end_ids: new Set(),
        legacy_starts: 0,
        legacy_ends: 0,
        legacy_active: 0,
        auto_attempt: 0,
        auto_legacy: 0,
        failures: 0,
        unknown: 0,
        last_seen: e.t,
        platforms: new Set(),
      };
    }
    const stat = authorStats[e.author];
    const sid = (e.session_id || '').trim();
    const hasSid = sid.length > 0 && sid !== 'unknown' && sid !== 'null';
    if (e.event === 'hook_failure') { stat.failures++; }
    else if (e.event === 'heartbeat') {
      if (hasSid) { stat.start_ids.add(sid); startsWithId++; }
      else { stat.legacy_starts++; startsWithoutId++; }
    }
    else if (e.event === 'end') {
      if (hasSid) {
        stat.end_ids.add(sid);
        endsWithId++;
        if (!stat.start_ids.has(sid)) stat.orphan_end_ids.add(sid);
        if (e.was_active === 'true') stat.active_from_end_ids.add(sid);
        if (e.recovered === 'true') stat.recovered_end_ids.add(sid);
      } else {
        stat.legacy_ends++;
        endsWithoutId++;
        if (e.was_active === 'true') stat.legacy_active++;
      }
    }
    else if (e.event === 'active') {
      if (hasSid) stat.active_ids.add(sid);
      else stat.legacy_active++;
    }
    else if (e.event === 'auto_attempt') { stat.auto_attempt++; }
    else if (e.event === 'auto') { stat.auto_legacy++; }
    else if (e.event === 'unknown') { stat.unknown++; }
    if (e.t > stat.last_seen) stat.last_seen = e.t;
    if (e.platform) stat.platforms.add(e.platform);
  }

  const users = Object.entries(authorStats).map(([login, stat]) => {
    const starts = stat.start_ids.size + stat.legacy_starts;
    const ends = stat.end_ids.size + stat.legacy_ends;
    const active_started = stat.active_ids.size + stat.legacy_active;
    const active_completed = stat.active_from_end_ids.size + stat.legacy_active;
    const open_sessions = Math.max(stat.start_ids.size - stat.end_ids.size, 0);
    // "auto" on the dashboard means autoloop trigger attempts (plumbing truth).
    // Legacy fallback: before auto_attempt existed, only auto (brief-sent) was logged.
    const auto = stat.auto_attempt > 0 ? stat.auto_attempt : stat.auto_legacy;
    return {
      login,
      starts,
      ends,
      end_pct: starts > 0 ? Math.round(ends / starts * 100) : 0,
      active: active_completed,
      active_started,
      active_completed,
      auto,
      open_sessions,
      recovered_ends: stat.recovered_end_ids.size,
      orphan_ends: stat.orphan_end_ids.size,
      unknown_events: stat.unknown,
      last_seen: stat.last_seen,
      hours_ago: Math.round((Date.now() - new Date(stat.last_seen).getTime()) / (1000 * 60 * 60) * 10) / 10,
      failures: stat.failures,
      platforms: [...stat.platforms],
    };
  }).sort((a, b) => b.starts - a.starts || a.hours_ago - b.hours_ago);

  const verification = {
    session_id_coverage: {
      starts_with_id: startsWithId,
      starts_without_id: startsWithoutId,
      ends_with_id: endsWithId,
      ends_without_id: endsWithoutId,
    },
    open_sessions_total: users.reduce((n, u) => n + u.open_sessions, 0),
    orphan_ends_total: users.reduce((n, u) => n + u.orphan_ends, 0),
    recovered_ends_total: users.reduce((n, u) => n + u.recovered_ends, 0),
    active_started_total: users.reduce((n, u) => n + (u.active_started || 0), 0),
    active_completed_total: users.reduce((n, u) => n + (u.active_completed || 0), 0),
    unknown_events_total: users.reduce((n, u) => n + u.unknown_events, 0),
  };

  const invariantIssues: string[] = [];
  if (startsWithoutId > 0) invariantIssues.push(`starts_without_session_id=${startsWithoutId}`);
  if (endsWithoutId > 0) invariantIssues.push(`ends_without_session_id=${endsWithoutId}`);
  if (verification.orphan_ends_total > 0) invariantIssues.push(`orphan_ends=${verification.orphan_ends_total}`);
  if (verification.unknown_events_total > 0) invariantIssues.push(`unknown_events=${verification.unknown_events_total}`);

  const status = invariantIssues.length > 0
    ? `degraded — lifecycle invariant failure (${invariantIssues.join(', ')})`
    : 'ok — lifecycle invariants satisfied';

  return {
    status,
    time_range: { first: firstEvent, last: lastEvent, hours_since_last: hoursSinceLastEvent },
    telemetry_health: {
      stale,
      parse_errors: parseErrors,
      message: stale
        ? 'no events for 24+ hours, possible silent connector failure'
        : parseErrors > 0
          ? `${parseErrors} corrupted log lines skipped`
          : 'ok',
    },
    cron: cronStatus,
    users,
    total_events: events.length,
    parse_errors: parseErrors,
    heartbeats,
    errors: {
      log_parse_errors: parseErrors,
    },
    anomaly: {
      last_session_event: lastSessionEvent,
      hours_since_last_session: hoursSinceLastSession,
      smoke_failures_24h: smokeFailures24h,
    },
    verification,
    library: await getLibraryMetrics(events),
    factory: await getFactoryStatus(events),
    _events: events,
  };
}

/**
 * Factory loop status — is the cross-Author learning loop working?
 */
async function getFactoryStatus(events: Record<string, string>[]): Promise<Record<string, unknown>> {
  try {
    const { getKV } = await import('./kv.js');
    const kv = getKV();

    // Pending signals (not yet archived)
    const pending = await kv.list({ prefix: 'factory:signal:' });
    // Archived signals (processed, 30-day TTL)
    const archived = await kv.list({ prefix: 'factory:archive:' });
    // Current delta
    const delta = await kv.get('factory:delta');

    // Last delta write from event log
    const deltaWrites = events.filter(e => e.e === 'factory_delta_written');
    const lastDeltaWrite = deltaWrites.length > 0 ? deltaWrites[deltaWrites.length - 1].t : null;
    const daysSinceDelta = lastDeltaWrite
      ? Math.round((Date.now() - new Date(lastDeltaWrite).getTime()) / (1000 * 60 * 60 * 24) * 10) / 10
      : null;

    // Last archive from event log
    const archiveEvents = events.filter(e => e.e === 'factory_signals_archived');
    const lastArchive = archiveEvents.length > 0 ? archiveEvents[archiveEvents.length - 1].t : null;

    // Signal ingest rate
    const signalEvents = events.filter(e => e.e === 'machine_signal');
    const signalsThisWeek = signalEvents.filter(e =>
      Date.now() - new Date(e.t).getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    return {
      status: delta ? (daysSinceDelta !== null && daysSinceDelta > 10 ? 'stale — delta not updated in 10+ days' : 'ok') : 'no delta yet',
      signals_pending: pending.keys.length,
      signals_archived: archived.keys.length,
      signals_this_week: signalsThisWeek,
      delta_length: delta?.length || 0,
      last_delta_write: lastDeltaWrite,
      days_since_delta: daysSinceDelta,
      last_archive: lastArchive,
    };
  } catch {
    return { status: 'error reading factory state' };
  }
}

/**
 * Library metrics — pulled from D1 (structured) + event log (signal).
 */
async function getLibraryMetrics(events: Record<string, string>[]): Promise<Record<string, unknown>> {
  // Event-based metrics (from JSONL log)
  const libraryEvents = events.filter(e => e.e?.startsWith('library_'));
  const shadowViews = libraryEvents.filter(e => e.e === 'library_shadow_view').length;
  const pulseViews = libraryEvents.filter(e => e.e === 'library_pulse_view').length;
  const quizzesTaken = libraryEvents.filter(e => e.e === 'library_quiz_taken').length;
  const workViews = libraryEvents.filter(e => e.e === 'library_work_view').length;
  const paidAccess = libraryEvents.filter(e => e.e === 'library_paid_access').length;
  const publishes = libraryEvents.filter(e => e.e === 'library_publish_shadow').length;
  const purchases = libraryEvents.filter(e => e.e === 'library_purchase').length;

  // D1 metrics (if available)
  let d1Metrics: Record<string, unknown> = {};
  try {
    const { getDB } = await import('./db.js');
    const db = getDB();
    const counts = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM authors) as total_authors,
        (SELECT COUNT(*) FROM shadows) as total_shadows,
        (SELECT COUNT(*) FROM quizzes WHERE active = 1) as total_quizzes,
        (SELECT COUNT(*) FROM works) as total_works,
        (SELECT COUNT(*) FROM quiz_results) as total_quiz_completions,
        (SELECT COUNT(*) FROM referrals) as total_referrals
    `).first();
    if (counts) d1Metrics = counts as Record<string, unknown>;
  } catch {
    // D1 not available — ok, just return event-based metrics
  }

  // RL signal health — is the Library feedback loop working?
  let rlSignal: Record<string, unknown> = {};
  try {
    const { getDB } = await import('./db.js');
    const db = getDB();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // How many access_log entries have meta (enriched signal vs bare events)
    const metaStats = await db.prepare(`
      SELECT
        COUNT(*) as total_events,
        COUNT(meta) as events_with_meta,
        COUNT(DISTINCT author_id) as active_authors,
        COUNT(DISTINCT event) as event_types
      FROM access_log WHERE created_at > ?
    `).bind(thirtyDaysAgo).first();

    // Publish → engagement ratio per author (are published artifacts getting seen?)
    const publishCount = await db.prepare(
      `SELECT COUNT(*) as c FROM access_log WHERE event LIKE 'publish_%' AND created_at > ?`
    ).bind(thirtyDaysAgo).first<{ c: number }>();
    const engagementCount = await db.prepare(
      `SELECT COUNT(*) as c FROM access_log WHERE event NOT LIKE 'publish_%' AND created_at > ?`
    ).bind(thirtyDaysAgo).first<{ c: number }>();

    rlSignal = {
      status: (metaStats as any)?.total_events > 0 ? 'active' : 'no signal',
      last_30d: metaStats || {},
      publish_to_engagement_ratio: publishCount?.c && engagementCount?.c
        ? `${publishCount.c} publishes → ${engagementCount.c} engagements`
        : 'no data',
    };
  } catch {
    rlSignal = { status: 'd1 unavailable' };
  }

  return {
    events: { shadow_views: shadowViews, pulse_views: pulseViews, quizzes_taken: quizzesTaken, work_views: workViews, paid_access: paidAccess, publishes, purchases },
    rl_signal: rlSignal,
    ...d1Metrics,
  };
}

/**
 * Per-user event history — drill into a specific author's sessions and errors.
 */
export async function getUserEvents(login: string): Promise<Record<string, unknown>> {
  let events: Record<string, string>[] = [];
  try {
    const raw = await getRecentDaysEvents(30);
    if (!raw) return { status: 'no data', author: login };
    const lines = raw.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const ev = JSON.parse(line);
        if (ev.author === login) events.push(ev);
      } catch { continue; }
    }
  } catch {
    return { status: 'no data', author: login };
  }

  const allSessions = events.filter(e => e.e === 'prosumer_session');
  const heartbeatEvents = allSessions.filter(e => e.event === 'end' || e.event === 'heartbeat' || e.event === 'active' || e.event === 'auto');
  const failures = allSessions.filter(e => e.event === 'hook_failure');
  const feedback = events.filter(e => e.e === 'user_feedback');
  const signals = events.filter(e => e.e === 'machine_signal');
  const lastSession = allSessions.length > 0 ? allSessions[allSessions.length - 1] : null;

  return {
    author: login,
    total_events: events.length,
    heartbeats: heartbeatEvents.length,
    sessions: {
      last: lastSession,
      platforms: [...new Set(allSessions.map(s => s.platform).filter(Boolean))],
      blueprint_fetched_rate: heartbeatEvents.length > 0
        ? Math.round(heartbeatEvents.filter(s => s.blueprint_fetched === 'true').length / heartbeatEvents.length * 100) + '%'
        : null,
      constitution_injected_rate: heartbeatEvents.length > 0
        ? Math.round(heartbeatEvents.filter(s => s.constitution_injected === 'true').length / heartbeatEvents.length * 100) + '%'
        : null,
    },
    failures: {
      total: failures.length,
      recent: failures.slice(-5),
    },
    feedback: feedback.slice(-10),
    machine_signals: signals.length,
    recent_events: events.slice(-20),
  };
}

/**
 * Archive factory signals from input queue.
 * Moves factory:signal:* → factory:archive:* with 30-day TTL.
 * Delta synthesis happens in the meta trigger (weekly, Opus) — not here.
 */
export async function archiveFactorySignals(): Promise<{ archived: number }> {
  const { getKV } = await import('./kv.js');
  const kv = getKV();

  // Paginate — KV list returns max 1000 per call
  const allKeys: { name: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: 'factory:signal:', cursor });
    allKeys.push(...page.keys);
    cursor = page.list_complete ? undefined : (page as any).cursor;
  } while (cursor);

  if (allKeys.length === 0) return { archived: 0 };

  for (const key of allKeys) {
    try {
      const raw = await kv.get(key.name);
      if (raw) {
        const archiveKey = key.name.replace('factory:signal:', 'factory:archive:');
        await kv.put(archiveKey, raw, { expirationTtl: 30 * 24 * 60 * 60 });
      }
      await kv.delete(key.name);
    } catch { continue; }
  }

  logEvent('factory_signals_archived', { count: String(allKeys.length) });
  return { archived: allKeys.length };
}

export async function getRecentEvents(n: number = 200): Promise<string> {
  try {
    const full = await getRecentDaysEvents(7);
    if (!full) return '';
    const lines = full.trim().split('\n');
    const recent = lines.slice(-n);
    return recent.join('\n');
  } catch {
    return '';
  }
}
