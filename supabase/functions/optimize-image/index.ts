import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  ImageMagick,
  initialize,
  MagickFormat,
} from 'https://deno.land/x/imagemagick_deno@0.0.31/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';

/**
 * Optimize Image
 *
 * Downloads an already-uploaded original from Supabase Storage, converts it
 * to WebP, and generates resized thumbnails (200 / 400 / 800 px widths).
 * The original is preserved; each variant is stored alongside it and the
 * public URLs for every variant (plus the original) are returned.
 *
 * Why ImageMagick WASM: Deno edge functions cannot run native `sharp`. The
 * magick-wasm build (imagemagick_deno) runs in the Deno/edge runtime and
 * supports WebP encoding + high-quality resizing.
 *
 * Request body: { bucket: string, path: string }
 *   - bucket: storage bucket holding the original (e.g. "listings")
 *   - path:   object path of the original within the bucket
 */

const THUMBNAIL_WIDTHS = [200, 400, 800] as const;
const WEBP_QUALITY = 82;

let magickInitialized = false;
async function ensureMagick() {
  if (!magickInitialized) {
    await initialize();
    magickInitialized = true;
  }
}

/** Derive a variant object path: photo.jpg -> photo-400.webp */
function variantPath(originalPath: string, width: number): string {
  const dot = originalPath.lastIndexOf('.');
  const stem = dot === -1 ? originalPath : originalPath.slice(0, dot);
  return `${stem}-${width}.webp`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', req, 405);
  }

  try {
    // Service-role client: needs to read the original and write variants.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Authenticate the caller (validates their JWT).
    const user = await requireAuth(req, supabase);

    const { bucket, path } = await req.json();
    if (!bucket || !path) {
      return errorResponse('bucket and path are required', 'REQUEST_VALIDATION_FAILED', req);
    }

    // Authorization: callers may only optimize objects under their own prefix
    // (the upload flow stores objects as `${user.id}/...`).
    if (!String(path).startsWith(`${user.id}/`)) {
      return errorResponse('Forbidden: cannot optimize this object', 'FORBIDDEN', req, 403);
    }

    // Download the original.
    const { data: original, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(path);

    if (downloadError || !original) {
      return errorResponse(
        `Failed to download original: ${downloadError?.message ?? 'not found'}`,
        'NOT_FOUND',
        req,
        404
      );
    }

    const originalBytes = new Uint8Array(await original.arrayBuffer());

    await ensureMagick();

    // Generate and upload each WebP variant.
    const variants: Record<string, string> = {};
    for (const width of THUMBNAIL_WIDTHS) {
      const webpBytes = await new Promise<Uint8Array>((resolve) => {
        ImageMagick.read(originalBytes, (img) => {
          // Resize to the target width, preserving aspect ratio (0 height).
          img.resize(width, 0);
          img.quality = WEBP_QUALITY;
          img.write(MagickFormat.Webp, (data) => resolve(new Uint8Array(data)));
        });
      });

      const outPath = variantPath(path, width);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(outPath, webpBytes, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        return errorResponse(
          `Failed to store variant ${width}: ${uploadError.message}`,
          'STORAGE_ERROR',
          req,
          500
        );
      }

      variants[String(width)] = supabase.storage.from(bucket).getPublicUrl(outPath)
        .data.publicUrl;
    }

    const { data: originalUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

    // Audit (best-effort).
    await supabase
      .rpc('log_audit_event', {
        p_user_id: user.id,
        p_action: 'image_optimize',
        p_status: 'success',
        p_resource_type: 'storage_object',
        p_resource_id: path,
        p_ip_address: getClientIP(req),
        p_user_agent: req.headers.get('user-agent'),
        p_details: JSON.stringify({ bucket, widths: THUMBNAIL_WIDTHS }),
      })
      .then(undefined, () => undefined);

    return successResponse(
      {
        original: originalUrlData.publicUrl,
        variants,
        widths: THUMBNAIL_WIDTHS,
      },
      req
    );
  } catch (error) {
    console.error('Optimize Image Error:', error instanceof Error ? error.message : error);
    return handleUnexpectedError(error, req);
  }
});
