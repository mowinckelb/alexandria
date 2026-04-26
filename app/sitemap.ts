import type { MetadataRoute } from 'next';
import { SITE_URL } from './lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date(), priority: 1 },
    { url: `${SITE_URL}/join`, lastModified: new Date(), priority: 0.9 },
    { url: `${SITE_URL}/vision`, lastModified: new Date(), priority: 0.8 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), priority: 0.3 },
  ];
}
