import { createClient } from '@supabase/supabase-js';
import type { Artwork } from '@/data/artworks';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when both env vars are present and look like real values.
 * Accepts both the legacy JWT anon key (eyJ…) and the new
 * publishable key format (sb_publishable_…).
 */
export const supabaseConfigured =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('https://') &&
  typeof supabaseAnonKey === 'string' &&
  (supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_publishable_'));

/**
 * Supabase client — lazily created on first use so that the module can be
 * safely imported even when the env vars are absent (e.g. in a static-only
 * deployment). Never call this when `supabaseConfigured` is false.
 */
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnonKey || !supabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      );
    }
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

/**
 * Named export kept for `adminAuth.tsx` and other consumers.
 * Guards itself — callers must check `supabaseConfigured` before using.
 */
export const supabase = {
  get auth() { return getSupabaseClient().auth; },
  get storage() { return getSupabaseClient().storage; },
  from: (table: string) => getSupabaseClient().from(table),
} as ReturnType<typeof createClient>;

// ── Database row type (snake_case matches Supabase columns) ──────────────────
// All metadata fields are nullable — only image_url is required.

export interface ArtworkDB {
  id: string;
  title_en: string | null;
  title_ka: string | null;
  year: number | null;
  medium_en: string | null;
  medium_ka: string | null;
  dimensions: string | null;
  category: 'original-paintings' | 'limited-edition-prints' | 'graphic-works' | null;
  status: 'available' | 'private-collection' | null;
  price: number | null;
  image_url: string;
  sort_order: number | null;
  created_at: string;
}

export type ArtworkInsert = Omit<ArtworkDB, 'id' | 'created_at'>;

// ── Mapper: DB row → frontend Artwork ───────────────────────────────────────

export function dbToArtwork(db: ArtworkDB): Artwork {
  return {
    id: db.id,
    imageUrl: db.image_url,
    titleEn: db.title_en ?? undefined,
    titleKa: db.title_ka ?? undefined,
    year: db.year ?? undefined,
    medium: db.medium_en ?? undefined,
    mediumKa: db.medium_ka ?? undefined,
    dimensions: db.dimensions ?? undefined,
    category: db.category ?? undefined,
    status: db.status ?? undefined,
    price: db.price,
    sortOrder: db.sort_order ?? undefined,
  };
}

// ── Error helper ─────────────────────────────────────────────────────────────

/**
 * Supabase returns a plain PostgrestError object, not a JS Error instance.
 * Wrapping it gives callers a real Error with a human-readable message that
 * includes the Supabase error code, detail, and hint where available.
 */
function pgError(error: { message: string; details?: string | null; hint?: string | null; code?: string | null }): Error {
  const parts = [error.message];
  if (error.details) parts.push(`Details: ${error.details}`);
  if (error.hint)    parts.push(`Hint: ${error.hint}`);
  if (error.code)    parts.push(`Code: ${error.code}`);
  return new Error(parts.join(' — '));
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function fetchArtworksDB(): Promise<ArtworkDB[]> {
  const { data, error } = await getSupabaseClient()
    .from('artworks')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw pgError(error);
  return (data ?? []) as ArtworkDB[];
}

export async function createArtwork(payload: ArtworkInsert): Promise<ArtworkDB> {
  const { data, error } = await getSupabaseClient()
    .from('artworks')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(payload as any)
    .select()
    .single();
  if (error) throw pgError(error);
  return data as ArtworkDB;
}

export async function updateArtwork(
  id: string,
  payload: Partial<ArtworkInsert>,
): Promise<ArtworkDB> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qb = getSupabaseClient().from('artworks') as any;
  const { data, error } = await qb.update(payload).eq('id', id).select().single();
  if (error) throw pgError(error);
  return data as ArtworkDB;
}

export async function deleteArtwork(id: string): Promise<void> {
  const { error } = await getSupabaseClient().from('artworks').delete().eq('id', id);
  if (error) throw pgError(error);
}

// ── Storage ──────────────────────────────────────────────────────────────────

/**
 * Resize + compress a File to JPEG before uploading.
 * Caps the longest edge at `maxDim` pixels and uses the given quality (0–1).
 * Always returns a JPEG File regardless of the input format.
 */
async function compressImageForUpload(
  file: File,
  maxDim = 2048,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const dw = Math.max(1, Math.round(w * scale));
      const dh = Math.max(1, Math.round(h * scale));

      const canvas = document.createElement('canvas');
      canvas.width  = dw;
      canvas.height = dh;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D context unavailable.')); return; }

      ctx.drawImage(img, 0, 0, dw, dh);
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Image compression produced an empty blob.')); return; }
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          }));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image for compression.'));
    };

    img.src = objectUrl;
  });
}

export async function uploadArtworkImage(file: File): Promise<string> {
  // ── 1. Compress / resize before sending ──────────────────────────────────
  let uploadFile: File;
  try {
    uploadFile = await compressImageForUpload(file, 2048, 0.85);
  } catch (compressErr) {
    console.error('[uploadArtworkImage] compression failed:', compressErr);
    // Fall back to original file — upload may still succeed for small files
    uploadFile = file;
  }

  console.info(
    `[uploadArtworkImage] uploading "${uploadFile.name}" — ` +
    `${(uploadFile.size / 1024).toFixed(0)} KB`,
  );

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const client = getSupabaseClient();

  const { data, error } = await client.storage
    .from('artwork-images')
    .upload(fileName, uploadFile, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    // Log the full raw error so it appears in the browser DevTools console
    console.error('[uploadArtworkImage] Supabase Storage error:', error);

    // Give a targeted message for the most common failure modes
    const msg = error.message ?? '';
    if (msg === 'Failed to fetch' || msg.includes('fetch')) {
      throw new Error(
        'Upload network error — the request never reached Supabase Storage. ' +
        'Check that: (1) the "artwork-images" bucket exists in your Supabase project, ' +
        '(2) it is set to Public, and (3) your VITE_SUPABASE_URL is correct. ' +
        `Raw: ${msg}`,
      );
    }
    if (msg.toLowerCase().includes('unauthorized') || msg.includes('403')) {
      throw new Error(
        'Upload unauthorised — the storage bucket may not allow unauthenticated uploads. ' +
        'Add a Supabase Storage policy allowing INSERT for authenticated users. ' +
        `Raw: ${msg}`,
      );
    }
    if (msg.toLowerCase().includes('too large') || msg.includes('413')) {
      throw new Error(
        `File too large for Supabase Storage (${(uploadFile.size / 1024 / 1024).toFixed(1)} MB). ` +
        'Supabase free-tier allows up to 50 MB per file, but per-project limits may be lower. ' +
        `Raw: ${msg}`,
      );
    }
    throw new Error(`Image upload failed: ${msg}`);
  }

  const {
    data: { publicUrl },
  } = client.storage.from('artwork-images').getPublicUrl(data.path);

  if (!publicUrl?.startsWith('http')) {
    throw new Error(
      'Upload succeeded but no public URL was returned. ' +
      'Ensure the "artwork-images" bucket is set to Public in your Supabase Storage settings.',
    );
  }

  console.info('[uploadArtworkImage] done →', publicUrl);
  return publicUrl;
}

export async function deleteArtworkImage(imageUrl: string): Promise<void> {
  // Extract path from public URL: …/storage/v1/object/public/artwork-images/<path>
  const marker = '/artwork-images/';
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return; // not a Supabase storage URL, skip
  const path = imageUrl.slice(idx + marker.length);
  await getSupabaseClient().storage.from('artwork-images').remove([path]);
}

// ── Archive types ─────────────────────────────────────────────────────────────

export interface ArchiveCategoryDB {
  id: string;
  slug: string;
  name_en: string;
  name_ka: string;
  sort_order: number;
  created_at: string;
}

export interface ArchiveItemDB {
  id: string;
  category_id: string | null;
  title_en: string | null;
  title_ka: string | null;
  description_en: string | null;
  description_ka: string | null;
  media_type: 'image' | 'video';
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
}

export type ArchiveCategoryInsert = Omit<ArchiveCategoryDB, 'id' | 'created_at'>;
export type ArchiveItemInsert     = Omit<ArchiveItemDB,     'id' | 'created_at'>;

// ── Archive category CRUD ─────────────────────────────────────────────────────

export async function fetchArchiveCategories(): Promise<ArchiveCategoryDB[]> {
  const { data, error } = await getSupabaseClient()
    .from('archive_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw pgError(error);
  return (data ?? []) as ArchiveCategoryDB[];
}

export async function createArchiveCategory(
  payload: Pick<ArchiveCategoryInsert, 'name_en' | 'name_ka' | 'sort_order'>,
): Promise<ArchiveCategoryDB> {
  const slug =
    payload.name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;
  const { data, error } = await getSupabaseClient()
    .from('archive_categories')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ ...payload, slug } as any)
    .select()
    .single();
  if (error) throw pgError(error);
  return data as ArchiveCategoryDB;
}

export async function updateArchiveCategory(
  id: string,
  payload: Partial<ArchiveCategoryInsert>,
): Promise<ArchiveCategoryDB> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getSupabaseClient().from('archive_categories') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw pgError(error);
  return data as ArchiveCategoryDB;
}

export async function deleteArchiveCategory(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('archive_categories')
    .delete()
    .eq('id', id);
  if (error) throw pgError(error);
}

// ── Archive item CRUD ─────────────────────────────────────────────────────────

export async function fetchArchiveItems(categoryId?: string | null): Promise<ArchiveItemDB[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = getSupabaseClient()
    .from('archive_items')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error) throw pgError(error);
  return (data ?? []) as ArchiveItemDB[];
}

export async function createArchiveItem(payload: ArchiveItemInsert): Promise<ArchiveItemDB> {
  const { data, error } = await getSupabaseClient()
    .from('archive_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(payload as any)
    .select()
    .single();
  if (error) throw pgError(error);
  return data as ArchiveItemDB;
}

export async function updateArchiveItem(
  id: string,
  payload: Partial<ArchiveItemInsert>,
): Promise<ArchiveItemDB> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getSupabaseClient().from('archive_items') as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw pgError(error);
  return data as ArchiveItemDB;
}

export async function deleteArchiveItem(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('archive_items')
    .delete()
    .eq('id', id);
  if (error) throw pgError(error);
}

// ── Archive media upload / delete ─────────────────────────────────────────────

export async function uploadArchiveMedia(file: File): Promise<string> {
  const isVideo = file.type.startsWith('video/');
  const bucket  = 'archive-media';

  let uploadFile = file;
  if (!isVideo) {
    // Compress images before upload (reuse the same helper as artwork upload)
    try {
      uploadFile = await compressImageForUpload(file, 2048, 0.85);
    } catch {
      uploadFile = file; // fall back to original
    }
  }

  const rawExt  = file.name.split('.').pop() ?? '';
  const ext     = isVideo ? (rawExt.toLowerCase() || 'mp4') : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  console.info(
    `[uploadArchiveMedia] uploading "${fileName}" — ${(uploadFile.size / 1024).toFixed(0)} KB`,
  );

  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(bucket)
    .upload(fileName, uploadFile, {
      contentType: uploadFile.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[uploadArchiveMedia] Supabase Storage error:', error);
    const msg = error.message ?? '';
    if (msg === 'Failed to fetch' || msg.includes('fetch')) {
      throw new Error(
        'Upload network error — check that the "archive-media" bucket exists in your ' +
        'Supabase project, is set to Public, and run supabase-archive-setup.sql first.',
      );
    }
    throw new Error(`Archive media upload failed: ${msg}`);
  }

  const { data: { publicUrl } } = client.storage.from(bucket).getPublicUrl(data.path);
  if (!publicUrl?.startsWith('http')) {
    throw new Error('Could not get public URL. Ensure the "archive-media" bucket is set to Public.');
  }

  console.info('[uploadArchiveMedia] done →', publicUrl);
  return publicUrl;
}

export async function deleteArchiveMedia(url: string): Promise<void> {
  const marker = '/archive-media/';
  const idx    = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await getSupabaseClient().storage.from('archive-media').remove([path]);
}
