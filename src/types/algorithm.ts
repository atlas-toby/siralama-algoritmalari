export type AlgorithmId =
  | 'radixLSD'
  | 'quick'
  | 'merge'
  | 'heap'
  | 'shell'
  | 'tim'
  | 'insertion'
  | 'bubble'
  | 'selection'
  | 'cocktail'
  | 'counting'
  | 'bogo'
  | 'bozo'
  | 'stalin'
  | 'thanos'
  | 'miracle'
  | 'stooge'
  | 'gnome'
  | 'pancake'
  | 'netlimiterlan';

export type DistributionType =
  | 'random'
  | 'reversed'
  | 'nearlySorted'
  | 'fewUnique'
  | 'mountain'
  | 'sawtooth'
  | 'gaussian'
  | 'custom';

export type VisualMode = 'classic' | 'spectrum' | 'dots' | 'circle';

export type AudioWaveform = 'triangle' | 'sine' | 'square' | 'sawtooth';

export type AudioScale = 'bingmann' | 'pentatonic' | 'chromatic' | 'linear';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'verifying' | 'completed';

export type AppSection = 'simulation' | 'data' | 'analytics' | 'reports';

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  englishName: string;
  category:
    | 'Dağıtım'
    | 'Böl ve Yönet'
    | 'Seçim / Yığın'
    | 'Eklemeli'
    | 'Değiş Tokuş'
    | 'Hibrit'
    | 'Mizahi / Egzotik'
    | 'Custom';
  bestTime: string;
  avgTime: string;
  worstTime: string;
  space: string;
  stable: boolean;
  inPlace: boolean;
  comparisonBased: boolean;
  summary: string;
  howItWorks: string;
}

export interface TelemetryPoint {
  step: number;
  elapsedMs: number;
  comparisons: number;
  arrayAccesses: number;
  writes: number;
  swaps: number;
  sortedness: number;
}

export interface CustomAlgorithmStats {
  divideCount: number;
  shuffleCount: number;
  lockedSegments: number;
  totalLeafSegments: number;
  activeStage: 'idle' | 'divide' | 'shuffle' | 'lock' | 'merge' | 'verify' | 'done';
}

export interface SortMetrics {
  comparisons: number;
  arrayAccesses: number;
  writes: number;
  swaps: number;
  steps: number;
  elapsedMs: number;
  sortedness: number;
  passLabel: string;
  customStats?: CustomAlgorithmStats;
}

export interface SortStep {
  array: number[];
  activeIndices: number[];
  secondaryIndices: number[];
  lockedIndices?: number[];
  verifiedUpTo: number;
  phase: 'sorting' | 'verifying' | 'done';
  soundValue: number | null;
  metrics: SortMetrics;
  note: string;
}

export interface DatasetStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  uniqueCount: number;
  duplicateCount: number;
  sortednessPct: number;
  disorderPct: number;
  hasNegatives: boolean;
  hasDecimals: boolean;
}

export interface DatasetProfile {
  label: string;
  source: DistributionType;
  values: number[];
  stats: DatasetStats;
  createdAt: string;
}

export interface SimulationRun {
  id: string;
  timestamp: string;
  algorithmId: AlgorithmId;
  algorithmName: string;
  datasetLabel: string;
  datasetSource: DistributionType;
  arraySize: number;
  delayMs: number;
  comparisons: number;
  arrayAccesses: number;
  writes: number;
  swaps: number;
  totalSteps: number;
  durationMs: number;
  cpuTimeMs: number;
  initialDisorderPct: number;
  telemetry: TelemetryPoint[];
  initialValuesSample: number[];
  sortedValuesSample: number[];
}

export interface BenchmarkEntry {
  algorithmId: AlgorithmId;
  algorithmName: string;
  category: AlgorithmMeta['category'];
  comparisons: number;
  arrayAccesses: number;
  writes: number;
  swaps: number;
  cpuTimeMs: number;
  avgTimeComplexity: string;
  spaceComplexity: string;
  stable: boolean;
  comparisonBased: boolean;
  capped?: boolean;
  survivingCount?: number;
}

export interface ScalingPoint {
  n: number;
  radixLSD: number;
  quick: number;
  merge: number;
  heap: number;
  shell: number;
  insertion: number;
}
