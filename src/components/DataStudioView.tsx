import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Play,
  Upload,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DatasetProfile, DistributionType } from '../types/algorithm';
import {
  buildHistogram,
  computeDatasetStats,
  createDatasetProfile,
  DISTRIBUTION_LABELS,
  generateDistribution,
  parseCsvColumns,
  parseCustomNumberText,
} from '../utils/datasetUtils';

interface DataStudioViewProps {
  currentDataset: DatasetProfile;
  isDark: boolean;
  onApplyDataset: (profile: DatasetProfile, target: 'simulation' | 'analytics') => void;
}

const SAMPLE_DATASETS: { label: string; description: string; values: number[] }[] = [
  {
    label: 'Borsa Günlük Değişimleri (48)',
    description: 'Pozitif ve negatif ondalıklı finansal seri',
    values: [
      2.4, -1.8, 0.5, 4.1, -3.2, 1.9, 0.2, -0.7, 5.6, -2.1, 3.3, -4.5, 1.1, 2.8, -0.9, 0.0,
      3.9, -1.4, 2.2, -2.8, 4.7, -0.3, 1.5, -3.9, 6.1, -1.1, 0.8, -2.4, 3.0, -0.6, 1.7, 2.9,
      -5.1, 4.4, -1.6, 0.9, 2.1, -3.5, 1.3, 3.7, -0.4, 2.6, -2.0, 5.2, -1.2, 0.6, -3.0, 4.0,
    ],
  },
  {
    label: 'Sensör Sıcaklıkları °C (64)',
    description: 'Dar aralıkta kümelenmiş IoT telemetri ölçümleri',
    values: [
      22.4, 23.1, 21.8, 24.5, 22.9, 25.2, 23.4, 21.2, 26.8, 22.7, 23.0, 24.1, 21.9, 22.5, 25.9, 23.8,
      20.6, 22.1, 24.8, 23.3, 22.6, 27.4, 21.5, 23.9, 22.8, 24.0, 23.2, 21.7, 26.1, 22.3, 24.4, 23.5,
      22.0, 25.5, 23.7, 21.4, 24.9, 22.2, 23.6, 28.1, 21.6, 24.3, 22.9, 23.1, 25.0, 22.4, 23.8, 21.1,
      24.6, 22.7, 23.4, 26.3, 21.8, 24.2, 23.0, 22.5, 25.4, 23.3, 21.9, 24.7, 22.6, 23.9, 25.1, 22.8,
    ],
  },
  {
    label: 'Sınav Puanları (60)',
    description: 'Tekrarlı tamsayı puan dağılımı (0–100)',
    values: [
      78, 92, 65, 84, 71, 55, 88, 95, 62, 74, 81, 68, 90, 45, 76, 85, 72, 60, 94, 79,
      83, 67, 58, 91, 75, 86, 64, 70, 89, 52, 77, 82, 69, 96, 61, 73, 87, 66, 80, 50,
      74, 85, 63, 93, 71, 78, 84, 59, 90, 76, 68, 88, 54, 81, 72, 95, 67, 79, 83, 65,
    ],
  },
  {
    label: 'Ağ Gecikmesi ms (40)',
    description: 'Neredeyse sıralı + ani gecikme sıçramaları',
    values: [
      12, 13, 14, 15, 98, 16, 17, 19, 18, 20, 21, 22, 145, 24, 25, 26, 27, 28, 29, 31,
      30, 32, 210, 34, 35, 36, 38, 37, 39, 41, 40, 42, 43, 178, 45, 46, 48, 47, 49, 51,
    ],
  },
];

export function DataStudioView({
  currentDataset,
  isDark,
  onApplyDataset,
}: DataStudioViewProps) {
  const [rawInput, setRawInput] = useState<string>(currentDataset.values.slice(0, 96).join(', '));
  const [datasetTitle, setDatasetTitle] = useState<string>(
    currentDataset.source === 'custom' ? currentDataset.label : 'Özel Test Veri Seti'
  );
  const [csvColumns, setCsvColumns] = useState<{ name: string; index: number; values: number[] }[]>([]);
  const [selectedCsvCol, setSelectedCsvCol] = useState<number>(0);
  const [genSize, setGenSize] = useState<number>(128);
  const [genDist, setGenDist] = useState<Exclude<DistributionType, 'custom'>>('gaussian');
  const [uploadFilename, setUploadFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parsed = useMemo(() => parseCustomNumberText(rawInput), [rawInput]);
  const previewStats = useMemo(() => computeDatasetStats(parsed.values), [parsed.values]);
  const histogram = useMemo(() => buildHistogram(parsed.values, 14), [parsed.values]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      if (file.name.toLowerCase().endsWith('.csv')) {
        const { numericColumns } = parseCsvColumns(content);
        if (numericColumns.length > 0) {
          setCsvColumns(numericColumns);
          setSelectedCsvCol(0);
          setRawInput(numericColumns[0].values.join(', '));
          setDatasetTitle(`${file.name.replace(/\.csv$/i, '')} (${numericColumns[0].name})`);
          return;
        }
      }
      setCsvColumns([]);
      setRawInput(content);
      setDatasetTitle(file.name.replace(/\.(txt|json|csv)$/i, ''));
    };
    reader.readAsText(file);
  };

  const handleSelectCsvCol = (idx: number) => {
    setSelectedCsvCol(idx);
    const col = csvColumns[idx];
    if (col) {
      setRawInput(col.values.join(', '));
      setDatasetTitle(
        `${(uploadFilename ?? 'CSV').replace(/\.csv$/i, '')} (${col.name})`
      );
    }
  };

  const handleGenerateIntoEditor = () => {
    const vals = generateDistribution(genDist, genSize);
    setCsvColumns([]);
    setUploadFilename(null);
    setRawInput(vals.join(', '));
    setDatasetTitle(`${DISTRIBUTION_LABELS[genDist]} (${genSize})`);
  };

  const handleCommit = (target: 'simulation' | 'analytics') => {
    if (parsed.values.length < 4) return;
    const profile = createDatasetProfile(
      parsed.values,
      'custom',
      datasetTitle.trim() || 'Özel Kullanıcı Verisi'
    );
    onApplyDataset(profile, target);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl [text-wrap:balance]">
          Özel Veri Test Stüdyosu
        </h1>
        <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
          Kendi sayısal verilerinizi yazın, CSV/JSON dosyası yükleyin veya istatistiksel dağılım üretip tüm algoritmalarla gerçek zamanlı test edin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Input, File Upload & Generator */}
        <div className="space-y-5 lg:col-span-7">
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                Manuel Veri Girişi ve Dosya İçe Aktarma
              </h2>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-secondary-container)] px-4 py-2 text-xs font-medium text-[var(--md-sys-color-on-secondary-container)] transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>CSV / JSON / TXT Yükle</span>
                </button>
              </div>
            </div>

            {/* Dataset Name Input */}
            <div>
              <label
                htmlFor="dataset-title"
                className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]"
              >
                Veri Seti Etiketi (Raporlarda görünür)
              </label>
              <input
                id="dataset-title"
                type="text"
                value={datasetTitle}
                onChange={(e) => setDatasetTitle(e.target.value)}
                placeholder="Örn: Q4 Sensör Ölçümleri"
                className="m3-focus mt-1.5 w-full rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3.5 py-2.5 text-sm text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            {/* CSV Column Picker if CSV has multiple numeric columns */}
            {csvColumns.length > 1 && (
              <div className="rounded-xl bg-[var(--md-sys-color-surface-container-low)] p-3.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--md-sys-color-on-surface)]">
                  <FileSpreadsheet className="h-4 w-4 text-[var(--md-sys-color-primary)]" aria-hidden="true" />
                  <span>{uploadFilename} içindeki sayısal sütunu seçin:</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {csvColumns.map((col, idx) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleSelectCsvCol(idx)}
                      className={`m3-focus rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        selectedCsvCol === idx
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                          : 'bg-[var(--md-sys-color-surface-container-lowest)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]'
                      }`}
                    >
                      {col.name} ({col.values.length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
                <label htmlFor="raw-data-textarea">
                  Sayısal Değerler (virgül, boşluk, satır sonu veya JSON dizisi — maks. 1024)
                </label>
                <span className="font-mono-tabular">
                  {parsed.values.length} geçerli değer
                </span>
              </div>
              <textarea
                id="raw-data-textarea"
                rows={6}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Örn: 42, 17, 93, 8, 56, 21, 88, 14..."
                className="m3-focus w-full rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5 font-mono-tabular text-xs leading-relaxed text-[var(--md-sys-color-on-surface)]"
              />
            </div>

            {/* Validation Status (Icon + Explicit Text, never hue-only) */}
            {parsed.error ? (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--md-sys-color-error-container)] px-3.5 py-2.5 text-xs font-medium text-[var(--md-sys-color-on-error-container)]">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{parsed.error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--md-sys-color-tertiary-container)] px-3.5 py-2.5 text-xs font-medium text-[var(--md-sys-color-on-tertiary-container)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Veri doğrulandı: {previewStats.count} eleman ({previewStats.hasDecimals ? 'ondalıklı' : 'tamsayı'}
                  {previewStats.hasNegatives ? ', negatif değerler içeriyor' : ''}) simülasyona hazır.
                </span>
              </div>
            )}

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={parsed.values.length < 4}
                onClick={() => handleCommit('simulation')}
                className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-primary)] px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-primary)] transition-transform duration-150 hover:opacity-95 active:scale-[0.98] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>Simülasyonda Test Et</span>
              </button>

              <button
                type="button"
                disabled={parsed.values.length < 4}
                onClick={() => handleCommit('analytics')}
                className="m3-focus inline-flex items-center gap-2 rounded-full bg-[var(--md-sys-color-secondary-container)] px-5 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-secondary-container)] transition-opacity hover:opacity-90 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                <span>11 Algoritmayla Kıyasla</span>
              </button>
            </div>
          </div>

          {/* Ready-made Real-World Sample Datasets & Synthetic Generator */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 space-y-5">
            <div>
              <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
                Hazır Gerçek Dünya Örnekleri
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SAMPLE_DATASETS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setCsvColumns([]);
                      setUploadFilename(null);
                      setRawInput(sample.values.join(', '));
                      setDatasetTitle(sample.label);
                    }}
                    className="m3-focus rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5 text-left transition-colors hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                  >
                    <div className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                      {sample.label}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      {sample.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--md-sys-color-outline-variant)] pt-4">
              <h3 className="font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                Sentetik Dağılım Üreteci
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
                <div>
                  <label htmlFor="studio-dist" className="block text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Dağılım Tipi
                  </label>
                  <select
                    id="studio-dist"
                    value={genDist}
                    onChange={(e) => setGenDist(e.target.value as Exclude<DistributionType, 'custom'>)}
                    className="m3-focus w-full rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-3 py-2 text-sm text-[var(--md-sys-color-on-surface)] cursor-pointer"
                  >
                    {(Object.keys(DISTRIBUTION_LABELS) as DistributionType[])
                      .filter((k) => k !== 'custom')
                      .map((k) => (
                        <option key={k} value={k}>
                          {DISTRIBUTION_LABELS[k]}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    <label htmlFor="studio-size">Boyut (N)</label>
                    <span className="font-mono-tabular font-semibold text-[var(--md-sys-color-primary)]">
                      {genSize}
                    </span>
                  </div>
                  <input
                    id="studio-size"
                    type="range"
                    min={16}
                    max={512}
                    step={16}
                    value={genSize}
                    onChange={(e) => setGenSize(Number(e.target.value))}
                    className="m3-slider my-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateIntoEditor}
                  className="m3-focus rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] px-4 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface)] transition-colors hover:bg-[var(--md-sys-color-surface-container)] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Editöre Üret
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Statistical Profile & Distribution Histogram */}
        <div className="space-y-5 lg:col-span-5">
          {/* Statistical Summary */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
            <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
              Canlı İstatistiksel Profil
            </h2>
            <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Düzenlediğiniz veri seti anlık olarak analiz edilir
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--md-sys-color-outline-variant)] pt-4">
              <div>
                <dt className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Eleman Sayısı</dt>
                <dd className="mt-0.5 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
                  {previewStats.count}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Başlangıç Düzensizliği</dt>
                <dd className="mt-0.5 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-primary)]">
                  %{previewStats.disorderPct.toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Minimum / Maksimum</dt>
                <dd className="mt-0.5 font-mono-tabular text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  {previewStats.min} / {previewStats.max}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Ortalama / Medyan</dt>
                <dd className="mt-0.5 font-mono-tabular text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  {previewStats.mean} / {previewStats.median}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Standart Sapma (σ)</dt>
                <dd className="mt-0.5 font-mono-tabular text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  {previewStats.stdDev}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Benzersiz / Tekrarlı</dt>
                <dd className="mt-0.5 font-mono-tabular text-sm font-medium text-[var(--md-sys-color-on-surface)]">
                  {previewStats.uniqueCount} / {previewStats.duplicateCount}
                </dd>
              </div>
            </dl>
          </div>

          {/* Interactive Distribution Histogram */}
          <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5">
            <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
              Frekans Dağılım Histogramı
            </h2>
            <p className="mt-0.5 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Değer aralıklarına göre eleman yoğunluğu
            </p>

            <div className="mt-4 h-[230px] w-full">
              {histogram.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram} margin={{ top: 8, right: 8, left: -12, bottom: 20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#2e3542' : '#e1e7f0'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 10, fill: isDark ? '#b8bfcc' : '#44474e' }}
                      angle={-28}
                      textAnchor="end"
                      interval={0}
                      height={46}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: isDark ? '#b8bfcc' : '#44474e' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#171b22' : '#ffffff',
                        borderColor: isDark ? '#2e3542' : '#d5dce6',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#e3e7ef' : '#181c22',
                      }}
                      formatter={(val: unknown) => [`${val} eleman`, 'Frekans']}
                    />
                    <Bar
                      dataKey="count"
                      fill={isDark ? '#a8c7fa' : '#0b57d0'}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-[var(--md-sys-color-surface-container-low)] text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  Histogram için geçerli sayısal değerler girin.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
