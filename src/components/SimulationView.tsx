import React from 'react';
import {
  Camera,
  Database,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ALGORITHM_MAP, ALGORITHMS } from '../algorithms/sortingEngine';
import {
  AlgorithmId,
  AudioScale,
  AudioWaveform,
  DatasetProfile,
  DistributionType,
  SimulationStatus,
  SortMetrics,
  TelemetryPoint,
  VisualMode,
} from '../types/algorithm';
import { DISTRIBUTION_LABELS } from '../utils/datasetUtils';
import { AudioOscilloscope } from './AudioOscilloscope';
import { SortingCanvas } from './SortingCanvas';

interface SimulationViewProps {
  array: number[];
  activeIndices: number[];
  secondaryIndices: number[];
  verifiedUpTo: number;
  algorithmId: AlgorithmId;
  onChangeAlgorithm: (id: AlgorithmId) => void;
  dataset: DatasetProfile;
  arraySize: number;
  onChangeArraySize: (size: number) => void;
  distribution: DistributionType;
  onChangeDistribution: (dist: Exclude<DistributionType, 'custom'>) => void;
  delayMs: number;
  onChangeDelayMs: (ms: number) => void;
  status: SimulationStatus;
  metrics: SortMetrics;
  stepNote: string;
  telemetry: TelemetryPoint[];
  visualMode: VisualMode;
  onChangeVisualMode: (mode: VisualMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  volume: number;
  onChangeVolume: (v: number) => void;
  waveform: AudioWaveform;
  onChangeWaveform: (wf: AudioWaveform) => void;
  audioScale: AudioScale;
  onChangeAudioScale: (scale: AudioScale) => void;
  sustainMs: number;
  onChangeSustainMs: (ms: number) => void;
  onTestSound: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onStartPause: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onShuffle: () => void;
  onOpenDataStudio: () => void;
  onCaptureSnapshot: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const VISUAL_MODES: { id: VisualMode; label: string }[] = [
  { id: 'classic', label: 'Klasik' },
  { id: 'spectrum', label: 'Spektrum' },
  { id: 'dots', label: 'Nokta' },
  { id: 'circle', label: 'Çember' },
];

const WAVEFORMS: { id: AudioWaveform; label: string }[] = [
  { id: 'triangle', label: 'Üçgen' },
  { id: 'sine', label: 'Sinüs' },
  { id: 'square', label: 'Kare' },
  { id: 'sawtooth', label: 'Testere' },
];

const AUDIO_SCALES: { id: AudioScale; label: string }[] = [
  { id: 'bingmann', label: 'Klasik (Bingmann)' },
  { id: 'pentatonic', label: 'Pentatonik' },
  { id: 'chromatic', label: 'Kromatik' },
  { id: 'linear', label: 'Doğrusal' },
];

const QUICK_ALGS: AlgorithmId[] = ['radixLSD', 'quick', 'merge', 'heap', 'tim', 'bubble'];

export function SimulationView({
  array,
  activeIndices,
  secondaryIndices,
  verifiedUpTo,
  algorithmId,
  onChangeAlgorithm,
  dataset,
  arraySize,
  onChangeArraySize,
  distribution,
  onChangeDistribution,
  delayMs,
  onChangeDelayMs,
  status,
  metrics,
  stepNote,
  telemetry,
  visualMode,
  onChangeVisualMode,
  soundEnabled,
  onToggleSound,
  volume,
  onChangeVolume,
  waveform,
  onChangeWaveform,
  audioScale,
  onChangeAudioScale,
  sustainMs,
  onChangeSustainMs,
  onTestSound,
  isDark,
  onToggleTheme,
  onStartPause,
  onStepForward,
  onReset,
  onShuffle,
  onOpenDataStudio,
  onCaptureSnapshot,
  canvasRef,
}: SimulationViewProps) {
  const activeMeta = ALGORITHM_MAP[algorithmId];
  const isRunning = status === 'running' || status === 'verifying';

  return (
    <div className="space-y-6">
      {/* Workspace context strip (clean single-line metadata + theme utility) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl [text-wrap:balance]">
            {activeMeta.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <span>{activeMeta.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Ortalama {activeMeta.avgTime}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Alan {activeMeta.space}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMeta.stable ? 'Kararlı' : 'Kararsız'}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMeta.comparisonBased ? 'Karşılaştırmalı' : 'Karşılaştırmasız'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDataStudio}
            className="m3-focus inline-flex items-center gap-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] px-3.5 py-2 text-xs font-medium text-[var(--md-sys-color-on-surface)] transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 text-[var(--md-sys-color-primary)]" aria-hidden="true" />
            <span>Veri: {dataset.label} (N={array.length})</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="m3-focus inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Main Two-Zone Sandbox Layout (68% Stage / 32% M3 Control Deck) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT ZONE: Interactive Stage, Transport Bar, Live Metrics & Live Chart */}
        <div className="space-y-5 lg:col-span-8">
          <SortingCanvas
            array={array}
            activeIndices={activeIndices}
            secondaryIndices={secondaryIndices}
            verifiedUpTo={verifiedUpTo}
            algorithmName={activeMeta.name}
            metrics={metrics}
            delayMs={delayMs}
            status={status}
            visualMode={visualMode}
            canvasRef={canvasRef}
          />

          {/* M3 Playback & Visual Mode Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onStartPause}
                className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] transition-transform duration-150 hover:opacity-95 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    <span>Duraklat</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span>{status === 'paused' ? 'Devam Et' : status === 'completed' ? 'Tekrar Çalıştır' : 'Başlat'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onStepForward}
                disabled={isRunning}
                className="m3-focus inline-flex items-center gap-1.5 rounded-full bg-[var(--md-sys-color-secondary-container)] px-4 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-secondary-container)] transition-opacity hover:opacity-90 disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                <span>Adım İleri</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="m3-focus inline-flex items-center gap-1.5 rounded-full border border-[var(--md-sys-color-outline-variant)] px-3.5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface)] transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Sıfırla</span>
              </button>

              <button
                type="button"
                onClick={onShuffle}
                className="m3-focus inline-flex items-center gap-1.5 rounded-full border border-[var(--md-sys-color-outline-variant)] px-3.5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface)] transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Shuffle className="h-4 w-4" aria-hidden="true" />
                <span>Karıştır</span>
              </button>

              <button
                type="button"
                onClick={onCaptureSnapshot}
                title="Tuval görüntüsünü PNG olarak indir"
                className="m3-focus inline-flex items-center justify-center rounded-full border border-[var(--md-sys-color-outline-variant)] p-2.5 text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* M3 Segmented Control for Visual Styles */}
            <div
              role="group"
              aria-label="Görselleştirme stili"
              className="inline-flex items-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-0.5"
            >
              {VISUAL_MODES.map((m) => {
                const active = visualMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChangeVisualMode(m.id)}
                    className={`m3-focus rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Numeric Telemetry Strip (Single-Elevation, Clean Dividers) */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:divide-x sm:divide-[var(--md-sys-color-outline-variant)]">
              <div className="sm:pr-4">
                <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Karşılaştırma
                </div>
                <div className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--md-sys-color-on-surface)]">
                  {metrics.comparisons.toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="sm:px-4">
                <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Dizi Erişimi
                </div>
                <div className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--md-sys-color-primary)]">
                  {metrics.arrayAccesses.toLocaleString('tr-TR')}
                </div>
              </div>
              <div className="sm:px-4">
                <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Yazma / Takas
                </div>
                <div className="mt-1 font-mono-tabular text-2xl font-semibold text-[var(--md-sys-color-on-surface)]">
                  {metrics.writes.toLocaleString('tr-TR')}
                  <span className="ml-1.5 text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]">
                    / {metrics.swaps.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
              <div className="sm:pl-4">
                <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Aşama / Düzenlilik
                </div>
                <div className="mt-1 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-tertiary)]">
                  %{metrics.sortedness >= 0 ? metrics.sortedness.toFixed(1) : dataset.stats.sortednessPct.toFixed(1)}
                </div>
                <div className="truncate text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  {metrics.passLabel}
                </div>
              </div>
            </div>

            {/* Live step explanation line */}
            <div className="mt-4 border-t border-[var(--md-sys-color-outline-variant)] pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <span className="truncate">{stepNote}</span>
              <span className="font-mono-tabular shrink-0">
                Adım {metrics.steps.toLocaleString('tr-TR')} · {metrics.elapsedMs.toFixed(0)} ms
              </span>
            </div>
          </div>

          {/* Real-Time Interactive Telemetry Chart */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                  Gerçek Zamanlı İşlem Akışı
                </h2>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Simülasyon ilerlerken dizi erişimi, karşılaştırma ve yazma sayılarının anlık değişimi
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#0b57d0]" />
                  Dizi Erişimi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#d97706]" />
                  Karşılaştırma
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#146c2e]" />
                  Yazma
                </span>
              </div>
            </div>

            <div className="h-[210px] w-full">
              {telemetry.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradAccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0b57d0" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#0b57d0" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#2e3542' : '#e1e7f0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="step"
                      tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#171b22' : '#ffffff',
                        borderColor: isDark ? '#2e3542' : '#d5dce6',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#e3e7ef' : '#181c22',
                      }}
                      formatter={(value, name) => [
                        Number(value ?? 0).toLocaleString('tr-TR'),
                        name === 'arrayAccesses'
                          ? 'Dizi Erişimi'
                          : name === 'comparisons'
                            ? 'Karşılaştırma'
                            : 'Yazma',
                      ]}
                      labelFormatter={(label) => `Adım ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="arrayAccesses"
                      stroke="#0b57d0"
                      strokeWidth={2}
                      fill="url(#gradAccess)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="comparisons"
                      stroke="#d97706"
                      strokeWidth={1.75}
                      fill="url(#gradComp)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="writes"
                      stroke="#146c2e"
                      strokeWidth={1.75}
                      fillOpacity={0}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  Canlı zaman serisi grafiğini izlemek için simülasyonu başlatın veya adım ilerletin.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT ZONE: Material Design 3 Control & Concept Deck */}
        <aside className="space-y-5 lg:col-span-4">
          {/* Algorithm Selection Card */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 space-y-4">
            <div>
              <label
                htmlFor="algorithm-select"
                className="block font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)]"
              >
                Algoritma Seçimi
              </label>
              <select
                id="algorithm-select"
                value={algorithmId}
                onChange={(e) => onChangeAlgorithm(e.target.value as AlgorithmId)}
                className="m3-focus mt-2 w-full rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3.5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                {ALGORITHMS.map((alg) => (
                  <option key={alg.id} value={alg.id}>
                    {alg.name} ({alg.avgTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick algorithm selector buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ALGS.map((id) => {
                const item = ALGORITHM_MAP[id];
                const selected = algorithmId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeAlgorithm(id)}
                    className={`m3-focus rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors truncate cursor-pointer ${
                      selected
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                        : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* Conceptual note */}
            <div className="border-t border-[var(--md-sys-color-outline-variant)] pt-3.5">
              <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Nasıl Çalışır?
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
                {activeMeta.howItWorks}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[var(--md-sys-color-outline-variant)] pt-3 text-xs">
                <div>
                  <span className="block text-[var(--md-sys-color-on-surface-variant)]">En İyi</span>
                  <span className="font-mono-tabular font-medium text-[var(--md-sys-color-on-surface)]">
                    {activeMeta.bestTime}
                  </span>
                </div>
                <div>
                  <span className="block text-[var(--md-sys-color-on-surface-variant)]">En Kötü</span>
                  <span className="font-mono-tabular font-medium text-[var(--md-sys-color-on-surface)]">
                    {activeMeta.worstTime}
                  </span>
                </div>
                <div>
                  <span className="block text-[var(--md-sys-color-on-surface-variant)]">Bellek</span>
                  <span className="font-mono-tabular font-medium text-[var(--md-sys-color-on-surface)]">
                    {activeMeta.space}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Parameters Card */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 space-y-5">
            <h2 className="font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              Simülasyon Parametreleri
            </h2>

            {/* Delay slider */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <label htmlFor="delay-slider" className="font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Adım Gecikmesi
                </label>
                <span className="font-mono-tabular font-semibold text-[var(--md-sys-color-primary)]">
                  {delayMs.toFixed(1)} ms
                </span>
              </div>
              <input
                id="delay-slider"
                type="range"
                min={0.4}
                max={40}
                step={0.2}
                value={delayMs}
                onChange={(e) => onChangeDelayMs(Number(e.target.value))}
                className="m3-slider"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>Çok Hızlı (0.4 ms)</span>
                <span>Eğitim Modu (40 ms)</span>
              </div>
            </div>

            {/* Array size slider */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <label htmlFor="size-slider" className="font-medium text-[var(--md-sys-color-on-surface-variant)]">
                  Veri Boyutu (N)
                </label>
                <span className="font-mono-tabular font-semibold text-[var(--md-sys-color-primary)]">
                  {array.length} eleman
                </span>
              </div>
              <input
                id="size-slider"
                type="range"
                min={16}
                max={512}
                step={8}
                value={arraySize}
                onChange={(e) => onChangeArraySize(Number(e.target.value))}
                className="m3-slider"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                <span>16</span>
                <span>256</span>
                <span>512</span>
              </div>
            </div>

            {/* Distribution preset select */}
            <div>
              <label
                htmlFor="dist-select"
                className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]"
              >
                Veri Dağılımı
              </label>
              <select
                id="dist-select"
                value={distribution === 'custom' ? 'random' : distribution}
                onChange={(e) =>
                  onChangeDistribution(e.target.value as Exclude<DistributionType, 'custom'>)
                }
                className="m3-focus mt-1.5 w-full rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                {(Object.keys(DISTRIBUTION_LABELS) as DistributionType[])
                  .filter((k) => k !== 'custom')
                  .map((key) => (
                    <option key={key} value={key}>
                      {DISTRIBUTION_LABELS[key]}
                    </option>
                  ))}
              </select>
              {distribution === 'custom' && (
                <p className="mt-1.5 text-xs text-[var(--md-sys-color-tertiary)]">
                  Aktif veri kaynağı: {dataset.label} (Özel veri yüklü)
                </p>
              )}
            </div>
          </div>

          {/* Web Audio API Sound of Sorting Synthesizer Controls */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                  Web Audio API Sentezleyici
                </h2>
                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                  Gerçek zamanlı osilatör, alçak geçiren filtre ve kompresör
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleSound}
                className={`m3-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  soundEnabled
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                    : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Açık</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sessiz</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Web Audio AnalyserNode Oscilloscope */}
            <AudioOscilloscope enabled={soundEnabled} isDark={isDark} />

            {/* Volume & Sustain Sliders */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="volume-slider" className="text-[var(--md-sys-color-on-surface-variant)]">
                    Ses Seviyesi
                  </label>
                  <span className="font-mono-tabular font-medium text-[var(--md-sys-color-on-surface)]">
                    %{Math.round(volume * 100)}
                  </span>
                </div>
                <input
                  id="volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => onChangeVolume(Number(e.target.value))}
                  disabled={!soundEnabled}
                  className="m3-slider disabled:opacity-40"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="sustain-slider" className="text-[var(--md-sys-color-on-surface-variant)]">
                    Ton Süresi (Sustain)
                  </label>
                  <span className="font-mono-tabular font-medium text-[var(--md-sys-color-on-surface)]">
                    {sustainMs} ms
                  </span>
                </div>
                <input
                  id="sustain-slider"
                  type="range"
                  min={20}
                  max={150}
                  step={5}
                  value={sustainMs}
                  onChange={(e) => onChangeSustainMs(Number(e.target.value))}
                  disabled={!soundEnabled}
                  className="m3-slider disabled:opacity-40"
                />
              </div>
            </div>

            {/* Waveform Segmented Selector */}
            <div>
              <span className="block text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                Osilatör Dalga Formu
              </span>
              <div className="grid grid-cols-4 gap-1 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-0.5">
                {WAVEFORMS.map((w) => {
                  const active = waveform === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onChangeWaveform(w.id)}
                      className={`m3-focus rounded-full py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency Scale + Test Sound CTA */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor="audio-scale-select"
                  className="block text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1"
                >
                  Frekans Ölçeği
                </label>
                <select
                  id="audio-scale-select"
                  value={audioScale}
                  onChange={(e) => onChangeAudioScale(e.target.value as AudioScale)}
                  disabled={!soundEnabled}
                  className="m3-focus w-full rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-2 text-xs font-medium text-[var(--md-sys-color-on-surface)] disabled:opacity-40 cursor-pointer"
                >
                  {AUDIO_SCALES.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={onTestSound}
                className="m3-focus rounded-full bg-[var(--md-sys-color-secondary-container)] px-3.5 py-2 text-xs font-medium text-[var(--md-sys-color-on-secondary-container)] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sesi Test Et
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
