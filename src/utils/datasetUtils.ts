import { DatasetProfile, DatasetStats, DistributionType } from '../types/algorithm';

export const DISTRIBUTION_LABELS: Record<DistributionType, string> = {
  random: 'Rastgele Dağılım',
  reversed: 'Ters Sıralı',
  nearlySorted: 'Neredeyse Sıralı',
  fewUnique: 'Az Benzersiz Değer',
  mountain: 'Piramit (Dağ)',
  sawtooth: 'Testere Dişi',
  gaussian: 'Normal (Gauss)',
  custom: 'Özel Kullanıcı Verisi',
};

export function computeSortedness(arr: number[]): number {
  const n = arr.length;
  if (n <= 1) return 100;
  let orderedPairs = 0;
  for (let i = 0; i < n - 1; i++) {
    if (arr[i] <= arr[i + 1]) {
      orderedPairs++;
    }
  }
  return Math.round((orderedPairs / (n - 1)) * 1000) / 10;
}

export function computeDatasetStats(values: number[]): DatasetStats {
  const n = values.length;
  if (n === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      uniqueCount: 0,
      duplicateCount: 0,
      sortednessPct: 100,
      disorderPct: 0,
      hasNegatives: false,
      hasDecimals: false,
    };
  }

  let min = values[0];
  let max = values[0];
  let sum = 0;
  let hasNegatives = false;
  let hasDecimals = false;
  const uniqueSet = new Set<number>();

  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
    if (v < 0) hasNegatives = true;
    if (!Number.isInteger(v)) hasDecimals = true;
    uniqueSet.add(v);
  }

  const mean = sum / n;
  let varianceSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = values[i] - mean;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / n);

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  const sortednessPct = computeSortedness(values);
  const disorderPct = Math.round((100 - sortednessPct) * 10) / 10;

  return {
    count: n,
    min: Math.round(min * 1000) / 1000,
    max: Math.round(max * 1000) / 1000,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    uniqueCount: uniqueSet.size,
    duplicateCount: n - uniqueSet.size,
    sortednessPct,
    disorderPct,
    hasNegatives,
    hasDecimals,
  };
}

export function generateDistribution(type: Exclude<DistributionType, 'custom'>, size: number): number[] {
  const n = Math.max(8, Math.min(1024, Math.floor(size)));
  const arr: number[] = [];

  switch (type) {
    case 'random': {
      for (let i = 1; i <= n; i++) arr.push(i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    case 'reversed': {
      for (let i = n; i >= 1; i--) arr.push(i);
      return arr;
    }
    case 'nearlySorted': {
      for (let i = 1; i <= n; i++) arr.push(i);
      const swaps = Math.max(2, Math.floor(n * 0.08));
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(Math.random() * n);
        const offset = Math.max(1, Math.floor(n * 0.06));
        const j = Math.max(0, Math.min(n - 1, i + Math.floor((Math.random() * 2 - 1) * offset)));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    case 'fewUnique': {
      const buckets = Math.max(4, Math.min(8, Math.floor(n / 8)));
      for (let i = 0; i < n; i++) {
        const bucketIdx = Math.floor(Math.random() * buckets) + 1;
        arr.push(Math.round((bucketIdx / buckets) * n));
      }
      return arr;
    }
    case 'mountain': {
      const half = Math.floor(n / 2);
      for (let i = 0; i < n; i++) {
        if (i < half) {
          arr.push(Math.round(((i + 1) / half) * n));
        } else {
          arr.push(Math.round(((n - i) / (n - half)) * n));
        }
      }
      return arr;
    }
    case 'sawtooth': {
      const teeth = 4;
      const toothLen = Math.max(2, Math.floor(n / teeth));
      for (let i = 0; i < n; i++) {
        const pos = i % toothLen;
        arr.push(Math.round(((pos + 1) / toothLen) * n));
      }
      return arr;
    }
    case 'gaussian': {
      for (let i = 0; i < n; i++) {
        const u1 = Math.max(1e-6, Math.random());
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const clamped = Math.max(1, Math.min(n, Math.round((z * 0.18 + 0.5) * n)));
        arr.push(clamped);
      }
      return arr;
    }
  }
}

export function createDatasetProfile(
  values: number[],
  source: DistributionType,
  customLabel?: string
): DatasetProfile {
  return {
    label: customLabel ?? DISTRIBUTION_LABELS[source],
    source,
    values,
    stats: computeDatasetStats(values),
    createdAt: new Date().toISOString(),
  };
}

export interface ParseResult {
  values: number[];
  error?: string;
  detectedColumns?: string[];
  rows?: string[][];
}

export function parseCustomNumberText(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { values: [], error: 'Lütfen en az 4 sayısal değer girin.' };
  }

  // Try JSON first if it looks like JSON array or object
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const nums: number[] = [];
        for (const item of parsed) {
          if (typeof item === 'number' && Number.isFinite(item)) {
            nums.push(item);
          } else if (typeof item === 'string' && !Number.isNaN(Number(item))) {
            nums.push(Number(item));
          } else if (item && typeof item === 'object') {
            const firstNum = Object.values(item).find(
              (v) => typeof v === 'number' && Number.isFinite(v)
            );
            if (typeof firstNum === 'number') nums.push(firstNum);
          }
        }
        if (nums.length >= 4) {
          return { values: nums.slice(0, 1024) };
        }
      }
    } catch {
      // Fall through to delimiter parsing
    }
  }

  // Split by comma, semicolon, whitespace, newline, or tab
  const tokens = trimmed
    .split(/[\s,;|\t\n\r]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const nums: number[] = [];
  for (const token of tokens) {
    const num = Number(token);
    if (Number.isFinite(num)) {
      nums.push(num);
    }
  }

  if (nums.length < 4) {
    return {
      values: [],
      error: `Geçerli en az 4 sayısal değer gerekiyor (şu an ${nums.length} adet algılandı).`,
    };
  }

  return { values: nums.slice(0, 1024) };
}

export function parseCsvColumns(text: string): {
  headers: string[];
  numericColumns: { name: string; index: number; values: number[] }[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { headers: [], numericColumns: [] };

  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const splitRow = (row: string) => row.split(delimiter).map((cell) => cell.replace(/^"|"$/g, '').trim());

  const firstRow = splitRow(lines[0]);
  const firstRowNumericCount = firstRow.filter((c) => c !== '' && Number.isFinite(Number(c))).length;
  const hasHeader = firstRowNumericCount < firstRow.length / 2;

  const headers = hasHeader
    ? firstRow.map((h, i) => h || `Sütun ${i + 1}`)
    : firstRow.map((_, i) => `Sütun ${i + 1}`);

  const dataRows = (hasHeader ? lines.slice(1) : lines).map(splitRow);
  const numericColumns: { name: string; index: number; values: number[] }[] = [];

  for (let col = 0; col < headers.length; col++) {
    const vals: number[] = [];
    for (const row of dataRows) {
      if (col < row.length && row[col] !== '') {
        const num = Number(row[col]);
        if (Number.isFinite(num)) vals.push(num);
      }
    }
    if (vals.length >= 4) {
      numericColumns.push({
        name: headers[col],
        index: col,
        values: vals.slice(0, 1024),
      });
    }
  }

  return { headers, numericColumns };
}

export function buildHistogram(values: number[], binCount = 16): { range: string; count: number }[] {
  if (values.length === 0) return [];
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    return [{ range: `${min}`, count: values.length }];
  }

  const actualBins = Math.min(binCount, Math.max(4, Math.ceil(Math.sqrt(values.length))));
  const step = (max - min) / actualBins;
  const counts = new Array<number>(actualBins).fill(0);

  for (const v of values) {
    const idx = Math.min(actualBins - 1, Math.floor((v - min) / step));
    counts[idx]++;
  }

  return counts.map((count, idx) => {
    const lo = Math.round((min + idx * step) * 10) / 10;
    const hi = Math.round((min + (idx + 1) * step) * 10) / 10;
    return {
      range: `${lo}–${hi}`,
      count,
    };
  });
}

export function normalizeArrayForDisplay(values: number[]): number[] {
  if (values.length === 0) return [];
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min;
  if (span === 0) return values.map(() => 0.5);
  return values.map((v) => 0.04 + ((v - min) / span) * 0.96);
}
