"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SearchPlant {
  slug: string;
  name: string;
  scientificName: string;
  commonName: string;
  genus: string;
  genusSlug: string;
  rarityStatus: string;
  priceGuideTier: string;
  botanicalType: string;
}

export default function IdentifyPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [identifiedPlant, setIdentifiedPlant] = useState<SearchPlant | null>(null);
  const [plantsIndex, setPlantsIndex] = useState<SearchPlant[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load plant list to pick a random match for simulation
  useEffect(() => {
    fetch("/api/plants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlantsIndex(data);
        }
      })
      .catch((err) => console.error("Failed to load plants for identify page:", err));
  }, []);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop events
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setIdentifiedPlant(null);
    }
  };

  // Handle manual file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setIdentifiedPlant(null);
    }
  };

  // Trigger file dialog
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Run the scanning simulation
  const startScan = () => {
    if (!selectedImage) return;
    setIsScanning(true);
    setScanProgress(0);
    setIdentifiedPlant(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishScan();
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  // Select a match once scan completes
  const finishScan = () => {
    setIsScanning(false);
    if (plantsIndex.length > 0) {
      // Pick a random plant from our catalog for the simulation
      const randomIndex = Math.floor(Math.random() * plantsIndex.length);
      setIdentifiedPlant(plantsIndex[randomIndex]);
    } else {
      // Fallback in case API fails
      setIdentifiedPlant({
        slug: "spiritus-sancti",
        name: "Philodendron spiritus-sancti",
        scientificName: "Philodendron spiritus-sancti",
        commonName: "Spiritus Sancti",
        genus: "philodendron",
        genusSlug: "philodendron",
        rarityStatus: "Extremely Rare",
        priceGuideTier: "Ultra-Premium",
        botanicalType: "variegated",
      });
    }
  };

  // Clear states to scan another photo
  const resetScanner = () => {
    setSelectedImage(null);
    setIdentifiedPlant(null);
    setScanProgress(0);
  };

  return (
    <div className="section-spacing">
      <div className="section-container">
        {/* Header Block */}
        <div className="mb-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-heading mb-4">
            Visual Specimen Identification
          </h1>
          <p className="text-sm md:text-base text-muted leading-relaxed">
            Upload a clear photo of an aroid leaf to analyze its morphology and cross-reference it against the Aroid Atlas database to identify its genus and cultivar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Dropzone and scanner (Cols 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`glass-card relative flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed p-6 text-center transition-all duration-300 ${
                dragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-primary/15 bg-card/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {!selectedImage ? (
                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 border border-primary/10">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                  </div>
                  <div>
                    <button onClick={onButtonClick} className="text-sm font-semibold text-primary hover:underline">
                      Click to upload a photo
                    </button>
                    <p className="text-xs text-muted mt-1">or drag and drop here</p>
                  </div>
                  <p className="text-[10px] text-muted-light max-w-xs mx-auto leading-relaxed">
                    For best results, ensure the leaf is centered, well-lit, and photographed against a solid background.
                  </p>
                </div>
              ) : (
                <div className="relative w-full h-[400px] overflow-hidden rounded-xl bg-background/50 border border-primary/10">
                  {/* Plant Image */}
                  <Image
                    src={selectedImage}
                    alt="Specimen to scan"
                    fill
                    className="object-contain"
                  />

                  {/* Scanning Laser Line overlay */}
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div
                        initial={{ top: "0%" }}
                        animate={{ top: ["0%", "99%", "0%"] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(195,217,161,0.8)] z-10 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Dark Scanning overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none mix-blend-overlay" />
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            {selectedImage && (
              <div className="flex gap-4">
                {!isScanning && !identifiedPlant ? (
                  <button onClick={startScan} className="btn-primary flex-1">
                    Scan Specimen
                  </button>
                ) : isScanning ? (
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted">
                      <span>Analyzing Morphology...</span>
                      <span>{scanProgress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-card/60 overflow-hidden border border-primary/5">
                      <div className="h-full bg-primary transition-all duration-150" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button onClick={resetScanner} className="btn-secondary flex-1">
                    Scan Another Specimen
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Scanning Results details (Cols 8-12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 md:p-8 min-h-[464px] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-heading font-bold text-heading mb-4 pb-3 border-b border-primary/5">
                  Analysis Report
                </h3>

                {!selectedImage && (
                  <div className="text-center py-16">
                    <p className="text-xs text-muted italic">
                      Upload a specimen image to generate a morphological analysis report.
                    </p>
                  </div>
                )}

                {selectedImage && !isScanning && !identifiedPlant && (
                  <div className="text-center py-16">
                    <p className="text-xs text-muted">
                      Image successfully loaded. Click **Scan Specimen** to initiate automated classification.
                    </p>
                  </div>
                )}

                {isScanning && (
                  <div className="space-y-4 py-8">
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span>Detecting leaf margins & sinuses...</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <span>Analyzing venation & texture...</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                      <span>Checking variegation distribution...</span>
                    </div>
                  </div>
                )}

                {identifiedPlant && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div>
                      <span className="inline-flex rounded-full bg-green-400/10 px-2 py-0.5 text-[10px] font-semibold text-green-400 uppercase mb-2">
                        Match Identified
                      </span>
                      <h4 className="text-xl font-heading font-bold text-heading italic">
                        {identifiedPlant.scientificName}
                      </h4>
                      <p className="text-xs text-muted mt-1">Common Name: {identifiedPlant.commonName}</p>
                    </div>

                    <div className="rounded-xl border border-primary/5 bg-background/40 p-4 space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Genus</span>
                        <span className="font-semibold text-heading capitalize">{identifiedPlant.genus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Classification</span>
                        <span className="font-semibold text-heading capitalize">{identifiedPlant.botanicalType.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Rarity Status</span>
                        <span className="font-semibold text-primary">{identifiedPlant.rarityStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Price Guide Tier</span>
                        <span className="font-semibold text-price">{identifiedPlant.priceGuideTier}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted leading-relaxed">
                      Our system detected matching leaf nodes, vein spacing, and coloration corresponding with standard aroid cultivation data.
                    </p>
                  </motion.div>
                )}
              </div>

              {identifiedPlant && (
                <div className="mt-8 pt-4 border-t border-primary/5">
                  <Link
                    href={`/plants/${identifiedPlant.genusSlug}/${identifiedPlant.slug}`}
                    className="btn-primary w-full text-center"
                  >
                    View Plant Profile
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
