import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — alexandria.",
};

export default function Privacy() {
  return (
    <main style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '4rem 1.5rem',
      fontFamily: 'var(--font-eb-garamond)',
      color: 'var(--text-primary)',
      lineHeight: 1.7,
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 400 }}>Privacy Policy</h1>
      <p style={{ marginBottom: '1rem', fontSize: '0.85rem', opacity: 0.5 }}>Last updated: March 24, 2026</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>What Alexandria does</h2>
        <p>Alexandria is a sovereign cognitive identity layer. It helps AI systems understand who you are by maintaining a personal profile — your Constitution — on your own Google Drive.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>What we store</h2>
        <p>Nothing. Alexandria&apos;s server is stateless. Your Constitution, Vault, notepads, and feedback live on your Google Drive, in a folder you own. We do not store, cache, or retain any user data. The server passes information through and forgets it.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Authentication</h2>
        <p>Alexandria uses Google OAuth to access your Drive. Your Google refresh token is encrypted and passed back to you as your access credential. We never store it. If you disconnect, the token is gone — there is nothing to delete on our end because there was nothing to begin with.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Anonymous usage data</h2>
        <p>We log anonymous events (tool calls, not content) to improve the product. These contain no personal information, no user identifiers, and no content from your conversations or Constitution. You can see exactly what we log in our dashboard.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Google Drive access</h2>
        <p>Alexandria requests access to Google Drive to read and write files in your Alexandria folder. We do not access any other files on your Drive. The scope is <code>https://www.googleapis.com/auth/drive</code> because Google does not offer a folder-scoped permission, but our code only touches the Alexandria folder.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Your rights</h2>
        <p>Your data is yours. It lives on your Drive. You can read, edit, or delete it at any time. Disconnecting Alexandria removes all access. There is no account to delete because we never created one.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Contact</h2>
        <p>Benjamin Mowinckel — <a href="mailto:benjamin@mowinckel.ai" style={{ color: 'var(--text-primary)' }}>benjamin@mowinckel.ai</a></p>
      </section>
    </main>
  );
}
