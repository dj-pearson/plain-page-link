import { useEffect } from 'react';

export default function SitemapXml() {
  useEffect(() => {
    // Fetch sitemap from edge function
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          'https://axoqjwvqxgtzsdmlmnbv.supabase.co/functions/v1/sitemap'
        );
        const xmlText = await response.text();
        
        // Replace the entire page with the XML content
        document.open();
        document.write(xmlText);
        document.close();
        
        // Set the content type
        document.contentType = 'application/xml';
      } catch (error) {
        console.error('Error fetching sitemap:', error);
        document.body.innerHTML = '<h1>Error loading sitemap</h1>';
      }
    };

    fetchSitemap();
  }, []);

  return null;
}
