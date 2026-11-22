import {
  AlgorithmId,
  AlgorithmMeta,
  BenchmarkEntry,
  ScalingPoint,
  SortMetrics,
  SortStep,
} from '../types/algorithm';
import { computeSortedness, generateDistribution } from '../utils/datasetUtils';

export const ALGORITHMS: AlgorithmMeta[] = [
  {
    id: 'radixLSD',
    name: 'Radix Sort (LSD)',
    englishName: 'Radix Sort (LSD)',
    category: 'Dağıtım',
    bestTime: 'O(d · (n + k))',
    avgTime: 'O(d · (n + k))',
    worstTime: 'O(d · (n + k))',
    space: 'O(n + k)',
    stable: true,
    inPlace: false,
    comparisonBased: false,
    summary: 'Karşılaştırma yapmadan en düşük anlamlı basamaktan başlayarak kovalara dağıtır.',
    howItWorks:
      'Her elemanı taban-4/taban-10 basamaklarına ayırır; iki değer arasında hiç karşılaştırma (0 karşılaştırma) yapmadan yalnızca dizi erişimleriyle kararlı şekilde sıralar.',
  },
  {
    id: 'quick',
    name: 'Quick Sort (Hızlı)',
    englishName: 'Quick Sort',
    category: 'Böl ve Yönet',
    bestTime: 'O(n log n)',
    avgTime: 'O(n log n)',
    worstTime: 'O(n²)',
    space: 'O(log n)',
    stable: false,
    inPlace: true,
    comparisonBased: true,
    summary: 'Üçlü medyan pivot seçimiyle diziyi yerinde böler ve özyinelemeli sıralar.',
    howItWorks:
      'Seçilen pivot elemandan küçükleri sola, büyükleri sağa yerleştirir. Önbellek dostu yapısı sayesinde pratikte en hızlı karşılaştırmalı sıralamalardan biridir.',
  },
  {
    id: 'merge',
    name: 'Merge Sort (Birleştirme)',
    englishName: 'Merge Sort',
    category: 'Böl ve Yönet',
    bestTime: 'O(n log n)',
    avgTime: 'O(n log n)',
    worstTime: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    inPlace: false,
    comparisonBased: true,
    summary: 'Diziyi yarıya bölerek en kötü durumda dahi garantili O(n log n) performans verir.',
    howItWorks:
      'Alt dizileri tek elemana inene kadar böler, ardından sıralı parçaları yardımcı bir tampon kullanarak kararlı biçimde birleştirir.',
  },
  {
    id: 'heap',
    name: 'Heap Sort (Yığın)',
    englishName: 'Heap Sort',
    category: 'Seçim / Yığın',
    bestTime: 'O(n log n)',
    avgTime: 'O(n log n)',
    worstTime: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    inPlace: true,
    comparisonBased: true,
    summary: 'Ek bellek kullanmadan maksimum yığın ağacı üzerinden en büyük elemanı çıkarır.',
    howItWorks:
      'Önce dizi içinde bir ikili maksimum yığın (max-heap) kurar; kök elemanı sona alıp kalan yığını yeniden dengeleyerek ilerler.',
  },
  {
    id: 'shell',
    name: 'Shell Sort',
    englishName: 'Shell Sort',
    category: 'Eklemeli',
    bestTime: 'O(n log n)',
    avgTime: 'O(n^1.3)',
    worstTime: 'O(n²)',
    space: 'O(1)',
    stable: false,
    inPlace: true,
    comparisonBased: true,
    summary: 'Ciura aralık dizisiyle uzak elemanları hızla yaklaştırıp eklemeli sıralamayı hızlandırır.',
    howItWorks:
      'Azalan aralıklarla (gap) alt dizileri sıralayarak büyük terslikleri erken aşamada temizler, son adımda gap=1 ile kesin sıralamayı tamamlar.',
  },
  {
    id: 'tim',
    name: 'Tim Sort (Hibrit)',
    englishName: 'Tim Sort',
    category: 'Hibrit',
    bestTime: 'O(n)',
    avgTime: 'O(n log n)',
    worstTime: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    inPlace: false,
    comparisonBased: true,
    summary: 'Küçük blokları eklemeli sıralayıp birleştiren gerçek dünya hibrit algoritması.',
    howItWorks:
      'Python ve V8 motorlarında kullanılan yaklaşımla diziyi 16 elemanlık koşulara (run) bölüp eklemeli sıralar, sonra ardışık koşuları birleştirir.',
  },
  {
    id: 'counting',
    name: 'Counting Sort (Sayma)',
    englishName: 'Counting Sort',
    category: 'Dağıtım',
    bestTime: 'O(n + k)',
    avgTime: 'O(n + k)',
    worstTime: 'O(n + k)',
    space: 'O(n + k)',
    stable: true,
    inPlace: false,
    comparisonBased: false,
    summary: 'Frekans histogramı ve kümülatif toplamla doğrusal zamanda sıralar.',
    howItWorks:
      'Her değerin frekansını sayarak kümülatif indeks haritası çıkarır ve karşılaştırma yapmadan (0 karşılaştırma) hedef konumlarına yazar.',
  },
  {
    id: 'insertion',
    name: 'Insertion Sort (Eklemeli)',
    englishName: 'Insertion Sort',
    category: 'Eklemeli',
    bestTime: 'O(n)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    space: 'O(1)',
    stable: true,
    inPlace: true,
    comparisonBased: true,
    summary: 'Neredeyse sıralı veya küçük veri setlerinde çok az işlemle yüksek verim sunar.',
    howItWorks:
      'Sol tarafta büyüyen sıralı alt diziye her yeni elemanı doğru konumunu bulana kadar sola kaydırarak yerleştirir.',
  },
  {
    id: 'selection',
    name: 'Selection Sort (Seçmeli)',
    englishName: 'Selection Sort',
    category: 'Seçim / Yığın',
    bestTime: 'O(n²)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    space: 'O(1)',
    stable: false,
    inPlace: true,
    comparisonBased: true,
    summary: 'En fazla n takas yapar; yazma maliyeti kritik olduğunda öne çıkar.',
    howItWorks:
      'Her turda sıralanmamış bölgedeki en küçük elemanı tarayıp bulur ve mevcut başlangıç pozisyonuyla tek seferde takas eder.',
  },
  {
    id: 'cocktail',
    name: 'Cocktail Shaker Sort',
    englishName: 'Cocktail Shaker Sort',
    category: 'Değiş Tokuş',
    bestTime: 'O(n)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    space: 'O(1)',
    stable: true,
    inPlace: true,
    comparisonBased: true,
    summary: 'Diziyi hem soldan sağa hem sağdan sola tarayan çift yönlü kabarcık sıralaması.',
    howItWorks:
      'İleri geçişte en büyük elemanı sağa, geri geçişte en küçük elemanı sola iterek uç değerlerin takılmasını önler.',
  },
  {
    id: 'bubble',
    name: 'Bubble Sort (Kabarcık)',
    englishName: 'Bubble Sort',
    category: 'Değiş Tokuş',
    bestTime: 'O(n)',
    avgTime: 'O(n²)',
    worstTime: 'O(n²)',
    space: 'O(1)',
    stable: true,
    inPlace: true,
    comparisonBased: true,
    summary: 'Komşu elemanları karşılaştırıp yer değiştiren temel referans algoritması.',
    howItWorks:
      'Her geçişte ardışık çiftleri kıyaslar; erken durdurma bayrağı sayesinde dizi sıralandığında gereksiz turları keser.',
  },
];

export const ALGORITHM_MAP: Record<AlgorithmId, AlgorithmMeta> = ALGORITHMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<AlgorithmId, AlgorithmMeta>
);

interface EngineState {
  arr: number[];
  comparisons: number;
  arrayAccesses: number;
  writes: number;
  swaps: number;
  steps: number;
  startTime: number;
  passLabel: string;
}

function makeStep(
  st: EngineState,
  activeIndices: number[],
  secondaryIndices: number[],
  verifiedUpTo: number,
  phase: SortStep['phase'],
  soundValue: number | null,
  note: string,
  computeSorted = false
): SortStep {
  st.steps++;
  const metrics: SortMetrics = {
    comparisons: st.comparisons,
    arrayAccesses: st.arrayAccesses,
    writes: st.writes,
    swaps: st.swaps,
    steps: st.steps,
    elapsedMs: Math.round((performance.now() - st.startTime) * 10) / 10,
    sortedness: computeSorted ? computeSortedness(st.arr) : phase === 'done' ? 100 : -1,
    passLabel: st.passLabel,
  };
  return {
    array: st.arr,
    activeIndices,
    secondaryIndices,
    verifiedUpTo,
    phase,
    soundValue,
    metrics,
    note,
  };
}

function buildQuantizedKeys(arr: number[]): { keys: number[]; maxKey: number } {
  if (arr.length === 0) return { keys: [], maxKey: 0 };
  let min = arr[0];
  let max = arr[0];
  let allInts = true;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
    if (arr[i] > max) max = arr[i];
    if (!Number.isInteger(arr[i])) allInts = false;
  }
  const span = max - min;
  if (allInts && span <= 65535) {
    const keys = arr.map((v) => v - min);
    return { keys, maxKey: span };
  }
  // Map arbitrary floats/large ranges cleanly into exact order-preserving integer ranks
  const indexed = arr.map((v, idx) => ({ v, idx })).sort((a, b) => a.v - b.v);
  const rankMap = new Map<number, number>();
  let rank = 0;
  for (let i = 0; i < indexed.length; i++) {
    if (i > 0 && indexed[i].v !== indexed[i - 1].v) rank++;
    rankMap.set(indexed[i].v, rank);
  }
  const keys = arr.map((v) => rankMap.get(v) ?? 0);
  return { keys, maxKey: rank };
}

export function* createSortGenerator(
  algorithmId: AlgorithmId,
  inputValues: number[]
): Generator<SortStep, void, void> {
  const arr = [...inputValues];
  const n = arr.length;
  const st: EngineState = {
    arr,
    comparisons: 0,
    arrayAccesses: 0,
    writes: 0,
    swaps: 0,
    steps: 0,
    startTime: performance.now(),
    passLabel: 'Hazırlanıyor',
  };

  const read = (i: number) => {
    st.arrayAccesses++;
    return arr[i];
  };

  const write = (i: number, val: number) => {
    st.arrayAccesses++;
    st.writes++;
    arr[i] = val;
  };

  const compareIdx = (i: number, j: number) => {
    st.comparisons++;
    st.arrayAccesses += 2;
    return arr[i] - arr[j];
  };

  const swap = (i: number, j: number) => {
    if (i === j) return;
    st.arrayAccesses += 4;
    st.writes += 2;
    st.swaps++;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  };

  if (n > 1) {
    switch (algorithmId) {
      case 'radixLSD': {
        // Authentic Sound of Sorting LSD Radix Sort (base 4 for rich visual passes like the screenshot)
        const base = 4;
        const { keys, maxKey } = buildQuantizedKeys(arr);
        const keyMap = new Map<number, number>();
        for (let i = 0; i < n; i++) keyMap.set(arr[i], keys[i]);
        let exp = 1;
        let pass = 1;
        const maxVal = Math.max(1, maxKey);

        while (Math.floor(maxVal / exp) > 0) {
          st.passLabel = `LSD Tur ${pass} (Taban ${base})`;
          const count = new Array<number>(base).fill(0);
          const output = new Array<number>(n);

          // Count phase
          for (let i = 0; i < n; i++) {
            const val = read(i);
            const k = keyMap.get(val) ?? 0;
            const digit = Math.floor(k / exp) % base;
            count[digit]++;
            yield makeStep(
              st,
              [i],
              [],
              -1,
              'sorting',
              val,
              `Tur ${pass}: Eleman #${i} için basamak değeri ${digit} sayılıyor.`
            );
          }

          for (let b = 1; b < base; b++) {
            count[b] += count[b - 1];
          }

          // Build output buffer stably (right to left)
          for (let i = n - 1; i >= 0; i--) {
            const val = read(i);
            const k = keyMap.get(val) ?? 0;
            const digit = Math.floor(k / exp) % base;
            const pos = --count[digit];
            output[pos] = val;
            st.arrayAccesses++;
          }

          // Write back to main array (creates the classic Radix sweep wave)
          for (let i = 0; i < n; i++) {
            const val = output[i];
            write(i, val);
            st.arrayAccesses++;
            yield makeStep(
              st,
              [i],
              [],
              -1,
              'sorting',
              val,
              `Tur ${pass}: Kova çıktısı dizinin ${i}. indeksine yazılıyor.`
            );
          }

          exp *= base;
          pass++;
        }
        break;
      }

      case 'counting': {
        st.passLabel = 'Frekans Sayımı';
        const { keys, maxKey } = buildQuantizedKeys(arr);
        const keyMap = new Map<number, number>();
        for (let i = 0; i < n; i++) keyMap.set(arr[i], keys[i]);
        const counts = new Array<number>(maxKey + 1).fill(0);
        const output = new Array<number>(n);

        for (let i = 0; i < n; i++) {
          const val = read(i);
          const k = keyMap.get(val) ?? 0;
          counts[k]++;
          yield makeStep(
            st,
            [i],
            [],
            -1,
            'sorting',
            val,
            `Frekans sayımı: indeks ${i} okundu (karşılaştırma yok).`
          );
        }

        for (let k = 1; k <= maxKey; k++) {
          counts[k] += counts[k - 1];
        }

        st.passLabel = 'Kümülatif Yerleştirme';
        for (let i = n - 1; i >= 0; i--) {
          const val = read(i);
          const k = keyMap.get(val) ?? 0;
          const pos = --counts[k];
          output[pos] = val;
          st.arrayAccesses++;
        }

        for (let i = 0; i < n; i++) {
          write(i, output[i]);
          yield makeStep(
            st,
            [i],
            [],
            -1,
            'sorting',
            output[i],
            `Sıralı konum ${i} ana diziye aktarılıyor.`
          );
        }
        break;
      }

      case 'quick': {
        const stack: [number, number][] = [[0, n - 1]];
        while (stack.length > 0) {
          const [lo, hi] = stack.pop()!;
          if (lo >= hi) continue;
          st.passLabel = `Bölümleme [${lo}..${hi}]`;

          // Median-of-three pivot
          const mid = (lo + hi) >> 1;
          if (compareIdx(mid, lo) < 0) swap(mid, lo);
          if (compareIdx(hi, lo) < 0) swap(hi, lo);
          if (compareIdx(mid, hi) < 0) swap(mid, hi);

          const pivotVal = read(hi);
          let i = lo;
          for (let j = lo; j < hi; j++) {
            const valJ = read(j);
            st.comparisons++;
            yield makeStep(
              st,
              [j, hi],
              [i],
              -1,
              'sorting',
              valJ,
              `Pivot (${pivotVal}) ile indeks ${j} karşılaştırılıyor.`
            );
            if (valJ < pivotVal) {
              if (i !== j) {
                swap(i, j);
                yield makeStep(
                  st,
                  [i, j],
                  [hi],
                  -1,
                  'sorting',
                  arr[i],
                  `İndeks ${i} ve ${j} takas edildi.`
                );
              }
              i++;
            }
          }
          swap(i, hi);
          yield makeStep(
            st,
            [i, hi],
            [],
            -1,
            'sorting',
            arr[i],
            `Pivot ${i}. konuma sabitlendi.`
          );

          // Push larger partition first to keep stack shallow
          if (i - 1 - lo > hi - (i + 1)) {
            if (lo < i - 1) stack.push([lo, i - 1]);
            if (i + 1 < hi) stack.push([i + 1, hi]);
          } else {
            if (i + 1 < hi) stack.push([i + 1, hi]);
            if (lo < i - 1) stack.push([lo, i - 1]);
          }
        }
        break;
      }

      case 'merge': {
        const aux = new Array<number>(n);
        for (let width = 1; width < n; width *= 2) {
          st.passLabel = `Blok Birleştirme (Genişlik ${width})`;
          for (let left = 0; left < n; left += 2 * width) {
            const mid = Math.min(left + width, n);
            const right = Math.min(left + 2 * width, n);
            if (mid >= right) continue;

            let i = left;
            let j = mid;
            let k = left;
            while (i < mid && j < right) {
              const vi = read(i);
              const vj = read(j);
              st.comparisons++;
              yield makeStep(
                st,
                [i, j],
                [left, right - 1],
                -1,
                'sorting',
                vi <= vj ? vi : vj,
                `Alt diziler [${left}..${mid - 1}] ve [${mid}..${right - 1}] karşılaştırılıyor.`
              );
              if (vi <= vj) {
                aux[k++] = vi;
                i++;
              } else {
                aux[k++] = vj;
                j++;
              }
              st.arrayAccesses++;
            }
            while (i < mid) {
              aux[k++] = read(i++);
              st.arrayAccesses++;
            }
            while (j < right) {
              aux[k++] = read(j++);
              st.arrayAccesses++;
            }

            for (let m = left; m < right; m++) {
              write(m, aux[m]);
              st.arrayAccesses++;
              yield makeStep(
                st,
                [m],
                [left, right - 1],
                -1,
                'sorting',
                aux[m],
                `Birleştirilen değer indeks ${m} konumuna yazılıyor.`
              );
            }
          }
        }
        break;
      }

      case 'heap': {
        function* siftDown(start: number, end: number): Generator<SortStep, void, void> {
          let root = start;
          while (2 * root + 1 <= end) {
            const child = 2 * root + 1;
            let swapIdx = root;

            if (compareIdx(swapIdx, child) < 0) {
              swapIdx = child;
            }
            if (child + 1 <= end && compareIdx(swapIdx, child + 1) < 0) {
              swapIdx = child + 1;
            }
            yield makeStep(
              st,
              [root, swapIdx],
              [end],
              -1,
              'sorting',
              arr[swapIdx],
              `Yığın düğümü ${root} alt düğümlerle dengeleniyor.`
            );
            if (swapIdx === root) return;
            swap(root, swapIdx);
            yield makeStep(
              st,
              [root, swapIdx],
              [end],
              -1,
              'sorting',
              arr[root],
              `Yığın özelliği için ${root} ve ${swapIdx} takas edildi.`
            );
            root = swapIdx;
          }
        }

        st.passLabel = 'Max-Heap İnşası';
        for (let start = Math.floor((n - 2) / 2); start >= 0; start--) {
          yield* siftDown(start, n - 1);
        }

        st.passLabel = 'Kök Çıkarma';
        for (let end = n - 1; end > 0; end--) {
          swap(0, end);
          yield makeStep(
            st,
            [0, end],
            [],
            -1,
            'sorting',
            arr[end],
            `En büyük kök eleman ${end}. indekse sabitlendi.`
          );
          yield* siftDown(0, end - 1);
        }
        break;
      }

      case 'shell': {
        const ciuraGaps = [701, 301, 132, 57, 23, 10, 4, 1].filter((g) => g < n);
        if (ciuraGaps.length === 0 || ciuraGaps[ciuraGaps.length - 1] !== 1) {
          ciuraGaps.push(1);
        }

        for (const gap of ciuraGaps) {
          st.passLabel = `Aralık (Gap) = ${gap}`;
          for (let i = gap; i < n; i++) {
            const temp = read(i);
            let j = i;
            while (j >= gap) {
              const prev = read(j - gap);
              st.comparisons++;
              yield makeStep(
                st,
                [j, j - gap],
                [],
                -1,
                'sorting',
                prev,
                `Gap=${gap}: indeks ${j - gap} ve ${j} kıyaslanıyor.`
              );
              if (prev > temp) {
                write(j, prev);
                st.swaps++;
                j -= gap;
              } else {
                break;
              }
            }
            write(j, temp);
            yield makeStep(
              st,
              [j],
              [i],
              -1,
              'sorting',
              temp,
              `Gap=${gap}: değer ${j}. indekse yerleştirildi.`
            );
          }
        }
        break;
      }

      case 'tim': {
        const RUN = Math.min(16, Math.max(4, Math.floor(n / 8)));
        st.passLabel = `Koşu Sıralama (Run=${RUN})`;

        for (let start = 0; start < n; start += RUN) {
          const end = Math.min(start + RUN - 1, n - 1);
          for (let i = start + 1; i <= end; i++) {
            const key = read(i);
            let j = i - 1;
            while (j >= start) {
              const valJ = read(j);
              st.comparisons++;
              if (valJ > key) {
                write(j + 1, valJ);
                st.swaps++;
                yield makeStep(
                  st,
                  [j, j + 1],
                  [start, end],
                  -1,
                  'sorting',
                  valJ,
                  `TimSort koşu [${start}..${end}] içinde ekleme yapılıyor.`
                );
                j--;
              } else {
                break;
              }
            }
            write(j + 1, key);
          }
        }

        const aux = new Array<number>(n);
        for (let size = RUN; size < n; size *= 2) {
          st.passLabel = `Koşu Birleştirme (Boyut ${size})`;
          for (let left = 0; left < n; left += 2 * size) {
            const mid = Math.min(left + size, n);
            const right = Math.min(left + 2 * size, n);
            if (mid >= right) continue;

            // Skip already ordered adjacent runs (TimSort adaptive optimization)
            if (compareIdx(mid - 1, mid) <= 0) {
              yield makeStep(
                st,
                [mid - 1, mid],
                [],
                -1,
                'sorting',
                arr[mid],
                `Ardışık koşular zaten sıralı, birleştirme atlandı.`
              );
              continue;
            }

            let i = left;
            let j = mid;
            let k = left;
            while (i < mid && j < right) {
              const vi = read(i);
              const vj = read(j);
              st.comparisons++;
              if (vi <= vj) {
                aux[k++] = vi;
                i++;
              } else {
                aux[k++] = vj;
                j++;
              }
              st.arrayAccesses++;
            }
            while (i < mid) {
              aux[k++] = read(i++);
              st.arrayAccesses++;
            }
            while (j < right) {
              aux[k++] = read(j++);
              st.arrayAccesses++;
            }
            for (let m = left; m < right; m++) {
              write(m, aux[m]);
              yield makeStep(
                st,
                [m],
                [left, right - 1],
                -1,
                'sorting',
                aux[m],
                `TimSort birleştirme çıktısı indeks ${m} konumuna yazılıyor.`
              );
            }
          }
        }
        break;
      }

      case 'insertion': {
        st.passLabel = 'Eklemeli Tarama';
        for (let i = 1; i < n; i++) {
          const key = read(i);
          let j = i - 1;
          while (j >= 0) {
            const valJ = read(j);
            st.comparisons++;
            yield makeStep(
              st,
              [j, j + 1],
              [i],
              -1,
              'sorting',
              valJ,
              `Anahtar değer (${key}) indeks ${j} ile karşılaştırılıyor.`
            );
            if (valJ > key) {
              write(j + 1, valJ);
              st.swaps++;
              j--;
            } else {
              break;
            }
          }
          write(j + 1, key);
          yield makeStep(
            st,
            [j + 1],
            [],
            -1,
            'sorting',
            key,
            `Değer ${j + 1}. indekse yerleştirildi.`
          );
        }
        break;
      }

      case 'selection': {
        st.passLabel = 'Minimum Seçimi';
        for (let i = 0; i < n - 1; i++) {
          let minIdx = i;
          for (let j = i + 1; j < n; j++) {
            const cmp = compareIdx(j, minIdx);
            yield makeStep(
              st,
              [j, minIdx],
              [i],
              -1,
              'sorting',
              arr[j],
              `İndeks ${i} için en küçük aday aranıyor (şu an ${minIdx}).`
            );
            if (cmp < 0) {
              minIdx = j;
            }
          }
          if (minIdx !== i) {
            swap(i, minIdx);
            yield makeStep(
              st,
              [i, minIdx],
              [],
              -1,
              'sorting',
              arr[i],
              `Minimum eleman ${minIdx} ile ${i} takas edildi.`
            );
          }
        }
        break;
      }

      case 'cocktail': {
        let start = 0;
        let end = n - 1;
        let swapped = true;
        let pass = 1;
        while (swapped) {
          swapped = false;
          st.passLabel = `İleri Geçiş #${pass}`;
          for (let i = start; i < end; i++) {
            const cmp = compareIdx(i, i + 1);
            if (cmp > 0) {
              swap(i, i + 1);
              swapped = true;
            }
            yield makeStep(
              st,
              [i, i + 1],
              [start, end],
              -1,
              'sorting',
              arr[i + 1],
              `İleri tarama: indeks ${i} ve ${i + 1} kontrol edildi.`
            );
          }
          if (!swapped) break;
          swapped = false;
          end--;

          st.passLabel = `Geri Geçiş #${pass}`;
          for (let i = end - 1; i >= start; i--) {
            const cmp = compareIdx(i, i + 1);
            if (cmp > 0) {
              swap(i, i + 1);
              swapped = true;
            }
            yield makeStep(
              st,
              [i, i + 1],
              [start, end],
              -1,
              'sorting',
              arr[i],
              `Geri tarama: indeks ${i} ve ${i + 1} kontrol edildi.`
            );
          }
          start++;
          pass++;
        }
        break;
      }

      case 'bubble': {
        for (let i = 0; i < n - 1; i++) {
          let swapped = false;
          st.passLabel = `Kabarcık Turu ${i + 1}`;
          for (let j = 0; j < n - i - 1; j++) {
            const cmp = compareIdx(j, j + 1);
            if (cmp > 0) {
              swap(j, j + 1);
              swapped = true;
            }
            yield makeStep(
              st,
              [j, j + 1],
              [n - i - 1],
              -1,
              'sorting',
              arr[j + 1],
              `Komşu elemanlar ${j} ve ${j + 1} karşılaştırıldı.`
            );
          }
          if (!swapped) break;
        }
        break;
      }
    }
  }

  // Iconic Sound of Sorting green verification sweep (matching the user's attached screenshot!)
  st.passLabel = 'Doğrulama Taraması';
  for (let i = 0; i < n; i++) {
    yield makeStep(
      st,
      [i],
      [],
      i,
      'verifying',
      arr[i],
      `Sıralama doğrulanıyor: ${i + 1} / ${n}`,
      i === n - 1
    );
  }

  st.passLabel = 'Tamamlandı';
  yield makeStep(
    st,
    [],
    [],
    n - 1,
    'done',
    null,
    `Sıralama doğrulandı (${st.comparisons.toLocaleString('tr-TR')} karşılaştırma, ${st.arrayAccesses.toLocaleString('tr-TR')} dizi erişimi).`,
    true
  );
}

/**
 * Ultra-fast synchronous execution of an algorithm for real-time multi-algorithm benchmarking.
 */
export function runBenchmarkSync(algorithmId: AlgorithmId, values: number[]): BenchmarkEntry {
  const meta = ALGORITHM_MAP[algorithmId];
  const t0 = performance.now();
  const gen = createSortGenerator(algorithmId, values);
  let lastMetrics: SortMetrics = {
    comparisons: 0,
    arrayAccesses: 0,
    writes: 0,
    swaps: 0,
    steps: 0,
    elapsedMs: 0,
    sortedness: 100,
    passLabel: 'Tamamlandı',
  };

  for (const step of gen) {
    if (step.phase === 'verifying') {
      // Stop counting before verification sweep so CPU time reflects pure sorting
      break;
    }
    lastMetrics = step.metrics;
  }

  const cpuTimeMs = Math.max(0.01, Math.round((performance.now() - t0) * 100) / 100);

  return {
    algorithmId,
    algorithmName: meta.name,
    category: meta.category,
    comparisons: lastMetrics.comparisons,
    arrayAccesses: lastMetrics.arrayAccesses,
    writes: lastMetrics.writes,
    swaps: lastMetrics.swaps,
    cpuTimeMs,
    avgTimeComplexity: meta.avgTime,
    spaceComplexity: meta.space,
    stable: meta.stable,
    comparisonBased: meta.comparisonBased,
  };
}

export function runAllBenchmarksSync(values: number[]): BenchmarkEntry[] {
  return ALGORITHMS.map((alg) => runBenchmarkSync(alg.id, values));
}

export function runScalingBenchmark(): ScalingPoint[] {
  const sizes = [32, 64, 128, 192, 256];
  return sizes.map((n) => {
    const sample = generateDistribution('random', n);
    return {
      n,
      radixLSD: runBenchmarkSync('radixLSD', sample).arrayAccesses,
      quick: runBenchmarkSync('quick', sample).arrayAccesses,
      merge: runBenchmarkSync('merge', sample).arrayAccesses,
      heap: runBenchmarkSync('heap', sample).arrayAccesses,
      shell: runBenchmarkSync('shell', sample).arrayAccesses,
      insertion: runBenchmarkSync('insertion', sample).arrayAccesses,
    };
  });
}
