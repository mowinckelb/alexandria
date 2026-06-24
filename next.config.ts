import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/patron', destination: '/follow', permanent: true },
      // The install one-liner: `curl -fsSL alexandria-library.com/a | bash`.
      // `/a` is the protocol's name (lowercase, like git). Redirects to the raw
      // setup.sh on GitHub; curl -fsSL follows it (-L). NON-permanent (307) so the
      // target stays changeable without breaking the command everyone copied.
      // Humans land on /start (the primer); `/a` is the machine target only.
      {
        source: '/a',
        destination: 'https://raw.githubusercontent.com/mowinckelb/alexandria/main/factory/setup.sh',
        permanent: false,
      },
      // The front door is now the keyless primer at /start (free, one copy-paste,
      // no account). The old /signup OAuth covenant ($10/kin) is retired with the
      // free model. The homepage + library pages still link to /signup; they land
      // on /start. NON-permanent so we can restore an OAuth page when the hub
      // (joining the Library / being seen) is built. Query (?ref=…) is dropped —
      // /start is keyless, no referral.
      { source: '/signup', destination: '/start', permanent: false },
      // Marketplace detail pages were retired in favour of linking straight to
      // github (the markdown source is rendered there with full file tree, forks,
      // history, and comments — no point rebuilding any of it). Old inbound links
      // permanently route to the github source.
      {
        source: '/marketplace/:user/:repo/:path*',
        destination: 'https://github.com/:user/:repo/blob/HEAD/:path*.md',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
