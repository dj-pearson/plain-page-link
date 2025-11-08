import { useState, useCallback } from "react";

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
  isValid: boolean;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

export function useLinkValidation() {
  const [validating, setValidating] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);

  /**
   * Validates URL format and attempts to fix common issues
   */
  const validateUrl = useCallback((url: string): ValidationResult => {
    if (!url || url.trim().length === 0) {
      return { isValid: false, error: "URL is required" };
    }

    let formatted = url.trim();

    // Add https:// if no protocol specified
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }

    // Try to parse the URL
    try {
      const urlObj = new URL(formatted);

      // Check if it has a valid hostname
      if (!urlObj.hostname || urlObj.hostname.length < 3) {
        return { isValid: false, error: "Invalid domain name" };
      }

      // Check if hostname has at least one dot (domain.tld)
      if (!urlObj.hostname.includes('.')) {
        return { isValid: false, error: "Invalid domain format" };
      }

      // Validate TLD (basic check)
      const parts = urlObj.hostname.split('.');
      const tld = parts[parts.length - 1];
      if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
        return { isValid: false, error: "Invalid top-level domain" };
      }

      return { isValid: true, formatted };
    } catch (error) {
      return { isValid: false, error: "Invalid URL format" };
    }
  }, []);

  /**
   * Detects the platform type from the URL
   */
  const detectPlatform = useCallback((url: string): string | null => {
    const hostname = new URL(url).hostname.toLowerCase();

    const platforms: Record<string, string> = {
      'instagram.com': 'instagram',
      'facebook.com': 'facebook',
      'linkedin.com': 'linkedin',
      'tiktok.com': 'tiktok',
      'youtube.com': 'youtube',
      'youtu.be': 'youtube',
      'twitter.com': 'twitter',
      'x.com': 'twitter',
      'zillow.com': 'zillow',
      'realtor.com': 'realtor',
      'calendly.com': 'calendar',
      'cal.com': 'calendar',
    };

    for (const [domain, platform] of Object.entries(platforms)) {
      if (hostname.includes(domain)) {
        return platform;
      }
    }

    return null;
  }, []);

  /**
   * Generates a preview for the URL
   * In a real implementation, this would fetch OG tags from the URL
   * For now, it uses URL parsing and platform detection
   */
  const generatePreview = useCallback(async (url: string): Promise<LinkPreview> => {
    setValidating(true);

    try {
      // Validate the URL first
      const validation = validateUrl(url);
      if (!validation.isValid) {
        setValidating(false);
        return {
          url,
          isValid: false,
          error: validation.error,
        };
      }

      const formattedUrl = validation.formatted!;
      const urlObj = new URL(formattedUrl);

      // Detect platform
      const platform = detectPlatform(formattedUrl);

      // Generate preview based on platform or URL
      let title = urlObj.hostname.replace('www.', '');
      let description = formattedUrl;
      let icon = platform || 'link';

      // Platform-specific defaults
      const platformDefaults: Record<string, { title: string; description: string }> = {
        instagram: { title: 'Instagram Profile', description: 'Follow on Instagram' },
        facebook: { title: 'Facebook Page', description: 'Visit on Facebook' },
        linkedin: { title: 'LinkedIn Profile', description: 'Connect on LinkedIn' },
        tiktok: { title: 'TikTok Profile', description: 'Follow on TikTok' },
        youtube: { title: 'YouTube Channel', description: 'Subscribe on YouTube' },
        zillow: { title: 'Zillow Profile', description: 'View listings on Zillow' },
        realtor: { title: 'Realtor.com Profile', description: 'View profile on Realtor.com' },
        calendar: { title: 'Schedule Meeting', description: 'Book a time with me' },
      };

      if (platform && platformDefaults[platform]) {
        title = platformDefaults[platform].title;
        description = platformDefaults[platform].description;
      }

      const preview: LinkPreview = {
        url: formattedUrl,
        title,
        description,
        icon,
        isValid: true,
      };

      setPreview(preview);
      setValidating(false);
      return preview;
    } catch (error) {
      setValidating(false);
      const errorPreview: LinkPreview = {
        url,
        isValid: false,
        error: "Failed to generate preview",
      };
      setPreview(errorPreview);
      return errorPreview;
    }
  }, [validateUrl, detectPlatform]);

  /**
   * Clears the current preview
   */
  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  /**
   * Suggests a title based on the URL
   */
  const suggestTitle = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const platform = detectPlatform(urlObj.href);

      if (platform) {
        const platformTitles: Record<string, string> = {
          instagram: 'Instagram',
          facebook: 'Facebook',
          linkedin: 'LinkedIn',
          tiktok: 'TikTok',
          youtube: 'YouTube',
          zillow: 'Zillow Profile',
          realtor: 'Realtor.com Profile',
          calendar: 'Schedule a Meeting',
        };
        return platformTitles[platform] || 'Visit Link';
      }

      // Use hostname as fallback
      return urlObj.hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Visit Link';
    }
  }, [detectPlatform]);

  return {
    validateUrl,
    generatePreview,
    clearPreview,
    suggestTitle,
    detectPlatform,
    validating,
    preview,
  };
}
