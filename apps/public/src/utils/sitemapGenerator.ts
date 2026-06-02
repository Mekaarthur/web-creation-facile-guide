import { blogPosts } from '@/data/blogPosts';

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

  // Generate blog posts dynamically from blogPosts data
  const blogPostsUrls = blogPosts.map(post => ({
    url: `/blog/${post.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: post.publishedAt
  }));

  const allPages = [...staticPages, ...blogPostsUrls];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${(page as any).lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};

export const generateBlogSitemap = () => {
  const baseUrl = 'https://bikawo.fr';
  
  // Generate blog posts dynamically from blogPosts data
  const blogPostsWithImages = blogPosts.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: post.publishedAt,
    images: [post.image]
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${blogPostsWithImages.map(post => `  <url>
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