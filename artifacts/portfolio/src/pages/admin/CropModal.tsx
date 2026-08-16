/**
 * CropModal — full-screen cropping overlay for the Admin artwork upload.
 *
 * Props:
 *  • src      — object URL of the image to crop (already browser-safe)
 *  • onConfirm(blob) — called with the cropped JPEG Blob when the user clicks Apply
 *  • onCancel        — called when the user dismisses without cropping
 */
import React, { useRef, useState } from 'react';
import Cropper, { type ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { X, Check, Loader2 } from 'lucide-react';

type AspectOption = { label: string; value: number | undefined };

const ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Free',     value: undefined },
  { label: '1 : 1',   value: 1 },
  { label: '4 : 3',   value: 4 / 3 },
  { label: '3 : 4',   value: 3 / 4 },
  { label: '16 : 9',  value: 16 / 9 },
];

interface Props {
  src: string;
  fileName: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export const CropModal: React.FC<Props> = ({ src, fileName, onConfirm, onCancel }) => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [aspectIndex, setAspectIndex] = useState(0); // default: free
  const [busy, setBusy] = useState(false);

  const applyAspect = (idx: number) => {
    setAspectIndex(idx);
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const val = ASPECT_OPTIONS[idx].value;
    cropper.setAspectRatio(val ?? NaN);
  };

  const handleConfirm = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setBusy(true);

    const canvas = cropper.getCroppedCanvas({
      maxWidth: 2400,
      maxHeight: 2400,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    canvas.toBlob(
      blob => {
        if (!blob) { setBusy(false); return; }
        // Build a .jpg filename from whatever was uploaded
        const baseName = fileName.replace(/\.[^.]+$/, '');
        const file = new File([blob], `${baseName}-cropped.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        onConfirm(file);
        // leave busy=true; parent unmounts modal once upload starts
      },
      'image/jpeg',
      0.82,    // lower quality → smaller file before the compressor in supabase.ts runs
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background/97 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 mb-0.5">Image</p>
          <h2 className="font-serif text-xl text-foreground">Crop & Confirm</h2>
        </div>

        {/* Aspect-ratio pills */}
        <div className="hidden sm:flex items-center gap-1.5">
          {ASPECT_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => applyAspect(i)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-widest border transition-colors duration-150 ${
                i === aspectIndex
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border/50 text-foreground/50 hover:border-primary/60 hover:text-foreground/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-foreground/50 hover:text-foreground transition-colors"
          aria-label="Cancel crop"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Aspect pills — mobile row */}
      <div className="sm:hidden flex items-center gap-1.5 px-4 py-3 border-b border-border overflow-x-auto shrink-0">
        {ASPECT_OPTIONS.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => applyAspect(i)}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-wider border whitespace-nowrap transition-colors ${
              i === aspectIndex
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border/50 text-foreground/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Cropper canvas ── */}
      <div className="flex-1 overflow-hidden bg-foreground/5 min-h-0">
        <Cropper
          ref={cropperRef}
          src={src}
          style={{ height: '100%', width: '100%' }}
          aspectRatio={ASPECT_OPTIONS[aspectIndex].value ?? NaN}
          viewMode={1}
          dragMode="move"
          autoCropArea={0.85}
          restore={false}
          guides={true}
          center={true}
          highlight={false}
          cropBoxMovable={true}
          cropBoxResizable={true}
          toggleDragModeOnDblclick={false}
          background={false}
          responsive={true}
        />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-4 px-5 py-4 border-t border-border shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-5 py-2.5 text-xs uppercase tracking-widest border border-border/60 text-foreground/60 hover:border-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="flex items-center gap-2 px-6 py-2.5 text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} strokeWidth={2} />
          )}
          Apply Crop
        </button>
      </div>
    </div>
  );
};
