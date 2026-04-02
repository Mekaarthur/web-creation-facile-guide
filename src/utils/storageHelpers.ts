import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://cgrosjzmbgxmtvwxictr.supabase.co";

// Buckets that are now private and require signed URLs
const PRIVATE_BUCKETS = ['provider-documents', 'provider-applications', 'attestations'];

/**
 * Builds the correct URL for a storage file.
 * Uses signed URLs for private buckets, public URLs for public buckets.
 */
export const getPublicFileUrl = (path: string | null | undefined, bucket: string = "provider-applications"): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  // For public buckets, return direct URL
  if (!PRIVATE_BUCKETS.includes(bucket)) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }

  // For private buckets, return null - caller should use getSignedFileUrl instead
  return null;
};

/**
 * Gets a signed URL for a file in a private bucket.
 * Returns the signed URL or null if an error occurs.
 */
export const getSignedFileUrl = async (
  path: string | null | undefined,
  bucket: string = "provider-applications",
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!path) return null;
  if (path.startsWith("http")) {
    // Extract relative path from full Supabase URL
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = path.indexOf(marker);
    if (idx !== -1) {
      path = path.substring(idx + marker.length);
    } else {
      return path; // External URL, return as-is
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
};

/**
 * Opens a document in a new tab.
 * Uses signed URLs for private buckets.
 */
export const openDocument = async (
  url: string | null | undefined,
  bucket: string = "provider-applications"
): Promise<boolean> => {
  if (!url) return false;

  // For private buckets, always use signed URL
  if (PRIVATE_BUCKETS.includes(bucket)) {
    const signedUrl = await getSignedFileUrl(url, bucket);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
      return true;
    }
    return false;
  }

  // For public buckets or full URLs
  if (url.startsWith("http")) {
    window.open(url, "_blank");
    return true;
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${url}`;
  window.open(publicUrl, "_blank");
  return true;
};
