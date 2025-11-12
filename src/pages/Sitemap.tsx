import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Sitemap() {
  useEffect(() => {
    const generateSitemap = async () => {
      try {
        // Fetch all published profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('username, updated_at')
          .eq('is_published', true)
          .order('updated_at', { ascending: false });

        const baseUrl = window.location.origin;
        const now = new Date().toISOString();

        // Generate sitemap XML
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/pricing</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${profiles?.map(profile => `  <url>
    <loc>${baseUrl}/${profile.username}</loc>
    <lastmod>${profile.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

        // Set content type and return XML
        const blob = new Blob([sitemap], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        // Download the sitemap
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();
        
        // Display the sitemap safely
        const pre = document.createElement('pre');
        pre.style.fontFamily = 'monospace';
        pre.style.padding = '20px';
        pre.textContent = sitemap; // textContent automatically escapes
        document.body.innerHTML = ''; // Clear first
        document.body.appendChild(pre);
        document.title = 'Sitemap.xml';
        
      } catch (error) {
        console.error('Error generating sitemap:', error);
        document.body.innerHTML = '<h1>Error generating sitemap</h1>';
      }
    };

    generateSitemap();
  }, []);

  return null;
}
