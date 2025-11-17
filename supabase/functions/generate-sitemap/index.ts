import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Blog posts data (centralized)
const blogPosts = [
  {
    slug: "10-signes-charge-mentale",
    publishedAt: "2024-01-15",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png"
  },
  {
    slug: "guide-deleguer-sans-culpabiliser",
    publishedAt: "2024-01-10",
    image: "/lovable-uploads/7289c795-0ba4-4e3f-86dc-cd0e3310a306.png"
  },
  {
    slug: "cout-aide-menagere-vs-temps",
    publishedAt: "2024-01-05",
    image: "/lovable-uploads/4a8ac677-6a3b-48a7-8b21-5c9953137147.png"
  },
  {
    slug: "selectionner-meilleure-garde-enfants",
    publishedAt: "2024-01-01",
    image: "/lovable-uploads/1ac09068-74a1-4d44-bdc6-d342fcb10cd4.png"
  },
  {
    slug: "organiser-planning-familial",
    publishedAt: "2023-12-28",
    image: "/lovable-uploads/3496ff80-ec42-436d-8734-200bcb42494f.png"
  },
  {
    slug: "meditation-parents-bienfaits",
    publishedAt: "2023-12-20",
    image: "/lovable-uploads/89199702-071c-4c4a-9b41-72fb5742cbee.png"
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Generate blog posts URLs dynamically
    const blogPostsUrls = blogPosts.map(post => ({
      url: `/blog/${post.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: post.publishedAt,
      image: post.image
    }));

    const allPages = [...staticPages, ...blogPostsUrls];

    // Generate main sitemap
    const mainSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${(page as any).lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>${(page as any).image ? `
    <image:image>
      <image:loc>${baseUrl}${(page as any).image}</image:loc>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;

    // Generate blog-specific sitemap with images
    const blogSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${blogPostsUrls.map(post => `  <url>
    <loc>${baseUrl}${post.url}</loc>
    <lastmod>${post.lastmod}T00:00:00+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${baseUrl}${post.image}</image:loc>
    </image:image>
  </url>`).join('\n')}
</urlset>`;

    console.log('Sitemap generated successfully');
    console.log(`Total pages: ${allPages.length} (${staticPages.length} static + ${blogPostsUrls.length} blog posts)`);

    return new Response(
      JSON.stringify({ 
        success: true,
        mainSitemap,
        blogSitemap,
        stats: {
          totalPages: allPages.length,
          staticPages: staticPages.length,
          blogPosts: blogPostsUrls.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
