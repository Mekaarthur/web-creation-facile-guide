// Génère le sitemap local pour le SEO
import { services, cities } from '@/data/seoLocalData';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const generateLocalSitemapEntries = (): SitemapEntry[] => {
  const today = new Date().toISOString().split('T')[0];
  const entries: SitemapEntry[] = [];

  // Générer une entrée pour chaque combinaison service + ville
  services.forEach(service => {
    cities.forEach(city => {
      entries.push({
        url: `https://bikawo.com/services/${service.slug}/${city.slug}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
  });

  return entries;
};

export const generateLocalSitemapXML = (): string => {
  const entries = generateLocalSitemapEntries();
  
  const urlsXML = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXML}
</urlset>`;
};

// Export des URLs pour le sitemap principal
export const getLocalServiceUrls = (): string[] => {
  const urls: string[] = [];
  
  services.forEach(service => {
    cities.forEach(city => {
      urls.push(`/services/${service.slug}/${city.slug}`);
    });
  });
  
  return urls;
};
