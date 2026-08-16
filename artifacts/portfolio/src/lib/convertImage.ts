/**
 * Client-side image conversion utility.
 *
 * • TIF / TIFF → JPEG  (browsers cannot render TIFF natively)
 * • All other types    → returned unchanged
 *
 * Uses the `utif` library to decode raw TIFF bytes, renders them onto an
 * off-screen <canvas>, then exports as JPEG via `canvas.toBlob`.
 */

// utif has no @types package; we declare it inline.
declare module 'utif' {
  export function decode(buf: ArrayBuffer): IFD[];
  export function decodeImage(buf: ArrayBuffer, ifd: IFD): void;
  export function toRGBA8(ifd: IFD): Uint8Array;
  interface IFD {
    width: number;
    height: number;
    [key: string]: unknown;
  }
}

import * as UTIF from 'utif';

const TIFF_TYPES = new Set(['image/tiff', 'image/tif']);
const TIFF_EXTS  = /\.tiff?$/i;

function isTiff(file: File): boolean {
  return TIFF_TYPES.has(file.type) || TIFF_EXTS.test(file.name);
}

/**
 * Decode a TIFF file with utif, render the first page onto an off-screen
 * canvas, and return a JPEG Blob.
 */
async function tiffToJpegBlob(file: File, quality = 0.92): Promise<Blob> {
  const buf  = await file.arrayBuffer();
  const ifds = UTIF.decode(buf);

  if (!ifds.length) throw new Error('Could not decode TIFF: no image pages found.');

  const ifd = ifds[0];
  UTIF.decodeImage(buf, ifd);
  const rgba = UTIF.toRGBA8(ifd);

  const canvas = document.createElement('canvas');
  canvas.width  = ifd.width;
  canvas.height = ifd.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context.');

  const imgData = ctx.createImageData(ifd.width, ifd.height);
  imgData.data.set(rgba);
  ctx.putImageData(imgData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob returned null.')),
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Convert a File to a browser-safe format if necessary.
 *
 * - TIF/TIFF  → JPEG File  (decoded via utif + canvas)
 * - Everything else → returned as-is
 *
 * The returned File always has a `.jpg` extension when converted.
 */
export async function convertImageFile(file: File): Promise<File> {
  if (!isTiff(file)) return file;

  const blob     = await tiffToJpegBlob(file);
  const safeName = file.name.replace(TIFF_EXTS, '.jpg');
  return new File([blob], safeName, { type: 'image/jpeg', lastModified: Date.now() });
}
