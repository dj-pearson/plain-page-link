import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import {
  ImageMagick,
  initialize,
  MagickFormat,
} from 'https://deno.land/x/imagemagick_deno@0.0.31/mod.ts';
import { validateFileType } from '../_shared/fileValidation.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { parseOptimizeTarget, variantPath } from './target.ts';

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
 *   - bucket: storage bucket holding the original ("listing-photos" only)
 *   - path:   object path of the original within the bucket, under the
 *             caller's own `<user id>/` folder (validated in target.ts)
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

    // Authorization: only listing-photos, and only a plain path whose first
    // segment is the caller's id. A prefix check alone let `<me>/../<them>/`
    // read and overwrite another agent's objects (US-633, target.ts).
    const target = parseOptimizeTarget(await req.json().catch(() => null), user.id);
    if (!target.ok) {
      return errorResponse(target.message, target.code, req, target.status);
    }
    const { bucket, path } = target;

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

    // US-076: the stored object's declared content type is whatever the
    // uploader claimed. Confirm the bytes really are the image they say they
    // are before handing them to a decoder — feeding arbitrary input to an
    // image parser is the classic way to turn an upload into an exploit.
    const declaredType = original.type || 'image/jpeg';
    if (!validateFileType(originalBytes.buffer, declaredType)) {
      return errorResponse(
        `Object at ${path} is not a valid ${declaredType}`,
        'INVALID_IMAGE',
        req,
        422
      );
    }

    await ensureMagick();

    // Generate and upload each WebP variant.
    const variants: Record<string, string> = {};
    for (const width of THUMBNAIL_WIDTHS) {
      const webpBytes = await new Promise<Uint8Array>((resolve) => {
        ImageMagick.read(originalBytes, (img) => {
          // Resize to the target width, preserving aspect ratio (0 height).
          img.resize(width, 0);
          img.quality = WEBP_QUALITY;
          img.write(MagickFormat.WebP, (data) => resolve(new Uint8Array(data)));
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
