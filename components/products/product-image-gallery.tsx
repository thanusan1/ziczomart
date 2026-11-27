"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

interface ProductImageGalleryProps {
  images: GalleryImage[];
  productName: string;
  discountPct?: number;
  selectedImageUrl?: string | null;
}

export default function ProductImageGallery({
  images,
  productName,
  discountPct = 0,
  selectedImageUrl,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevVariantUrl, setPrevVariantUrl] = useState(selectedImageUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const mobileSliderRef = useRef<HTMLDivElement>(null);
  const thumbListRef = useRef<HTMLDivElement>(null);

  // Sync if a variant selects a specific image URL
  if (selectedImageUrl !== prevVariantUrl) {
    setPrevVariantUrl(selectedImageUrl);
    if (selectedImageUrl) {
      const idx = images.findIndex((img) => img.url === selectedImageUrl);
      if (idx !== -1) {
        setActiveIndex(idx);
      }
    }
  }

  const safeIndex =
    images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0;
  const currentImage = images[safeIndex] ?? null;

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setImageLoaded(false);
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setImageLoaded(false);
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, goPrev, goNext]);

  // Sync mobile slider scroll position when activeIndex changes
  function handleSelectIndex(idx: number) {
    if (idx !== activeIndex) {
      setImageLoaded(false);
      setActiveIndex(idx);
    }
    if (mobileSliderRef.current) {
      const container = mobileSliderRef.current;
      container.scrollTo({
        left: idx * container.clientWidth,
        behavior: "smooth",
      });
    }
  }

  function handleMobileScroll() {
    if (!mobileSliderRef.current) return;
    const { scrollLeft, clientWidth } = mobileSliderRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== activeIndex && idx >= 0 && idx < images.length) {
        setActiveIndex(idx);
      }
    }
  }

  function scrollThumbsDown() {
    if (!thumbListRef.current) return;
    thumbListRef.current.scrollBy({ top: 140, behavior: "smooth" });
  }

  return (
    <>
      <div className="w-full">
        {/* ── Desktop Gallery (vertical thumbnails + main square viewer) ── */}
        <div className="hidden gap-3.5 md:flex">
          {images.length > 1 && (
            <div className="flex w-[74px] flex-shrink-0 flex-col items-center gap-2">
              <div
                ref={thumbListRef}
                className="flex max-h-[420px] flex-col gap-2.5 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((img, idx) => {
                  const isActive = idx === safeIndex;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => handleSelectIndex(idx)}
                      aria-label={`View image ${idx + 1} of ${productName}`}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "relative h-[70px] w-[70px] flex-shrink-0 overflow-hidden rounded-xl border bg-white p-1.5 transition-all",
                        isActive
                          ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                          : "border-[#E2E8F0] hover:border-slate-300",
                      )}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={img.url}
                          alt={img.alt}
                          fill
                          sizes="70px"
                          className="object-contain"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {images.length > 5 && (
                <button
                  type="button"
                  onClick={scrollThumbsDown}
                  aria-label="Scroll thumbnails down"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-slate-500 shadow-xs transition hover:border-[#2563EB] hover:text-[#2563EB]"
                >
                  <ChevronDown size={15} />
                </button>
              )}
            </div>
          )}

          {/* Main Image Container */}
          <div className="group relative flex-1 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
            <div className="relative aspect-square w-full bg-white p-6">
              {currentImage ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-6 animate-pulse rounded-xl bg-slate-100" />
                  )}
                  <Image
                    key={currentImage.id}
                    src={currentImage.url}
                    alt={currentImage.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 50vw, 42vw"
                    onLoad={() => setImageLoaded(true)}
                    onClick={() => setLightboxOpen(true)}
                    className={cn(
                      "cursor-zoom-in object-contain p-4 transition-all duration-300 group-hover:scale-[1.02]",
                      imageLoaded ? "opacity-100" : "opacity-0",
                    )}
                  />
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-[#F8FAFC] text-slate-300">
                  <Package size={72} strokeWidth={1.4} />
                  <span className="mt-2 text-xs font-medium text-slate-400">
                    No image available
                  </span>
                </div>
              )}

              {/* Discount badge */}
              {discountPct > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-lg bg-[#DC2626] px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                  -{discountPct}%
                </span>
              )}

              {/* Prev / Next arrows on hover when multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous product image"
                    className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E2E8F0] bg-white/95 text-[#0F172A] opacity-0 shadow-sm transition hover:bg-[#EFF6FF] hover:text-[#2563EB] group-hover:opacity-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next product image"
                    className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#E2E8F0] bg-white/95 text-[#0F172A] opacity-0 shadow-sm transition hover:bg-[#EFF6FF] hover:text-[#2563EB] group-hover:opacity-100"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Zoom Button */}
              {currentImage && (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Zoom product image"
                  className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                >
                  <ZoomIn size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Horizontal Swipe Gallery ──────────────────────────── */}
        <div className="md:hidden">
          <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            {discountPct > 0 && (
              <span className="absolute left-3 top-3 z-10 rounded-lg bg-[#DC2626] px-2.5 py-1 text-xs font-bold text-white">
                -{discountPct}%
              </span>
            )}

            {currentImage && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Open full-screen image viewer"
                className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white/95 text-[#0F172A] shadow-sm"
              >
                <ZoomIn size={16} />
              </button>
            )}

            {images.length > 0 ? (
              <div
                ref={mobileSliderRef}
                onScroll={handleMobileScroll}
                className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative aspect-square w-full flex-shrink-0 snap-center bg-white p-4"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      priority={idx === 0}
                      sizes="100vw"
                      onClick={() => setLightboxOpen(true)}
                      className="object-contain p-3"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center bg-[#F8FAFC] text-slate-300">
                <Package size={64} strokeWidth={1.4} />
                <span className="mt-2 text-xs font-medium text-slate-400">
                  No image available
                </span>
              </div>
            )}
          </div>

          {/* Mobile dot indicators */}
          {images.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => handleSelectIndex(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === safeIndex
                      ? "w-6 bg-[#2563EB]"
                      : "w-2 bg-slate-300 hover:bg-slate-400",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Full-Screen Lightbox Viewer ───────────────────────────────── */}
      {lightboxOpen && currentImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image viewer`}
          className="fixed inset-0 z-50 flex flex-col bg-[#0F172A]/95 backdrop-blur-xs"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <span className="truncate text-sm font-medium text-slate-200">
              {productName}
              {images.length > 1 && (
                <span className="ml-2 text-xs text-slate-400">
                  ({safeIndex + 1} / {images.length})
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close image viewer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main image */}
          <div className="relative flex flex-1 items-center justify-center p-4 sm:p-10">
            <div className="relative h-full max-h-[75vh] w-full max-w-4xl">
              <Image
                src={currentImage.url}
                alt={currentImage.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-6"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-6"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Bottom thumbnail strip */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto px-4 pb-5">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Select image ${idx + 1}`}
                  className={cn(
                    "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border bg-white p-1 transition",
                    idx === safeIndex
                      ? "border-[#2563EB] ring-2 ring-[#2563EB]"
                      : "border-white/20 opacity-60 hover:opacity-100",
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
