import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ALGORITHM_MAP,
  ALGORITHMS,
  createSortGenerator,
  runAllBenchmarksSync,
  runScalingBenchmark,
} from './algorithms/sortingEngine';
import { AnalyticsView } from './components/AnalyticsView';
import { DataStudioView } from './components/DataStudioView';
import { ReportsView } from './components/ReportsView';
import { SimulationView } from './components/SimulationView';
import { TopBar } from './components/TopBar';
import {
  AlgorithmId,
  AppSection,
  AudioScale,
  AudioWaveform,
  BenchmarkEntry,
  DatasetProfile,
  DistributionType,
  ScalingPoint,
  SimulationRun,
  SimulationStatus,
  SortMetrics,
  SortStep,
  TelemetryPoint,
  VisualMode,
} from './types/algorithm';
import {
  computeSortedness,
  createDatasetProfile,
  generateDistribution,
} from './utils/datasetUtils';
import {
  exportCanvasPng,
  exportReportCsv,
  exportReportHtml,
  exportReportJson,
  exportReportMarkdown,
} from './utils/reportExporter';
import { soundEngine } from './utils/soundEngine';

const HISTORY_STORAGE_KEY = 'siralab_run_history_v1';

const INITIAL_METRICS: SortMetrics = {
  comparisons: 0,
  arrayAccesses: 0,
  writes: 0,
  swaps: 0,
  steps: 0,
  elapsedMs: 0,
  sortedness: 0,
  passLabel: 'Hazır',
};

function loadSavedRuns(): SimulationRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('simulation');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Core simulation parameters (defaulting to Radix Sort LSD @ 1.6ms matching the screenshot)
  const [algorithmId, setAlgorithmId] = useState<AlgorithmId>('radixLSD');
  const [arraySize, setArraySize] = useState<number>(256);
  const [distribution, setDistribution] = useState<DistributionType>('random');
  const [delayMs, setDelayMs] = useState<number>(1.6);
  const [visualMode, setVisualMode] = useState<VisualMode>('classic');

  // Audio controls (Web Audio API)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.45);
  const [waveform, setWaveform] = useState<AudioWaveform>('triangle');
  const [audioScale, setAudioScale] = useState<AudioScale>('bingmann');
  const [sustainMs, setSustainMs] = useState<number>(55);

  // Dataset & live canvas state
  const [dataset, setDataset] = useState<DatasetProfile>(() => {
    const vals = generateDistribution('random', 256);
    return createDatasetProfile(vals, 'random');
  });
  const [array, setArray] = useState<number[]>(() => [...dataset.values]);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [secondaryIndices, setSecondaryIndices] = useState<number[]>([]);
  const [lockedIndices, setLockedIndices] = useState<number[]>([]);
  const [verifiedUpTo, setVerifiedUpTo] = useState<number>(-1);
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [metrics, setMetrics] = useState<SortMetrics>(() => ({
    ...INITIAL_METRICS,
    sortedness: dataset.stats.sortednessPct,
  }));
  const [stepNote, setStepNote] = useState<string>(
    'Başlat düğmesine basarak gerçek zamanlı sıralamayı ve ses sentezini başlatın.'
  );
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);

  // Analytics & Report state
  const [benchmarks, setBenchmarks] = useState<BenchmarkEntry[]>(() =>
    runAllBenchmarksSync(dataset.values)
  );
  const [scalingData, setScalingData] = useState<ScalingPoint[]>(() => runScalingBenchmark());
  const [runHistory, setRunHistory] = useState<SimulationRun[]>(() => loadSavedRuns());
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Refs for smooth high-FPS RAF loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const generatorRef = useRef<Generator<SortStep, void, void> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const delayRef = useRef<number>(delayMs);
  const telemetryRef = useRef<TelemetryPoint[]>([]);
  const runStartRef = useRef<number>(0);
  const snackbarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    delayRef.current = delayMs;
  }, [delayMs]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    soundEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    soundEngine.setWaveform(waveform);
  }, [waveform]);

  useEffect(() => {
    soundEngine.setScale(audioScale);
  }, [audioScale]);

  useEffect(() => {
    soundEngine.setSustainMs(sustainMs);
  }, [sustainMs]);

  const showToast = useCallback((msg: string) => {
    setSnackbarMessage(msg);
    if (snackbarTimerRef.current !== null) {
      window.clearTimeout(snackbarTimerRef.current);
    }
    snackbarTimerRef.current = window.setTimeout(() => {
      setSnackbarMessage(null);
    }, 3400);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const persistRun = useCallback(
    (finalStep: SortStep, currentDataset: DatasetProfile, currentAlg: AlgorithmId) => {
      const meta = ALGORITHM_MAP[currentAlg];
      const newRun: SimulationRun = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        algorithmId: currentAlg,
        algorithmName: meta.name,
        datasetLabel: currentDataset.label,
        datasetSource: currentDataset.source,
        arraySize: currentDataset.values.length,
        delayMs: delayRef.current,
        comparisons: finalStep.metrics.comparisons,
        arrayAccesses: finalStep.metrics.arrayAccesses,
        writes: finalStep.metrics.writes,
        swaps: finalStep.metrics.swaps,
        totalSteps: finalStep.metrics.steps,
        durationMs: Math.round((performance.now() - runStartRef.current) * 10) / 10,
        cpuTimeMs: finalStep.metrics.elapsedMs,
        initialDisorderPct: currentDataset.stats.disorderPct,
        telemetry: [...telemetryRef.current],
        initialValuesSample: currentDataset.values.slice(0, 64),
        sortedValuesSample: finalStep.array.slice(0, 64),
      };

      setRunHistory((prev) => {
        const next = [newRun, ...prev].slice(0, 30);
        try {
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });
    },
    []
  );

  const resetSimulationState = useCallback(
    (sourceDataset: DatasetProfile, nextNote?: string) => {
      stopLoop();
      generatorRef.current = null;
      telemetryRef.current = [];
      setArray([...sourceDataset.values]);
      setActiveIndices([]);
      setSecondaryIndices([]);
      setLockedIndices([]);
      setVerifiedUpTo(-1);
      setStatus('idle');
      setTelemetry([]);
      setMetrics({
        ...INITIAL_METRICS,
        sortedness: sourceDataset.stats.sortednessPct,
      });
      setStepNote(
        nextNote ??
          `Veri hazır (${sourceDataset.label}, N=${sourceDataset.values.length}). Başlat veya Adım İleri ile çalıştırın.`
      );
    },
    [stopLoop]
  );

  const playStepAudio = useCallback((step: SortStep, ds: DatasetProfile) => {
    if (step.soundValue === null) return;
    const span = ds.stats.max - ds.stats.min;
    const normalize = (val: number) => (span === 0 ? 0.5 : (val - ds.stats.min) / span);
    const primaryNorm = normalize(step.soundValue);

    let secondaryNorm: number | null = null;
    if (step.activeIndices.length >= 2) {
      const secIdx = step.activeIndices[1];
      if (secIdx >= 0 && secIdx < step.array.length) {
        secondaryNorm = normalize(step.array[secIdx]);
      }
    }

    const kind =
      step.phase === 'verifying'
        ? 'verify'
        : step.note.includes('takas')
          ? 'swap'
          : step.activeIndices.length >= 2
            ? 'compare'
            : 'access';

    soundEngine.playTone(primaryNorm, kind, secondaryNorm);
  }, []);

  const recordTelemetrySample = useCallback((step: SortStep, force = false) => {
    const current = telemetryRef.current;
    const shouldSample =
      force ||
      current.length === 0 ||
      step.metrics.steps % Math.max(1, Math.floor(step.array.length / 8)) === 0;

    if (!shouldSample) return;

    const sortedness =
      step.phase === 'done' || step.phase === 'verifying'
        ? 100
        : step.metrics.sortedness >= 0
          ? step.metrics.sortedness
          : computeSortedness(step.array);

    const point: TelemetryPoint = {
      step: step.metrics.steps,
      elapsedMs: step.metrics.elapsedMs,
      comparisons: step.metrics.comparisons,
      arrayAccesses: step.metrics.arrayAccesses,
      writes: step.metrics.writes,
      swaps: step.metrics.swaps,
      sortedness,
    };

    const next = [...current, point];
    // Cap telemetry array to ~140 evenly spaced points for ultra-responsive charts
    if (next.length > 140) {
      const thinned = next.filter((_, idx) => idx % 2 === 0 || idx === next.length - 1);
      telemetryRef.current = thinned;
    } else {
      telemetryRef.current = next;
    }
    setTelemetry([...telemetryRef.current]);
  }, []);

  const startAnimationLoop = useCallback(
    (activeDataset: DatasetProfile, activeAlg: AlgorithmId) => {
      stopLoop();
      lastFrameRef.current = performance.now();
      accRef.current = 0;

      const tick = (now: number) => {
        const gen = generatorRef.current;
        if (!gen) return;

        const dt = Math.min(now - lastFrameRef.current, 50);
        lastFrameRef.current = now;
        accRef.current += dt;

        // Verification sweep runs at a crisp visual pace (~4ms per bar for 256 bars = ~1s sweep)
        const currentDelay = Math.max(0.25, delayRef.current);
        let stepsToRun = Math.floor(accRef.current / currentDelay);
        if (stepsToRun < 1) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        accRef.current -= stepsToRun * currentDelay;
        // Cap per-frame steps so main thread stays silky 60fps
        stepsToRun = Math.min(stepsToRun, 45);

        let lastStep: SortStep | null = null;
        let finished = false;

        for (let s = 0; s < stepsToRun; s++) {
          const next = gen.next();
          if (next.done) {
            finished = true;
            break;
          }
          lastStep = next.value;
          // Slow down slightly during green verification sweep so the iconic green wave is unmistakable!
          if (lastStep.phase === 'verifying' && s >= 2) {
            break;
          }
          if (lastStep.phase === 'done') {
            finished = true;
            break;
          }
        }

        if (lastStep) {
          setArray([...lastStep.array]);
          setActiveIndices(lastStep.activeIndices);
          setSecondaryIndices(lastStep.secondaryIndices);
          setLockedIndices(lastStep.lockedIndices ?? []);
          setVerifiedUpTo(lastStep.verifiedUpTo);
          setStepNote(lastStep.note);

          const computedSorted =
            lastStep.phase === 'done' || lastStep.phase === 'verifying'
              ? 100
              : computeSortedness(lastStep.array);

          setMetrics({
            ...lastStep.metrics,
            sortedness: computedSorted,
          });

          if (lastStep.phase === 'verifying') {
            setStatus('verifying');
          } else if (lastStep.phase === 'done') {
            setStatus('completed');
          } else {
            setStatus('running');
          }

          playStepAudio(lastStep, activeDataset);
          recordTelemetrySample(lastStep, finished || lastStep.phase === 'done');

          if (finished || lastStep.phase === 'done') {
            stopLoop();
            generatorRef.current = null;
            persistRun(lastStep, activeDataset, activeAlg);
            showToast(`${ALGORITHM_MAP[activeAlg].name} tamamlandı ve rapor geçmişine eklendi.`);
            return;
          }
        }

        if (!finished) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [persistRun, playStepAudio, recordTelemetrySample, showToast, stopLoop]
  );

  // Clean up animation loop on unmount
  useEffect(() => {
    return () => {
      stopLoop();
      if (snackbarTimerRef.current !== null) {
        window.clearTimeout(snackbarTimerRef.current);
      }
    };
  }, [stopLoop]);

  const handleStartPause = () => {
    // Synchronously unlock Web Audio API on user click gesture
    soundEngine.unlock();

    if (status === 'running' || status === 'verifying') {
      stopLoop();
      setStatus('paused');
      setStepNote('Simülasyon duraklatıldı. Devam Et veya Adım İleri ile sürdürebilirsiniz.');
      return;
    }

    if (status === 'completed' || !generatorRef.current) {
      // Fresh start from initial dataset
      telemetryRef.current = [
        {
          step: 0,
          elapsedMs: 0,
          comparisons: 0,
          arrayAccesses: 0,
          writes: 0,
          swaps: 0,
          sortedness: dataset.stats.sortednessPct,
        },
      ];
      setTelemetry([...telemetryRef.current]);
      setArray([...dataset.values]);
      setLockedIndices([]);
      setVerifiedUpTo(-1);
      runStartRef.current = performance.now();
      generatorRef.current = createSortGenerator(algorithmId, dataset.values);
    }

    setStatus('running');
    startAnimationLoop(dataset, algorithmId);
  };

  const handleStepForward = () => {
    soundEngine.unlock();
    if (status === 'running' || status === 'verifying') return;

    if (!generatorRef.current || status === 'completed') {
      telemetryRef.current = [
        {
          step: 0,
          elapsedMs: 0,
          comparisons: 0,
          arrayAccesses: 0,
          writes: 0,
          swaps: 0,
          sortedness: dataset.stats.sortednessPct,
        },
      ];
      runStartRef.current = performance.now();
      generatorRef.current = createSortGenerator(algorithmId, dataset.values);
    }

    const res = generatorRef.current.next();
    if (res.done || !res.value) {
      setStatus('completed');
      generatorRef.current = null;
      return;
    }

    const step = res.value;
    setArray([...step.array]);
    setActiveIndices(step.activeIndices);
    setSecondaryIndices(step.secondaryIndices);
    setLockedIndices(step.lockedIndices ?? []);
    setVerifiedUpTo(step.verifiedUpTo);
    setStepNote(step.note);
    setMetrics({
      ...step.metrics,
      sortedness:
        step.phase === 'done' || step.phase === 'verifying' ? 100 : computeSortedness(step.array),
    });

    playStepAudio(step, dataset);
    recordTelemetrySample(step, true);

    if (step.phase === 'done') {
      setStatus('completed');
      generatorRef.current = null;
      persistRun(step, dataset, algorithmId);
      showToast(`${ALGORITHM_MAP[algorithmId].name} adım adım tamamlandı.`);
    } else {
      setStatus('paused');
    }
  };

  const handleReset = () => {
    resetSimulationState(dataset, 'Dizi başlangıç durumuna sıfırlandı.');
  };

  const handleShuffle = () => {
    const nextDist: Exclude<DistributionType, 'custom'> =
      distribution === 'custom' ? 'random' : distribution;
    const vals =
      distribution === 'custom'
        ? [...dataset.values].sort(() => Math.random() - 0.5)
        : generateDistribution(nextDist, arraySize);
    const nextProfile = createDatasetProfile(
      vals,
      distribution,
      distribution === 'custom' ? `${dataset.label} (Karıştırıldı)` : undefined
    );
    setDataset(nextProfile);
    resetSimulationState(nextProfile, 'Veri seti yeniden karıştırıldı.');
    setBenchmarks(runAllBenchmarksSync(nextProfile.values));
  };

  const handleChangeAlgorithm = (nextAlg: AlgorithmId) => {
    setAlgorithmId(nextAlg);
    resetSimulationState(
      dataset,
      `${ALGORITHM_MAP[nextAlg].name} seçildi. Başlat ile çalıştırabilirsiniz.`
    );
  };

  const handleChangeArraySize = (nextSize: number) => {
    setArraySize(nextSize);
    const distToUse: Exclude<DistributionType, 'custom'> =
      distribution === 'custom' ? 'random' : distribution;
    if (distribution === 'custom') setDistribution('random');
    const vals = generateDistribution(distToUse, nextSize);
    const profile = createDatasetProfile(vals, distToUse);
    setDataset(profile);
    resetSimulationState(profile);
    setBenchmarks(runAllBenchmarksSync(profile.values));
  };

  const handleChangeDistribution = (nextDist: Exclude<DistributionType, 'custom'>) => {
    setDistribution(nextDist);
    const vals = generateDistribution(nextDist, arraySize);
    const profile = createDatasetProfile(vals, nextDist);
    setDataset(profile);
    resetSimulationState(profile);
    setBenchmarks(runAllBenchmarksSync(profile.values));
  };

  const handleApplyCustomDataset = (
    profile: DatasetProfile,
    target: 'simulation' | 'analytics'
  ) => {
    setDistribution('custom');
    setArraySize(Math.min(512, Math.max(4, profile.values.length)));
    setDataset(profile);
    resetSimulationState(
      profile,
      `Özel veri yüklendi: ${profile.label} (${profile.values.length} eleman).`
    );
    const results = runAllBenchmarksSync(profile.values);
    setBenchmarks(results);
    setActiveSection(target);
    showToast(`"${profile.label}" (${profile.values.length} eleman) yüklendi ve ölçüldü.`);
  };

  const handleRunBenchmarks = () => {
    const results = runAllBenchmarksSync(dataset.values);
    setBenchmarks(results);
    showToast(`${ALGORITHMS.length} algoritma "${dataset.label}" üzerinde yeniden ölçüldü.`);
  };

  const handleRunScalingTest = () => {
    const pts = runScalingBenchmark();
    setScalingData(pts);
    showToast('N=32..256 büyüme eğrisi yeniden hesaplandı.');
  };

  const handleSimulateFromAnalytics = (id: AlgorithmId) => {
    soundEngine.unlock();
    setAlgorithmId(id);
    setActiveSection('simulation');
    resetSimulationState(dataset, `${ALGORITHM_MAP[id].name} simülasyona aktarıldı.`);
    // Immediately start running so click feels instantaneously rewarding
    window.setTimeout(() => {
      telemetryRef.current = [
        {
          step: 0,
          elapsedMs: 0,
          comparisons: 0,
          arrayAccesses: 0,
          writes: 0,
          swaps: 0,
          sortedness: dataset.stats.sortednessPct,
        },
      ];
      setTelemetry([...telemetryRef.current]);
      runStartRef.current = performance.now();
      generatorRef.current = createSortGenerator(id, dataset.values);
      setStatus('running');
      startAnimationLoop(dataset, id);
    }, 60);
  };

  const handleCaptureSnapshot = () => {
    const fname = exportCanvasPng(canvasRef.current, ALGORITHM_MAP[algorithmId].name);
    if (fname) {
      showToast(`Tuval görüntüsü indirildi: ${fname}`);
    } else {
      showToast('PNG almak için önce Simülasyon görünümüne geçin.');
    }
  };

  const handleQuickDownloadReport = () => {
    const fname = exportReportHtml(runHistory[0] ?? null, benchmarks, dataset);
    showToast(`Detaylı HTML/PDF raporu indirildi: ${fname}`);
  };

  const handleClearHistory = () => {
    setRunHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    showToast('Çalıştırma geçmişi temizlendi.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <TopBar
        activeSection={activeSection}
        onSelectSection={(sec) => {
          if (sec !== 'simulation' && (status === 'running' || status === 'verifying')) {
            stopLoop();
            setStatus('paused');
          }
          setActiveSection(sec);
        }}
        onQuickDownloadReport={handleQuickDownloadReport}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {activeSection === 'simulation' && (
          <SimulationView
            array={array}
            activeIndices={activeIndices}
            secondaryIndices={secondaryIndices}
            lockedIndices={lockedIndices}
            verifiedUpTo={verifiedUpTo}
            algorithmId={algorithmId}
            onChangeAlgorithm={handleChangeAlgorithm}
            dataset={dataset}
            arraySize={arraySize}
            onChangeArraySize={handleChangeArraySize}
            distribution={distribution}
            onChangeDistribution={handleChangeDistribution}
            delayMs={delayMs}
            onChangeDelayMs={setDelayMs}
            status={status}
            metrics={metrics}
            stepNote={stepNote}
            telemetry={telemetry}
            visualMode={visualMode}
            onChangeVisualMode={setVisualMode}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              soundEngine.unlock();
              setSoundEnabled((v) => !v);
            }}
            volume={volume}
            onChangeVolume={setVolume}
            waveform={waveform}
            onChangeWaveform={setWaveform}
            audioScale={audioScale}
            onChangeAudioScale={setAudioScale}
            sustainMs={sustainMs}
            onChangeSustainMs={setSustainMs}
            onTestSound={() => {
              if (!soundEnabled) setSoundEnabled(true);
              soundEngine.setEnabled(true);
              soundEngine.playTestArpeggio();
            }}
            isDark={isDark}
            onToggleTheme={() => setIsDark((v) => !v)}
            onStartPause={handleStartPause}
            onStepForward={handleStepForward}
            onReset={handleReset}
            onShuffle={handleShuffle}
            onOpenDataStudio={() => setActiveSection('data')}
            onCaptureSnapshot={handleCaptureSnapshot}
            canvasRef={canvasRef}
          />
        )}

        {activeSection === 'data' && (
          <DataStudioView
            currentDataset={dataset}
            isDark={isDark}
            onApplyDataset={handleApplyCustomDataset}
          />
        )}

        {activeSection === 'analytics' && (
          <AnalyticsView
            dataset={dataset}
            activeAlgorithmId={algorithmId}
            telemetry={telemetry}
            benchmarks={benchmarks}
            scalingData={scalingData}
            isDark={isDark}
            onRunBenchmarks={handleRunBenchmarks}
            onRunScalingTest={handleRunScalingTest}
            onSimulateAlgorithm={handleSimulateFromAnalytics}
          />
        )}

        {activeSection === 'reports' && (
          <ReportsView
            runs={runHistory}
            benchmarks={benchmarks}
            dataset={dataset}
            onExportHtml={(sel) => {
              const fn = exportReportHtml(sel, benchmarks, dataset);
              showToast(`HTML raporu indirildi: ${fn}`);
            }}
            onExportCsv={() => {
              const fn = exportReportCsv(runHistory, benchmarks, dataset);
              showToast(`CSV tablosu indirildi: ${fn}`);
            }}
            onExportJson={(sel) => {
              const fn = exportReportJson(sel, runHistory, benchmarks, dataset);
              showToast(`JSON telemetri raporu indirildi: ${fn}`);
            }}
            onExportMarkdown={(sel) => {
              const fn = exportReportMarkdown(sel, benchmarks, dataset);
              showToast(`Markdown raporu indirildi: ${fn}`);
            }}
            onExportPng={handleCaptureSnapshot}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      <footer className="mt-8 border-t border-[var(--md-sys-color-outline-variant)] py-5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 text-xs text-[var(--md-sys-color-on-surface-variant)] sm:px-6 lg:px-8">
          <span>SıraLab · Etkileşimli Algoritma Simülasyonu ve Performans Laboratuvarı</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveSection('simulation')}
              className="hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Simülasyon
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('data')}
              className="hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Veri Stüdyosu
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('analytics')}
              className="hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Canlı Analitik
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('reports')}
              className="hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
            >
              Raporlar
            </button>
          </div>
        </div>
      </footer>

      {/* Material 3 Snackbar Feedback */}
      {snackbarMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 max-w-md rounded-xl bg-[var(--md-sys-color-on-surface)] px-4 py-3 text-sm font-medium text-[var(--md-sys-color-surface)] shadow-lg"
        >
          {snackbarMessage}
        </div>
      )}
    </div>
  );
}
