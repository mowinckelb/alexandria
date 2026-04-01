import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';

// ---------------------------------------------------------------------------
// Google Sheets append via direct REST API — no googleapis SDK needed
// ---------------------------------------------------------------------------

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

async function getAccessToken(creds: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(creds.private_key, 'RS256');
  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(creds.client_email)
    .setSubject(creds.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function appendRow(spreadsheetId: string, values: string[], creds: ServiceAccountCredentials): Promise<void> {
  const token = await getAccessToken(creds);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:D:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [values] }),
  });
  if (!res.ok) {
    throw new Error(`Sheets API error: ${res.status} ${await res.text()}`);
  }
}

const SPREADSHEET_ID = process.env.WAITLIST_SHEET_ID!;

// Simple in-memory rate limiting: max 5 requests per IP per minute
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { email, type, source } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }

    const validTypes = ['author', 'investor'];
    const waitlistType = validTypes.includes(type) ? type : 'author';
    const waitlistSource = source === 'confidential' ? 'confidential' : 'public';

    const creds: ServiceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');
    await appendRow(SPREADSHEET_ID, [
      email.toLowerCase().trim(),
      waitlistType,
      waitlistSource,
      new Date().toISOString(),
    ], creds);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    return NextResponse.json({ error: 'Failed to join waitlist.' }, { status: 500 });
  }
}
