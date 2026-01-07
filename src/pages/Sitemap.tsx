import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sitemap Generator Component
 * Generates and displays XML sitemap for SEO
 *
 * Security: Uses React state instead of direct DOM manipulation
 * to prevent XSS vulnerabilities
 */
export default function Sitemap() {
  const [sitemapContent, setSitemapContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        // Fetch all published profiles
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('username, updated_at')
          .eq('is_published', true)
          .order('updated_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        const baseUrl = window.location.origin;
        const now = new Date().toISOString();

        // Escape XML special characters in usernames
        const escapeXml = (str: string): string => {
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        };

        // Generate sitemap XML
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(baseUrl)}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(baseUrl)}/pricing</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${escapeXml(baseUrl)}/blog</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${escapeXml(baseUrl)}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${escapeXml(baseUrl)}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
${profiles?.map(profile => `  <url>
    <loc>${escapeXml(baseUrl)}/${escapeXml(profile.username || '')}</loc>
    <lastmod>${profile.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n') || ''}
</urlset>`;

        setSitemapContent(sitemap);
        document.title = 'Sitemap.xml';

        // Trigger download
        const blob = new Blob([sitemap], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();
        URL.revokeObjectURL(url);

      } catch (err) {
        console.error('Error generating sitemap:', err);
        setError('Error generating sitemap. Please try again later.');
      }
    };

    generateSitemap();
  }, []);

  // Error state - rendered safely via React
  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#dc2626' }}>{error}</h1>
      </div>
    );
  }

  // Loading state
  if (!sitemapContent) {
    return (
      <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <p>Generating sitemap...</p>
      </div>
    );
  }

  // Display sitemap safely via React (textContent equivalent)
  return (
    <pre
      style={{
        fontFamily: 'monospace',
        padding: '20px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: '#f5f5f5',
        margin: 0,
        minHeight: '100vh',
      }}
    >
      {sitemapContent}
    </pre>
  );
}
