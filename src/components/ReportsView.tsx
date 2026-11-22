import { useMemo, useState } from 'react';
import {
  Camera,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Globe,
  Printer,
  Trash2,
} from 'lucide-react';
import { BenchmarkEntry, DatasetProfile, SimulationRun } from '../types/algorithm';
import { deriveReportInsights } from '../utils/reportExporter';

interface ReportsViewProps {
  runs: SimulationRun[];
  benchmarks: BenchmarkEntry[];
  dataset: DatasetProfile;
  onExportHtml: (selectedRun: SimulationRun | null) => void;
  onExportCsv: () => void;
  onExportJson: (selectedRun: SimulationRun | null) => void;
  onExportMarkdown: (selectedRun: SimulationRun | null) => void;
  onExportPng: () => void;
  onClearHistory: () => void;
}

export function ReportsView({
  runs,
  benchmarks,
  dataset,
  onExportHtml,
  onExportCsv,
  onExportJson,
  onExportMarkdown,
  onExportPng,
  onClearHistory,
}: ReportsViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(runs[0]?.id ?? null);

  const selectedRun = useMemo(() => {
    if (runs.length === 0) return null;
    return runs.find((r) => r.id === selectedRunId) ?? runs[0];
  }, [runs, selectedRunId]);

  const insights = useMemo(
    () => deriveReportInsights(selectedRun, benchmarks, dataset),
    [selectedRun, benchmarks, dataset]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)] sm:text-3xl [text-wrap:balance]">
            Detaylı Analitik Rapor Merkezi
          </h1>
          <p className="mt-1 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            Simülasyon geçmişinizi inceleyin ve tüm ölçümleri HTML/PDF, Excel uyumlu CSV, JSON, Markdown veya PNG formatlarında indirin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="m3-focus inline-flex items-center gap-2 rounded-full border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] px-4 py-2 text-sm font-medium text-[var(--md-sys-color-on-surface)] transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          <span>Yazdır / PDF Kaydet</span>
        </button>
      </div>

      {/* Download Format Action Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => onExportHtml(selectedRun)}
          className="m3-focus flex flex-col items-start gap-2 rounded-2xl border border-[var(--md-sys-color-primary)]/35 bg-[var(--md-sys-color-primary-container)]/50 p-4 text-left transition-transform duration-150 hover:scale-[1.01] cursor-pointer"
        >
          <Globe className="h-5 w-5 text-[var(--md-sys-color-primary)]" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              HTML / PDF Rapor
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              SVG grafikli tam rapor (.html)
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          className="m3-focus flex flex-col items-start gap-2 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-4 text-left transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] cursor-pointer"
        >
          <FileSpreadsheet className="h-5 w-5 text-[var(--md-sys-color-tertiary)]" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              CSV Veri Tablosu
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Excel & Sheets UTF-8 (.csv)
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onExportJson(selectedRun)}
          className="m3-focus flex flex-col items-start gap-2 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-4 text-left transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] cursor-pointer"
        >
          <FileCode2 className="h-5 w-5 text-[var(--md-sys-color-primary)]" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              JSON Telemetri
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Ham zaman serisi verisi (.json)
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onExportMarkdown(selectedRun)}
          className="m3-focus flex flex-col items-start gap-2 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-4 text-left transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] cursor-pointer"
        >
          <FileText className="h-5 w-5 text-[var(--md-sys-color-secondary)]" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              Markdown Özeti
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Dokümantasyon uyumlu (.md)
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onExportPng}
          className="m3-focus flex flex-col items-start gap-2 rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-4 text-left transition-colors hover:bg-[var(--md-sys-color-surface-container-low)] cursor-pointer"
        >
          <Camera className="h-5 w-5 text-[var(--md-sys-color-on-surface-variant)]" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              Tuval Ekran Görüntüsü
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Yüksek çözünürlüklü (.png)
            </div>
          </div>
        </button>
      </div>

      {/* Two-Column: Run History & Structured Report Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Run History List */}
        <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-5 lg:col-span-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
            <h2 className="font-display text-base font-semibold text-[var(--md-sys-color-on-surface)]">
              Çalıştırma Geçmişi ({runs.length})
            </h2>
            {runs.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="m3-focus inline-flex items-center gap-1 text-xs font-medium text-[var(--md-sys-color-error)] hover:underline cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Temizle</span>
              </button>
            )}
          </div>

          {runs.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--md-sys-color-on-surface-variant)]">
              Henüz tamamlanmış simülasyon kaydı yok. Simülasyon sekmesinde bir sıralama tamamladığınızda otomatik olarak buraya kaydedilir.
            </div>
          ) : (
            <ul className="mt-3 space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {runs.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                const dateStr = new Date(run.timestamp).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRunId(run.id)}
                      className={`m3-focus w-full rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/35'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                          {run.algorithmName}
                        </span>
                        <span className="font-mono-tabular text-[11px] text-[var(--md-sys-color-on-surface-variant)] shrink-0">
                          {dateStr}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                        {run.datasetLabel} · N={run.arraySize}
                      </div>
                      <div className="mt-2 flex items-center gap-3 font-mono-tabular text-xs text-[var(--md-sys-color-on-surface)]">
                        <span>{run.comparisons.toLocaleString('tr-TR')} karş.</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[var(--md-sys-color-primary)]">
                          {run.arrayAccesses.toLocaleString('tr-TR')} erişim
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Live Report Document Preview */}
        <div className="rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] p-6 space-y-6 lg:col-span-8">
          <div className="border-b border-[var(--md-sys-color-outline-variant)] pb-4">
            <div className="text-xs font-medium text-[var(--md-sys-color-primary)]">
              Rapor Önizleme
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-[var(--md-sys-color-on-surface)]">
              Algoritma Performans ve Analitik Özeti
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)]">
              <span>Veri Seti: {dataset.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">N = {dataset.stats.count}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                Aralık [{dataset.stats.min}, {dataset.stats.max}]
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">Düzensizlik %{dataset.stats.disorderPct}</span>
            </div>
          </div>

          {/* Selected Simulation Run Breakdown */}
          {selectedRun && (
            <div>
              <h3 className="font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
                Seçili Simülasyon Kaydı: {selectedRun.algorithmName}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-4 rounded-xl bg-[var(--md-sys-color-surface-container-low)] p-4 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Karşılaştırma</div>
                  <div className="mt-1 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
                    {selectedRun.comparisons.toLocaleString('tr-TR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Dizi Erişimi</div>
                  <div className="mt-1 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-primary)]">
                    {selectedRun.arrayAccesses.toLocaleString('tr-TR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Yazma / Takas</div>
                  <div className="mt-1 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
                    {selectedRun.writes.toLocaleString('tr-TR')} / {selectedRun.swaps.toLocaleString('tr-TR')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Gecikme / Süre</div>
                  <div className="mt-1 font-mono-tabular text-lg font-semibold text-[var(--md-sys-color-on-surface)]">
                    {selectedRun.delayMs.toFixed(1)} ms
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Automated Quantitative Findings */}
          <div>
            <h3 className="font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              Ölçümlere Dayalı Analitik Bulgular
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
              {insights.map((text, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-tabular text-xs font-semibold text-[var(--md-sys-color-primary)] mt-0.5">
                    0{idx + 1}.
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Compact Benchmark Table Inside Report */}
          <div>
            <h3 className="font-display text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-2.5">
              Kıyaslama Özeti (N = {dataset.stats.count})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[var(--md-sys-color-outline-variant)]">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)]">
                    <th className="px-3.5 py-2.5 font-semibold">Algoritma</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Karşılaştırma</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Dizi Erişimi</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Yazma</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Ham Süre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                  {benchmarks.map((b) => (
                    <tr key={b.algorithmId}>
                      <td className="px-3.5 py-2 font-medium text-[var(--md-sys-color-on-surface)]">
                        {b.algorithmName}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-tabular">
                        {b.comparisons.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-tabular font-semibold text-[var(--md-sys-color-primary)]">
                        {b.arrayAccesses.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-tabular">
                        {b.writes.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono-tabular">
                        {b.cpuTimeMs.toFixed(2)} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
