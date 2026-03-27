import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://cgrosjzmbgxmtvwxictr.supabase.co";

/**
 * Builds the correct public URL for a storage file.
 * Handles both full URLs and relative paths.
 * 
 * @param path - The file path or full URL
 * @param bucket - The storage bucket name (default: "provider-applications")
 */
export const getPublicFileUrl = (path: string | null | undefined, bucket: string = "provider-applications"): string | null => {
  if (!path) return null;
  
  // Already a full URL
  if (path.startsWith("http")) return path;
  
  // Build public URL from relative path
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
};

/**
 * Opens a document in a new tab, handling both full URLs and relative storage paths.
 * Uses public URL for public buckets, signed URL as fallback.
 */
export const openDocument = async (
  url: string | null | undefined,
  bucket: string = "provider-applications"
): Promise<boolean> => {
  if (!url) return false;

  // Already a full URL
  if (url.startsWith("http")) {
    window.open(url, "_blank");
    return true;
  }

  // For public buckets, use the public URL directly
  const publicUrl = getPublicFileUrl(url, bucket);
  if (publicUrl) {
    window.open(publicUrl, "_blank");
    return true;
  }

  // Fallback: try signed URL
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(url, 3600);
    if (error) throw error;
    window.open(data.signedUrl, "_blank");
    return true;
  } catch (error) {
    console.error("Error opening document:", error);
    return false;
  }
};
