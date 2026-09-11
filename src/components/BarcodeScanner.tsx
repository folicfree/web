"use client";

import { useEffect, useRef, useState } from "react";
import React from "react";
import Link from "next/link";
import type { Food } from "@/data/foods";
import { seedBySlug } from "@/lib/catalog";
import { badgeMeta, faBadgeText, gbp } from "@/lib/nutrition";
import { useDragScroll } from "@/lib/useDragScroll";

interface ScanResult {
  found: boolean;
  food?: Food;
  off?: { name?: string; brands?: string };
  alt: Food[];
}

import AddToMealButton from "@/components/AddToMealButton";
import ShoppingButton from "@/components/ShoppingButton";

const KNOWN_BARCODES: Record<string, string> = {
  "5010029000104": "wholemeal-bread",
  "5412531006052": "rye-bread",
  "5000168044307": "oat-so-simple-pot",
};

export default function BarcodeScanner({ variant = "card" }: { variant?: "hero" | "card" }) {
  const isHero = variant === "hero";
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hiddenImgRef = useRef<HTMLImageElement>(null);
  const altTrack = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(altTrack);
  const [scanning, setScanning] = useState(false);
  const retryRef = useRef(0);

  const stopStream = () => {
    const v = videoRef.current?.srcObject as MediaStream | null;
    v?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const logScan = (ean: string, found: boolean, food?: Food, off?: { name?: string; brands?: string }) => {
    fetch("/api/log-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ean, found, foodSlug: food?.slug, faStatus: food?.fa, offName: off?.name, offBrands: off?.brands }),
    }).catch(() => {});
  };

  useEffect(() => () => stopStream(), []);

  async function startCamera() {
    if (navigator.mediaDevices?.getUserMedia) {
      // Chrome (desktop + Android): live video feed + continuous decode.
      setScanning(true); setMsg("Starting camera — allow access when asked…");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        startScanning();
        return;
      } catch {
        setScanning(false);
        retryRef.current += 1;
        // One silent retry: Chrome often fails the first getUserMedia call while
        // the permission prompt is still up.
        if (retryRef.current === 1) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
            setScanning(true);
            setMsg("");
            startScanning();
            return;
          } catch { /* fall through to the message below */ }
        }
        setMsg("Camera was blocked. Use your browser's site settings to allow camera access, then tap Scan again.");
        return;
      }
    }
    // Cross-browser fallback (iOS Safari, Firefox, Safari desktop): navigator
    // .mediaDevices isn't available there, so open the native camera via a file
    // input (accept + capture) and decode the still photo with the same detector.
    setScanning(true);
    setMsg("Point the camera at the barcode and take a photo.");
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  }
  function stopCamera() { stopStream(); setScanning(false); }

  async function onCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) { stopCamera(); setMsg("No photo taken — tap Scan again."); return; }
    const url = URL.createObjectURL(f);
    const img = hiddenImgRef.current;
    if (!img) { stopCamera(); setMsg("Couldn't open that photo — try again."); return; }
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("load failed"));
        img.src = url;
      });
      await scanImage(img);
    } catch {
      stopCamera();
      setMsg("Couldn't open that photo — try again.");
    }
  }

  // Decode a single still image (from the native capture fallback) and, unlike
  // the live loop, stop after the first attempt so the user can retry with a
  // new photo without burning CPU on repeated decodes.
  async function scanImage(el: HTMLImageElement) {
    let BarcodeDetector: any;
    try {
      const mod = await import("barcode-detector");
      BarcodeDetector = (mod as any).BarcodeDetector || (mod as any).default?.BarcodeDetector;
    } catch { BarcodeDetector = undefined; }
    if (!BarcodeDetector) { setMsg("Scanning isn't supported here."); stopCamera(); return; }
    // Render at the photo's natural resolution so the decoder gets full detail.
    el.width = el.naturalWidth || 0;
    el.height = el.naturalHeight || 0;
    try {
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_a"] });
      const codes = await detector.detect(el);
      if (codes?.length) {
        const value = codes[0].rawValue;
        if (value) { handleCode(value); return; }
      }
    } catch { /* detection failed */ }
    stopCamera();
    setMsg("Couldn't read a barcode in that photo — get closer, stay steady, and use good light, then tap Scan again.");
  }

  // Kick off the detection loop once the video has real dimensions. Without this
  // the video shows but scanOnce() is never started (previously the scanner was
  // cosmetic — a live feed with an animated line but no actual detection).
  function startScanning() {
    const tick = () => {
      if (!videoRef.current) return;
      if (videoRef.current.videoWidth) scanOnce();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function scanOnce() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { requestAnimationFrame(scanOnce); return; }
    let BarcodeDetector: any;
    try {
      const mod = await import("barcode-detector");
      BarcodeDetector = (mod as any).BarcodeDetector || (mod as any).default?.BarcodeDetector;
    } catch { BarcodeDetector = undefined; }
    if (!BarcodeDetector) { setMsg("Scanning isn't supported here."); stopCamera(); return; }
    try {
      const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128", "upc_a"] });
      const codes = await detector.detect(v);
      if (codes?.length) {
        const value = codes[0].rawValue;
        if (value) { handleCode(value); return; }
      }
    } catch { /* camera permission */ }
    requestAnimationFrame(scanOnce);
  }

  function handleCode(value: string) {
    stopCamera();
    setCode(value);
    doLookup(value);
  }

  async function doLookup(ean: string) {
    const clean = ean.trim();
    if (!/^\d{6,14}$/.test(clean)) { setMsg("That doesn't look like a barcode."); setResult(null); return; }
    setBusy(true); setMsg("");
    const slug = KNOWN_BARCODES[clean];
    const food = slug ? seedBySlug.get(slug) : undefined;
    let off: ScanResult["off"];
    if (!food) {
      try {
        const r = await fetch(`/api/lookup?ean=${clean}`);
        const j = await r.json();
        off = j.off;
      } catch { /* offline */ }
    }
    const alt = catalogCleanAlternatives(food);
    setBusy(false);
    setResult({ found: Boolean(food) || Boolean(off), food, off, alt });
    logScan(clean, Boolean(food) || Boolean(off), food, off);
  }

  function catalogCleanAlternatives(food?: Food): Food[] {
    let list = [...seedBySlug.values()].filter((f) => f.fa === "clean");
    if (food?.category) {
      const same = list.filter((f) => f.category === food.category);
      if (same.length) list = [...same, ...list.filter((f) => f.category !== food.category)];
    }
    return list.slice(0, 10);
  }

  return (
    <>
    <section className={`${isHero ? "mx-auto" : "rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"}`}>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-stone-900">
        {scanning ? (
          <>
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
            <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">Scanning…</span>
            <button onClick={stopCamera} className="absolute right-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-xs text-white">✕</button>
          </>
        ) : (
          <button onClick={startCamera} className="group relative flex h-full w-full items-center justify-center overflow-hidden">
            <span aria-hidden className="absolute inset-0 barcode-pattern" />
            <span className="relative z-10 flex flex-col items-center gap-1 rounded-xl bg-black/70 px-6 py-3 text-white transition group-hover:bg-black/80">
              <span className="text-lg font-semibold tracking-wide">Scan Product</span>
              <span className="text-xs text-white/70">Point your camera at a barcode</span>
            </span>
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-stone-500">{msg}</p>}
    </section>

    {result && result.found && result.food && result.food.fa === "added" && (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl p-3">
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{result.food.name}</p>
              <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeMeta[result.food.fa].cls}`}>{faBadgeText[result.food.fa]}</span>
            </div>
            <button onClick={() => setResult(null)} className="text-stone-500 hover:text-stone-700">✕</button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {result.food.slug && (
              <>
                <div className="flex-1"><AddToMealButton slug={result.food.slug} /></div>
                <div className="flex-1"><ShoppingButton slug={result.food.slug} variant="button" /></div>
              </>
            )}
          </div>
          <p className="mt-2 text-sm text-stone-700">Contains added folic acid — {result.alt.length} clean swaps instead:</p>
          {result.alt.length > 0 && <AltCarousel alt={result.alt} trackRef={altTrack} drag={drag} />}
        </div>
      </div>
    )}

    {result && result.found && result.food && result.food.fa !== "added" && (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl p-3">
        <div className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{result.food.name}</p>
              <span className="mt-1 inline-block rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">Clear of added folic acid</span>
            </div>
            <button onClick={() => setResult(null)} className="text-stone-500 hover:text-stone-700">✕</button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="flex-1"><AddToMealButton slug={result.food.slug} /></div>
            <div className="flex-1"><ShoppingButton slug={result.food.slug} variant="button" /></div>
          </div>
          {result.alt.length > 0 && (
            <>
              <p className="mt-2 text-sm text-stone-700">You're all good — some more clean pick-ups nearby:</p>
              <AltCarousel alt={result.alt} trackRef={altTrack} drag={drag} />
            </>
          )}
        </div>
      </div>
    )}

    {result && !result.found && (
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl p-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Not in our catalogue yet</span>
            <button onClick={() => setResult(null)} className="text-stone-500 hover:text-stone-700">✕</button>
          </div>
          <p className="mt-2 text-sm text-stone-600">Scan logged for verification — you can still save the clean options below.</p>
          {result.alt.length > 0 && (
            <>
              <p className="mt-3 text-sm text-stone-700">{result.alt.length} unfortified alternatives to consider:</p>
              <AltCarousel alt={result.alt} trackRef={altTrack} drag={drag} />
            </>
          )}
        </div>
      </div>
    )}
    <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onCapture}
        className="sr-only"
        aria-label="Take a photo of the barcode"
      />
      <img ref={hiddenImgRef} alt="" aria-hidden className="pointer-events-none fixed left-[-9999px] top-0" />
    </>
  );
}

function AltCarousel({ alt, trackRef, drag }: { alt: Food[]; trackRef: React.RefObject<HTMLDivElement | null>; drag: any }) {
  const [q, setQ] = React.useState("");
  const visible = alt.filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      <input className="mb-2 w-full rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs outline-none placeholder:text-stone-400 focus:border-emerald-600"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search alternatives…"
        aria-label="Search alternatives"
      />
      <div ref={trackRef} {...drag} className="mt-1 grid auto-cols-[7rem] cursor-grab snap-x grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 active:cursor-grabbing md:auto-cols-[8rem] md:grid-rows-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {visible.map((f) => (
        <Link key={f.slug} href={`/food/${f.slug}`} className="card relative snap-start overflow-hidden p-2">
          <ShoppingButton slug={f.slug} />
          <span className="flex h-14 items-center justify-center rounded-lg bg-stone-100 text-lg font-semibold text-emerald-700">✓</span>
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-tight">{f.name}</p>
          <p className="text-[10px] text-stone-500">{f.packG && f.packPrice ? `£${f.packPrice.toFixed(2)} · ${f.packG}g` : gbp((f.portionG * f.cost) / 100)}</p>
          <span className="mt-1.5 block">
            <AddToMealButton slug={f.slug} compact />
          </span>
        </Link>
      ))}
      </div>
    </div>
  );
}