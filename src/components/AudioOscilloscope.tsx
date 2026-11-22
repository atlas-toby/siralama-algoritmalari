import { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface AudioOscilloscopeProps {
  enabled: boolean;
  isDark: boolean;
}

export function AudioOscilloscope({ enabled, isDark }: AudioOscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [freqHz, setFreqHz] = useState<number>(0);

  useEffect(() => {
    let rafId = 0;
    let lastFreqUpdate = 0;
    const buffer = new Uint8Array(256);

    const draw = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const analyser = soundEngine.getAnalyser();
        const width = canvas.width;
        const height = canvas.height;

        if (ctx) {
          ctx.fillStyle = isDark ? '#0b0e12' : '#101318';
          ctx.fillRect(0, 0, width, height);

          // Subtle center grid line
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.stroke();

          if (enabled && analyser) {
            analyser.getByteTimeDomainData(buffer);
            const len = analyser.fftSize;
            ctx.strokeStyle = '#00E600';
            ctx.lineWidth = 1.75;
            ctx.beginPath();

            const sliceW = width / len;
            let x = 0;
            for (let i = 0; i < len; i++) {
              const v = buffer[i] / 128.0;
              const y = (v * height) / 2;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              x += sliceW;
            }
            ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(255,255,255,0.22)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        }
      }

      if (now - lastFreqUpdate > 80) {
        lastFreqUpdate = now;
        const info = soundEngine.getLastFrequency();
        setFreqHz(enabled && info.active ? info.hz : 0);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [enabled, isDark]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[#0b0e12]">
      <canvas
        ref={canvasRef}
        width={320}
        height={64}
        aria-label="Canlı Web Audio ses dalga formu osiloskobu"
        className="block h-16 w-full"
      />
      <div className="pointer-events-none absolute top-1.5 right-2.5 font-mono-tabular text-[11px] text-white/80">
        {enabled ? (freqHz > 0 ? `${freqHz} Hz` : 'Beklemede') : 'Sessiz'}
      </div>
    </div>
  );
}
