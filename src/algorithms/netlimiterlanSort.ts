import { AlgorithmMeta, CustomAlgorithmStats, SortMetrics, SortStep } from '../types/algorithm';
import { computeSortedness } from '../utils/datasetUtils';

export const NETLIMITERLAN_META: AlgorithmMeta = {
  id: 'netlimiterlan',
  name: 'Netlimiterlan Sort',
  englishName: 'Netlimiterlan Sort',
  category: 'Custom',
  bestTime: 'O(n log n)',
  avgTime: 'O(n log n)',
  worstTime: 'O(∞)',
  space: 'O(n)',
  stable: false,
  inPlace: false,
  comparisonBased: true,
  summary:
    'Diziyi ≤3 elemanlık parçalara böler, her parçayı Fisher-Yates ile sıralayıp kilitler, ardından klasik Merge Sort ile birleştirir.',
  howItWorks:
    'Özyinelemeli bölme ile ≤3 elemanlık alt diziler oluşturur. Her alt parça sıralanana kadar rastgele karıştırılır; sıralandığı an kilitlenir ve bir daha karıştırılmaz. Tüm kilitli parçalar klasik Merge aşamasıyla tek dizide birleştirilir.',
};

interface RecursiveSplitNode {
  left: number;
  mid: number;
  right: number;
}

export interface NetlimiterlanEngineHooks {
  arr: number[];
  read: (i: number) => number;
  write: (i: number, val: number) => void;
  compareIdx: (i: number, j: number) => number;
  swap: (i: number, j: number) => void;
  addAccess: (count?: number) => void;
  addComparison: (count?: number) => void;
  getCounters: () => {
    comparisons: number;
    arrayAccesses: number;
    writes: number;
    swaps: number;
    steps: number;
    startTime: number;
  };
  bumpStep: () => number;
  setPassLabel: (label: string) => void;
}

function rangeIndices(left: number, right: number): number[] {
  const out: number[] = [];
  for (let i = left; i <= right; i++) out.push(i);
  return out;
}

function countLeavesRecursive(left: number, right: number): number {
  if (right - left + 1 <= 3) return 1;
  const mid = Math.floor((left + right) / 2);
  return countLeavesRecursive(left, mid) + countLeavesRecursive(mid + 1, right);
}

/**
 * Modular step-emitting generator for Netlimiterlan Sort:
 * 1. Divide recursively into sub-arrays of length <= 3
 * 2. Conquer & Lock each <= 3 leaf using Fisher-Yates shuffle until sorted, then lock permanently
 * 3. Merge all locked segments back up the recursive split tree using classic Merge Sort
 */
export function* createNetlimiterlanGenerator(
  hooks: NetlimiterlanEngineHooks
): Generator<SortStep, CustomAlgorithmStats, void> {
  const { arr, read, write, compareIdx, swap, addAccess, addComparison, getCounters, bumpStep, setPassLabel } =
    hooks;
  const n = arr.length;

  const stats: CustomAlgorithmStats = {
    divideCount: 0,
    shuffleCount: 0,
    lockedSegments: 0,
    totalLeafSegments: n > 0 ? countLeavesRecursive(0, n - 1) : 0,
    activeStage: 'divide',
  };

  if (n <= 1) {
    stats.lockedSegments = stats.totalLeafSegments;
    stats.activeStage = 'done';
    return stats;
  }

  const lockedSet = new Set<number>();
  const mergePlan: RecursiveSplitNode[] = [];

  const emit = (
    activeIndices: number[],
    secondaryIndices: number[],
    soundValue: number | null,
    passLabel: string,
    note: string,
    stage: CustomAlgorithmStats['activeStage']
  ): SortStep => {
    stats.activeStage = stage;
    setPassLabel(passLabel);
    const stepNo = bumpStep();
    const c = getCounters();
    const metrics: SortMetrics = {
      comparisons: c.comparisons,
      arrayAccesses: c.arrayAccesses,
      writes: c.writes,
      swaps: c.swaps,
      steps: stepNo,
      elapsedMs: Math.round((performance.now() - c.startTime) * 10) / 10,
      sortedness: -1,
      passLabel,
      customStats: { ...stats },
    };
    return {
      array: arr,
      activeIndices,
      secondaryIndices,
      lockedIndices: Array.from(lockedSet),
      verifiedUpTo: -1,
      phase: 'sorting',
      soundValue,
      metrics,
      note,
    };
  };

  const isLeafSorted = (left: number, right: number): boolean => {
    for (let i = left; i < right; i++) {
      if (compareIdx(i, i + 1) > 0) return false;
    }
    return true;
  };

  // Phase 1 & 2: Recursive Divide (<= 3) + Conquer via Fisher-Yates Shuffle & Permanent Lock
  function* divideAndLock(left: number, right: number): Generator<SortStep, void, void> {
    const len = right - left + 1;

    if (len <= 3) {
      const segIndices = rangeIndices(left, right);
      let leafShuffles = 0;

      // Randomly shuffle with Fisher-Yates until this <=3 sub-array is sorted
      while (!isLeafSorted(left, right)) {
        stats.shuffleCount++;
        leafShuffles++;
        for (let i = right; i > left; i--) {
          const j = left + Math.floor(Math.random() * (i - left + 1));
          if (i !== j) {
            swap(i, j);
          }
        }
        yield emit(
          [],
          segIndices,
          arr[left],
          `Karıştırma [${left}..${right}] (Deneme #${leafShuffles})`,
          `Alt parça [${left}..${right}] (${len} eleman) Fisher-Yates ile karıştırıldı (Toplam karıştırma: ${stats.shuffleCount}).`,
          'shuffle'
        );
      }

      // Optimization Rule: Lock immediately once sorted; never touch or re-check in shuffle pool
      for (let i = left; i <= right; i++) {
        lockedSet.add(i);
      }
      stats.lockedSegments++;

      yield emit(
        [],
        [],
        arr[right],
        `Kilitlendi (${stats.lockedSegments}/${stats.totalLeafSegments})`,
        `Alt parça [${left}..${right}] sıralandı ve kilitlendi (${leafShuffles} karıştırma). Artık karıştırma havuzundan çıkarıldı.`,
        'lock'
      );
      return;
    }

    const mid = Math.floor((left + right) / 2);
    stats.divideCount++;

    yield emit(
      [],
      rangeIndices(left, right),
      arr[mid],
      `Bölme #${stats.divideCount} [${left}..${mid}] | [${mid + 1}..${right}]`,
      `[${left}..${right}] (${len} eleman) özyinelemeli olarak ikiye bölündü (Toplam bölme: ${stats.divideCount}).`,
      'divide'
    );

    yield* divideAndLock(left, mid);
    yield* divideAndLock(mid + 1, right);

    // Record exact recursive post-order merge boundary
    mergePlan.push({ left, mid, right });
  }

  yield* divideAndLock(0, n - 1);

  // Phase 3: Classic Merge Sort over all locked sub-segments
  const aux = new Array<number>(n);

  for (let p = 0; p < mergePlan.length; p++) {
    const { left, mid, right } = mergePlan[p];
    const passText = `Birleştirme [${left}..${mid}] + [${mid + 1}..${right}]`;

    let i = left;
    let j = mid + 1;
    let k = left;

    while (i <= mid && j <= right) {
      const vi = read(i);
      const vj = read(j);
      addComparison(1);

      yield emit(
        [i, j],
        [],
        vi <= vj ? vi : vj,
        passText,
        `Merge karşılaştırması: #${i} (${vi}) ile #${j} (${vj}) kıyaslanıyor.`,
        'merge'
      );

      if (vi <= vj) {
        aux[k++] = vi;
        i++;
      } else {
        aux[k++] = vj;
        j++;
      }
      addAccess(1);
    }

    while (i <= mid) {
      aux[k++] = read(i++);
      addAccess(1);
    }

    while (j <= right) {
      aux[k++] = read(j++);
      addAccess(1);
    }

    for (let m = left; m <= right; m++) {
      write(m, aux[m]);
      addAccess(1);
      yield emit(
        [m],
        [],
        aux[m],
        passText,
        `Birleştirilen değer indeks #${m} konumuna yazılıyor (Düzenlilik %${computeSortedness(arr).toFixed(1)}).`,
        'merge'
      );
    }
  }

  stats.activeStage = 'verify';
  return stats;
}
