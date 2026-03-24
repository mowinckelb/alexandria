import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — alexandria.",
};

export default function Terms() {
  return (
    <main style={{
      maxWidth: '640px',
      margin: '0 auto',
      padding: '4rem 1.5rem',
      fontFamily: 'var(--font-eb-garamond)',
      color: 'var(--text-primary)',
      lineHeight: 1.7,
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 400 }}>Terms of Service</h1>
      <p style={{ marginBottom: '1rem', fontSize: '0.85rem', opacity: 0.5 }}>Last updated: March 24, 2026</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>What this is</h2>
        <p>Alexandria is a service that connects your AI conversations to a personal cognitive profile stored on your Google Drive. These terms govern your use of the Alexandria MCP server and website at mowinckel.ai.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Your data</h2>
        <p>You own your data. Your Constitution, Vault, and all files live on your Google Drive. Alexandria does not store, own, or claim any rights to your data. We are a pass-through. If you stop using Alexandria, your files remain on your Drive, unchanged and fully yours.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>The service</h2>
        <p>Alexandria is provided as-is. We aim for reliability but make no guarantees of uptime or availability. The service is in early development. Things may change, break, or be discontinued. We will give reasonable notice before any changes that affect your data access.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Acceptable use</h2>
        <p>Use Alexandria for its intended purpose: developing your cognitive profile through AI conversations. Do not attempt to access other users&apos; data, reverse-engineer the server, or use the service to harm others.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Liability</h2>
        <p>Alexandria is not liable for data loss on your Google Drive, AI outputs generated using your profile, or service interruptions. Your data sovereignty means your data responsibility.</p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 400 }}>Contact</h2>
        <p>Benjamin Mowinckel — <a href="mailto:benjamin@mowinckel.ai" style={{ color: 'var(--text-primary)' }}>benjamin@mowinckel.ai</a></p>
      </section>
    </main>
  );
}
