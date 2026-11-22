import { useMemo, useState } from 'react';
import { ArrowUpDown, Play, RefreshCw, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlgorithmId,
  BenchmarkEntry,
  DatasetProfile,
  ScalingPoint,
  TelemetryPoint,
} from '../types/algorithm';

interface AnalyticsViewProps {
  dataset: DatasetProfile;
  activeAlgorithmId: AlgorithmId;
  telemetry: TelemetryPoint[];
  benchmarks: BenchmarkEntry[];
  scalingData: ScalingPoint[];
  isDark: boolean;
  onRunBenchmarks: () => void;
  onRunScalingTest: () => void;
  onSimulateAlgorithm: (id: AlgorithmId) => void;
}

type MetricKey = 'arrayAccesses' | 'comparisons' | 'writes' | 'swaps' | 'cpuTimeMs';

const METRIC_LABELS: Record<MetricKey, string> = {
  arrayAccesses: 'Dizi Erişimi',
  comparisons: 'Karşılaştırma',
  writes: 'Yazma İşlemi',
  swaps: 'Takas',
  cpuTimeMs: 'Ham Süre (ms)',
};

export function AnalyticsView({
  dataset,
  activeAlgorithmId,
  telemetry,
  benchmarks,
  scalingData,
  isDark,
  onRunBenchmarks,
  onRunScalingTest,
  onSimulateAlgorithm,
}: AnalyticsViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('arrayAccesses');
  const [useLogScale, setUseLogScale] = useState<boolean>(false);
  const [groupFilter, setGroupFilter] = useState<'all' | 'classic' | 'humor' | 'custom'>('all');
  const [sortCol, setSortCol] = useState<MetricKey>('arrayAccesses');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filteredBenchmarks = useMemo(() => {
    if (groupFilter === 'classic') {
      return benchmarks.filter((b) => b.category !== 'Mizahi / Egzotik' && b.category !== 'Custom');
    }
    if (groupFilter === 'humor') {
      return benchmarks.filter((b) => b.category === 'Mizahi / Egzotik');
    }
    if (groupFilter === 'custom') {
      return benchmarks.filter((b) => b.category === 'Custom');
    }
    return benchmarks;
  }, [benchmarks, groupFilter]);

  const sortedBenchmarks = useMemo(() => {
    return [...filteredBenchmarks].sort((a, b) => {
      const diff = a[sortCol] - b[sortCol];
      return sortAsc ? diff : -diff;
    });
  }, [filteredBenchmarks, sortCol, sortAsc]);

  const chartData = useMemo(() => {
    return [...filteredBenchmarks]
      .sort((a, b) => a[selectedMetric] - b[selectedMetric])
      .map((item) => ({
        ...item,
        shortName: item.algorithmName.replace(/\s*\([^)]*\)/g, ''),
        plotValue: useLogScale ? Math.max(0.5, item[selectedMetric]) : item[selectedMetric],
      }));
  }, [filteredBenchmarks, selectedMetric, useLogScale]);

  const validBenchmarks = useMemo(
    () => benchmarks.filter((b) => !b.capped && b.survivingCount === undefined),
    [benchmarks]
  );

  const topFastest = useMemo(() => {
    if (validBenchmarks.length === 0) return null;
    return [...validBenchmarks].sort((a, b) => a.cpuTimeMs - b.cpuTimeMs)[0];
  }, [validBenchmarks]);

  const topLowestAccess = useMemo(() => {
    if (validBenchmarks.length === 0) return null;
    return [...validBenchmarks].sort((a, b) => a.arrayAccesses - b.arrayAccesses)[0];
  }, [validBenchmarks]);

  const handleSort = (key: MetricKey) => {
    if (sortCol === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Benchmark Trigger */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl [text-wrap:balance]">
            Gerçek Zamanlı Analitik ve Kıyaslama
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <span>Veri Seti: {dataset.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">N = {dataset.stats.count}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">Düzensizlik %{dataset.stats.disorderPct}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRunBenchmarks}
            className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-4 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] transition-transform duration-150 hover:opacity-95 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Tümünü Yeniden Ölç ({benchmarks.length})</span>
          </button>

          <button
            type="button"
            onClick={onRunScalingTest}
            className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-secondary-container)] px-4 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-secondary-container)] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span>Büyüme Eğrisini Hesapla</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Row (Single elevation, crisp dividers) */}
      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-[var(--md-sys-color-outline-variant)]">
          <div className="lg:pr-4">
            <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              En Az Dizi Erişimi
            </div>
            <div className="mt-1 font-display text-lg font-semibold text-[var(--md-sys-color-primary)]">
              {topLowestAccess ? topLowestAccess.algorithmName : '—'}
            </div>
            <div className="font-mono-tabular text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {topLowestAccess ? `${topLowestAccess.arrayAccesses.toLocaleString('tr-TR')} erişim` : 'Ölçüm bekleniyor'}
            </div>
          </div>

          <div className="lg:px-4">
            <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              En Hızlı Ham Süre
            </div>
            <div className="mt-1 font-display text-lg font-semibold text-[var(--md-sys-color-tertiary)]">
              {topFastest ? topFastest.algorithmName : '—'}
            </div>
            <div className="font-mono-tabular text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {topFastest ? `${topFastest.cpuTimeMs.toFixed(2)} ms` : 'Ölçüm bekleniyor'}
            </div>
          </div>

          <div className="lg:px-4">
            <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              Karşılaştırmasız Liderler
            </div>
            <div className="mt-1 font-display text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
              Radix LSD & Counting
            </div>
            <div className="font-mono-tabular text-xs text-[var(--md-sys-color-on-surface-variant)]">
              0 karşılaştırma ile doğrusal tarama
            </div>
          </div>

          <div className="lg:pl-4">
            <div className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
              Veri Karakteristiği
            </div>
            <div className="mt-1 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
              %{dataset.stats.sortednessPct.toFixed(1)} sıralı
            </div>
            <div className="font-mono-tabular text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {dataset.stats.uniqueCount} benzersiz · {dataset.stats.duplicateCount} tekrarlı
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Comparative Bar Chart */}
      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
              Çoklu Algoritma Kıyaslama Grafiği — {METRIC_LABELS[selectedMetric]}
            </h2>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Aynı veri seti (N={dataset.stats.count}) üzerinde tüm algoritmaların birebir ölçülen maliyetleri
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Algoritma kategorisi"
              className="inline-flex items-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-0.5"
            >
              {(
                [
                  { id: 'all', label: 'Tümü' },
                  { id: 'classic', label: 'Klasik' },
                  { id: 'humor', label: 'Mizahi' },
                  { id: 'custom', label: 'Custom' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupFilter(g.id)}
                  className={`m3-focus rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    groupFilter === g.id
                      ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div
              role="group"
              aria-label="Kıyaslama metriği"
              className="inline-flex flex-wrap items-center rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-0.5"
            >
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedMetric(key)}
                  className={`m3-focus rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedMetric === key
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  {METRIC_LABELS[key]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setUseLogScale((v) => !v)}
              className={`m3-focus rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                useLogScale
                  ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                  : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {useLogScale ? 'Logaritmik Ölçek' : 'Doğrusal Ölçek'}
            </button>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 28 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#2e3542' : '#e1e7f0'}
                vertical={false}
              />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                angle={-20}
                textAnchor="end"
                interval={0}
                height={52}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                scale={useLogScale ? 'log' : 'auto'}
                domain={useLogScale ? [0.5, 'auto'] : [0, 'auto']}
                tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#171b22' : '#ffffff',
                  borderColor: isDark ? '#2e3542' : '#d5dce6',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: isDark ? '#e3e7ef' : '#181c22',
                }}
                formatter={(_val, _name, props) => {
                  const raw = (props?.payload as BenchmarkEntry | undefined)?.[selectedMetric] ?? 0;
                  return [
                    selectedMetric === 'cpuTimeMs'
                      ? `${raw.toFixed(2)} ms`
                      : raw.toLocaleString('tr-TR'),
                    METRIC_LABELS[selectedMetric],
                  ];
                }}
              />
              <Bar dataKey="plotValue" radius={[8, 8, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.algorithmId}
                    fill={
                      entry.algorithmId === activeAlgorithmId
                        ? isDark
                          ? '#6dd58c'
                          : '#146c2e'
                        : isDark
                          ? '#a8c7fa'
                          : '#0b57d0'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Secondary Interactive Charts: Scaling Growth & Live Convergence */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Empirical Big-O Scaling Curve */}
        <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
          <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
            Empirik Ölçeklenme Eğrisi (Dizi Erişimi / N)
          </h2>
          <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Veri boyutu N=32&apos;den N=256&apos;ya büyürken erişim maliyetinin artış hızı
          </p>

          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scalingData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#2e3542' : '#e1e7f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="n"
                  tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                  tickFormatter={(v) => `N=${v}`}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#171b22' : '#ffffff',
                    borderColor: isDark ? '#2e3542' : '#d5dce6',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#e3e7ef' : '#181c22',
                  }}
                  labelFormatter={(l) => `Veri Boyutu N = ${l}`}
                  formatter={(v: unknown) => Number(v).toLocaleString('tr-TR')}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="radixLSD" name="Radix LSD" stroke="#146c2e" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="quick" name="Quick Sort" stroke="#0b57d0" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="merge" name="Merge Sort" stroke="#0284c7" strokeWidth={1.8} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="shell" name="Shell Sort" stroke="#d97706" strokeWidth={1.8} dot={{ r: 2.5 }} />
                <Line type="monotone" dataKey="insertion" name="Insertion Sort" stroke="#dc2626" strokeWidth={1.8} strokeDasharray="4 4" dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Convergence / Sortedness Curve from Active Simulation */}
        <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
          <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
            Sıralama Yakınsama Eğrisi (Düzenlilik %)
          </h2>
          <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Son simülasyonda dizinin adım adım %100 sıralı hale yaklaşma grafiği
          </p>

          <div className="mt-4 h-[260px] w-full">
            {telemetry.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetry} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
                    domain={[0, 100]}
                    tickFormatter={(v) => `%${v}`}
                    tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#171b22' : '#ffffff',
                      borderColor: isDark ? '#2e3542' : '#d5dce6',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: isDark ? '#e3e7ef' : '#181c22',
                    }}
                    labelFormatter={(l) => `Adım ${l}`}
                    formatter={(v: unknown) => [`%${Number(v).toFixed(1)}`, 'Düzenlilik']}
                  />
                  <Line
                    type="monotone"
                    dataKey="sortedness"
                    stroke={isDark ? '#6dd58c' : '#146c2e'}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl bg-[var(--md-sys-color-surface-container-low)] px-4 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
                Yakınsama eğrisini görmek için Simülasyon sekmesinde bir algoritma çalıştırın.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sortable Material 3 Data Table */}
      <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)]">
          <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
            Detaylı Algoritma Performans Tablosu
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Sütun başlıklarına tıklayarak sıralayabilir, herhangi bir algoritmayı doğrudan simülasyonda başlatabilirsiniz
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                <th className="px-5 py-3">Algoritma</th>
                <th className="px-3 py-3">Kategori</th>
                {(['comparisons', 'arrayAccesses', 'writes', 'swaps', 'cpuTimeMs'] as MetricKey[]).map(
                  (col) => (
                    <th key={col} className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className="m3-focus inline-flex items-center gap-1 hover:text-[var(--md-sys-color-on-surface)] whitespace-nowrap cursor-pointer"
                      >
                        <span>{METRIC_LABELS[col]}</span>
                        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </th>
                  )
                )}
                <th className="px-3 py-3">Ortalama</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
              {sortedBenchmarks.map((row) => {
                const isCurrent = row.algorithmId === activeAlgorithmId;
                return (
                  <tr
                    key={row.algorithmId}
                    className={`transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] ${
                      isCurrent ? 'bg-[var(--md-sys-color-primary-container)]/25' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-[var(--md-sys-color-on-surface)] whitespace-nowrap">
                      <span>{row.algorithmName}</span>
                      {row.capped && (
                        <span className="ml-2 text-[11px] font-normal text-[var(--md-sys-color-error)]">
                          · Limit (45B adım)
                        </span>
                      )}
                      {row.survivingCount !== undefined && (
                        <span className="ml-2 text-[11px] font-normal text-[var(--md-sys-color-on-surface-variant)]">
                          · {row.survivingCount} eleman kaldı
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--md-sys-color-on-surface-variant)] whitespace-nowrap">
                      {row.category} · {row.stable ? 'Kararlı' : 'Kararsız'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-tabular text-xs">
                      {row.comparisons.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-tabular text-xs font-semibold text-[var(--md-sys-color-primary)]">
                      {row.arrayAccesses.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-tabular text-xs">
                      {row.writes.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-tabular text-xs">
                      {row.swaps.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-3 py-3 text-right font-mono-tabular text-xs">
                      {row.cpuTimeMs.toFixed(2)} ms
                    </td>
                    <td className="px-3 py-3 font-mono-tabular text-xs text-[var(--md-sys-color-on-surface-variant)] whitespace-nowrap">
                      {row.avgTimeComplexity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSimulateAlgorithm(row.algorithmId)}
                        className="m3-focus inline-flex items-center gap-1 rounded-full bg-[var(--md-sys-color-secondary-container)] px-3 py-1 text-xs font-medium text-[var(--md-sys-color-on-secondary-container)] transition-opacity hover:opacity-90 whitespace-nowrap cursor-pointer"
                      >
                        <Play className="h-3 w-3" aria-hidden="true" />
                        <span>Simüle Et</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
