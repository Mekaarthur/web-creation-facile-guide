import { seoStructuredData } from './seoData';

export const generateSitemap = () => {
  const baseUrl = 'https://bikawo.fr';
  const currentDate = new Date().toISOString();
  
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/services', priority: '0.9', changefreq: 'monthly' },
    { url: '/a-propos-de-nous', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog', priority: '0.9', changefreq: 'weekly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/espace-personnel', priority: '0.6', changefreq: 'monthly' },
    { url: '/espace-prestataire', priority: '0.6', changefreq: 'monthly' },
    { url: '/nous-recrutons', priority: '0.5', changefreq: 'monthly' },
    { url: '/aide', priority: '0.4', changefreq: 'monthly' }
  ];

  const blogPosts = [
    { url: '/blog/10-signes-charge-mentale', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/guide-deleguer-sans-culpabiliser', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/cout-aide-menagere-vs-temps', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog/selectionner-meilleure-garde-enfants', priority: '0.8', changefreq: 'monthly' }
  ];

  const allPages = [...staticPages, ...blogPosts];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};

export const generateBlogSitemap = () => {
  const baseUrl = 'https://bikawo.fr';
  const currentDate = new Date().toISOString();
  
  const blogPosts = [
    {
      url: '/blog/10-signes-charge-mentale',
      lastmod: '2024-01-15',
      images: ['/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png']
    },
    {
      url: '/blog/guide-deleguer-sans-culpabiliser', 
      lastmod: '2024-01-10',
      images: ['/lovable-uploads/7289c795-0ba4-4e3f-86dc-cd0e3310a306.png']
    },
    {
      url: '/blog/cout-aide-menagere-vs-temps',
      lastmod: '2024-01-05', 
      images: ['/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png']
    },
    {
      url: '/blog/selectionner-meilleure-garde-enfants',
      lastmod: '2024-01-01',
      images: ['/lovable-uploads/1ac09068-74a1-4d44-bdc6-d342fcb10cd4.png']
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${blogPosts.map(post => `  <url>
    <loc>${baseUrl}${post.url}</loc>
    <lastmod>${post.lastmod}T00:00:00+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
${post.images.map(image => `    <image:image>
      <image:loc>${baseUrl}${image}</image:loc>
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};