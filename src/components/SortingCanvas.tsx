import React, { useEffect, useRef, useState } from 'react';
import { SimulationStatus, SortMetrics, VisualMode } from '../types/algorithm';

interface SortingCanvasProps {
  array: number[];
  activeIndices: number[];
  secondaryIndices: number[];
  verifiedUpTo: number;
  algorithmName: string;
  metrics: SortMetrics;
  delayMs: number;
  status: SimulationStatus;
  visualMode: VisualMode;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const STATUS_LABELS: Record<SimulationStatus, string> = {
  idle: 'Hazır',
  running: 'Sıralanıyor',
  paused: 'Duraklatıldı',
  verifying: 'Doğrulanıyor',
  completed: 'Doğrulandı',
};

export function SortingCanvas({
  array,
  activeIndices,
  secondaryIndices,
  verifiedUpTo,
  algorithmName,
  metrics,
  delayMs,
  status,
  visualMode,
  canvasRef,
}: SortingCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ index: number; value: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = dimensions;
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Pure pitch-black Sound of Sorting canvas background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const n = array.length;
    const hudHeight = 38;
    const drawHeight = Math.max(80, height - hudHeight);

    if (n > 0) {
      let minVal = array[0];
      let maxVal = array[0];
      for (let i = 1; i < n; i++) {
        if (array[i] < minVal) minVal = array[i];
        if (array[i] > maxVal) maxVal = array[i];
      }
      const span = maxVal - minVal;

      const activeSet = new Set<number>(activeIndices);
      const secondarySet = new Set<number>(secondaryIndices);

      if (visualMode === 'classic' || visualMode === 'spectrum') {
        const barW = width / n;
        const gap = n <= 48 ? 1.5 : n <= 128 ? 0.6 : 0;

        for (let i = 0; i < n; i++) {
          const norm = span === 0 ? 0.55 : 0.025 + ((array[i] - minVal) / span) * 0.965;
          const barH = Math.max(2, norm * drawHeight);
          const x = i * barW;
          const y = height - barH;
          const drawW = gap > 0 ? Math.max(1, barW - gap) : Math.ceil(barW);

          if (status === 'verifying') {
            if (i === verifiedUpTo) {
              // Exact vivid red scanline pointer from the screenshot
              ctx.fillStyle = '#FF1A1A';
            } else if (i < verifiedUpTo) {
              // Exact vivid Sound of Sorting verification green (#00E600)
              ctx.fillStyle = '#00E600';
            } else {
              ctx.fillStyle = visualMode === 'spectrum'
                ? `hsl(${Math.round(norm * 290)}, 85%, 60%)`
                : '#FFFFFF';
            }
          } else if (status === 'completed') {
            ctx.fillStyle = visualMode === 'spectrum'
              ? `hsl(${Math.round(norm * 290)}, 85%, 56%)`
              : '#00E600';
          } else if (activeSet.has(i)) {
            ctx.fillStyle = '#FF1E1E';
          } else if (secondarySet.has(i)) {
            ctx.fillStyle = '#F59E0B';
          } else {
            ctx.fillStyle =
              visualMode === 'spectrum'
                ? `hsl(${Math.round(norm * 290)}, 85%, 60%)`
                : '#FFFFFF';
          }

          ctx.fillRect(x, y, drawW, barH);
        }
      } else if (visualMode === 'dots') {
        const stepX = width / n;
        const radius = n > 256 ? 2 : n > 100 ? 3 : 4.5;

        for (let i = 0; i < n; i++) {
          const norm = span === 0 ? 0.5 : (array[i] - minVal) / span;
          const cx = i * stepX + stepX / 2;
          const cy = height - 10 - norm * (drawHeight - 20);

          if (status === 'verifying') {
            ctx.fillStyle = i === verifiedUpTo ? '#FF1A1A' : i < verifiedUpTo ? '#00E600' : '#FFFFFF';
          } else if (status === 'completed') {
            ctx.fillStyle = '#00E600';
          } else if (activeSet.has(i)) {
            ctx.fillStyle = '#FF1E1E';
          } else if (secondarySet.has(i)) {
            ctx.fillStyle = '#F59E0B';
          } else {
            ctx.fillStyle = '#FFFFFF';
          }

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (visualMode === 'circle') {
        const cx = width / 2;
        const cy = hudHeight + drawHeight / 2;
        const maxR = Math.min(width, drawHeight) * 0.43;

        for (let i = 0; i < n; i++) {
          const norm = span === 0 ? 0.5 : (array[i] - minVal) / span;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const expectedPos = norm;
          const actualPos = i / Math.max(1, n - 1);
          const disparity = Math.abs(expectedPos - actualPos);
          const r = maxR * (1 - disparity * 0.75);
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);

          if (status === 'verifying') {
            ctx.strokeStyle = i === verifiedUpTo ? '#FF1A1A' : i < verifiedUpTo ? '#00E600' : '#FFFFFF';
          } else if (status === 'completed') {
            ctx.strokeStyle = '#00E600';
          } else if (activeSet.has(i)) {
            ctx.strokeStyle = '#FF1E1E';
          } else if (secondarySet.has(i)) {
            ctx.strokeStyle = '#F59E0B';
          } else {
            ctx.strokeStyle = `hsl(${Math.round(norm * 290)}, 85%, 60%)`;
          }
          ctx.lineWidth = n > 200 ? 1.4 : 2.2;
          ctx.stroke();
        }
      }
    }

    // Authentic Sound of Sorting monospace top HUD overlay inside canvas
    ctx.font = '500 13px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFFFFF';

    const leftText = `${algorithmName} - ${metrics.comparisons.toLocaleString('tr-TR')} karşılaştırma, ${metrics.arrayAccesses.toLocaleString('tr-TR')} dizi erişimi, ${delayMs.toFixed(1)} ms gecikme`;
    ctx.fillText(leftText, 12, 10);

    const rightText = `N=${n} · ${STATUS_LABELS[status]}`;
    const rightWidth = ctx.measureText(rightText).width;
    if (width - rightWidth - 24 > ctx.measureText(leftText).width + 16) {
      ctx.fillStyle = status === 'completed' ? '#00E600' : '#E2E8F0';
      ctx.fillText(rightText, width - rightWidth - 12, 10);
    }

    // Optional hover highlight guide
    if (hoverInfo && (visualMode === 'classic' || visualMode === 'spectrum') && n > 0) {
      const barW = width / n;
      const hx = hoverInfo.index * barW + barW / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, hudHeight);
      ctx.lineTo(hx, height);
      ctx.stroke();
    }

    ctx.restore();
  }, [
    array,
    activeIndices,
    secondaryIndices,
    verifiedUpTo,
    algorithmName,
    metrics,
    delayMs,
    status,
    visualMode,
    dimensions,
    hoverInfo,
    canvasRef,
  ]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (array.length === 0 || (visualMode !== 'classic' && visualMode !== 'spectrum')) {
      setHoverInfo(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(array.length - 1, Math.floor((x / rect.width) * array.length)));
    setHoverInfo({ index: idx, value: array[idx] });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/9] max-h-[540px] min-h-[300px] overflow-hidden rounded-2xl bg-black border border-[var(--md-sys-color-outline-variant)]"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        aria-label={`${algorithmName} sıralama görselleştirme tuvali`}
        className="block h-full w-full cursor-crosshair"
      />
      {hoverInfo && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 font-mono-tabular text-xs text-white border border-white/15">
          İndeks #{hoverInfo.index} · Değer: {hoverInfo.value}
        </div>
      )}
    </div>
  );
}
