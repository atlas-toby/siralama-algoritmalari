import { ALGORITHM_MAP } from '../algorithms/sortingEngine';
import { BenchmarkEntry, DatasetProfile, SimulationRun } from '../types/algorithm';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

function escapeCsvCell(val: string | number | boolean): string {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function deriveReportInsights(
  run: SimulationRun | null,
  benchmarks: BenchmarkEntry[],
  dataset: DatasetProfile
): string[] {
  const insights: string[] = [];

  if (run) {
    const meta = ALGORITHM_MAP[run.algorithmId];
    if (run.comparisons === 0 && !meta.comparisonBased) {
      insights.push(
        `${run.algorithmName}, karşılaştırmasız dağıtım yapısı sayesinde 0 karşılaştırma ile ${run.arrayAccesses.toLocaleString('tr-TR')} dizi erişiminde sıralamayı tamamladı.`
      );
    } else {
      const accessPerComp =
        run.comparisons > 0 ? (run.arrayAccesses / run.comparisons).toFixed(2) : '0';
      insights.push(
        `${run.algorithmName} çalıştırmasında karşılaştırma başına ortalama ${accessPerComp} dizi erişimi ve toplam ${run.writes.toLocaleString('tr-TR')} yazma işlemi kaydedildi.`
      );
    }
  }

  if (benchmarks.length > 0) {
    const byAccess = [...benchmarks].sort((a, b) => a.arrayAccesses - b.arrayAccesses);
    const byWrites = [...benchmarks].sort((a, b) => a.writes - b.writes);
    const byTime = [...benchmarks].sort((a, b) => a.cpuTimeMs - b.cpuTimeMs);

    insights.push(
      `Bu veri setinde (N=${dataset.stats.count}, düzensizlik %${dataset.stats.disorderPct}) en az dizi erişimini ${byAccess[0].algorithmName} (${byAccess[0].arrayAccesses.toLocaleString('tr-TR')} erişim) sağladı.`
    );
    insights.push(
      `En düşük yazma maliyeti ${byWrites[0].algorithmName} (${byWrites[0].writes.toLocaleString('tr-TR')} yazma), en hızlı ham yürütme süresi ise ${byTime[0].algorithmName} (${byTime[0].cpuTimeMs.toFixed(2)} ms) ile elde edildi.`
    );
  }

  if (dataset.stats.disorderPct < 20) {
    insights.push(
      `Veri seti yüksek başlangıç düzenliliğine (%${dataset.stats.sortednessPct}) sahip olduğundan Tim Sort ve Insertion Sort gibi uyarlanabilir algoritmalar üstün verimlilik gösterir.`
    );
  } else if (dataset.stats.duplicateCount > dataset.stats.count * 0.4) {
    insights.push(
      `Veri setinde %${Math.round((dataset.stats.duplicateCount / dataset.stats.count) * 100)} oranında tekrarlı değer bulunuyor; Counting Sort ve Radix Sort kararlı sıralama için avantaj sağlar.`
    );
  }

  return insights;
}

export function exportReportCsv(
  runs: SimulationRun[],
  benchmarks: BenchmarkEntry[],
  dataset: DatasetProfile
): string {
  const lines: string[] = [];

  lines.push('BÖLÜM,PARAMETRE / ALGORİTMA,KARŞILAŞTIRMA,DİZİ ERİŞİMİ,YAZMA,TAKAS,SÜRE (ms),KARMAŞIKLIK,KARARLI');
  lines.push(
    [
      'Veri Seti Özeti',
      `${dataset.label} (N=${dataset.stats.count} | Min=${dataset.stats.min} | Maks=${dataset.stats.max} | Ort=${dataset.stats.mean})`,
      '',
      '',
      '',
      '',
      '',
      `Düzensizlik %${dataset.stats.disorderPct}`,
      '',
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  for (const b of benchmarks) {
    lines.push(
      [
        'Kıyaslama',
        b.algorithmName,
        b.comparisons,
        b.arrayAccesses,
        b.writes,
        b.swaps,
        b.cpuTimeMs.toFixed(2),
        b.avgTimeComplexity,
        b.stable ? 'Evet' : 'Hayır',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const r of runs) {
    lines.push(
      [
        'Simülasyon Geçmişi',
        `${r.algorithmName} (${r.datasetLabel}, N=${r.arraySize})`,
        r.comparisons,
        r.arrayAccesses,
        r.writes,
        r.swaps,
        r.durationMs.toFixed(1),
        `${r.delayMs} ms gecikme`,
        ALGORITHM_MAP[r.algorithmId].stable ? 'Evet' : 'Hayır',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  // UTF-8 BOM for clean Turkish character rendering in Excel/Numbers/Sheets
  const bom = '\uFEFF';
  const filename = `siralab_analitik_rapor_${safeTimestamp()}.csv`;
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  triggerBlobDownload(blob, filename);
  return filename;
}

export function exportReportJson(
  activeRun: SimulationRun | null,
  runs: SimulationRun[],
  benchmarks: BenchmarkEntry[],
  dataset: DatasetProfile
): string {
  const payload = {
    raporOlusturmaTarihi: new Date().toISOString(),
    platform: 'SıraLab Analitik Raporlama',
    veriSeti: {
      etiket: dataset.label,
      kaynak: dataset.source,
      istatistikler: dataset.stats,
      ornekDegerler: dataset.values.slice(0, 128),
    },
    seciliCalistirma: activeRun,
    bulgular: deriveReportInsights(activeRun, benchmarks, dataset),
    cokluAlgoritmaKiyaslama: benchmarks,
    calistirmaGecmisi: runs,
  };

  const filename = `siralab_teknik_rapor_${safeTimestamp()}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerBlobDownload(blob, filename);
  return filename;
}

export function exportReportMarkdown(
  activeRun: SimulationRun | null,
  benchmarks: BenchmarkEntry[],
  dataset: DatasetProfile
): string {
  const insights = deriveReportInsights(activeRun, benchmarks, dataset);
  const nowStr = new Date().toLocaleString('tr-TR');

  const md: string[] = [
    `# SıraLab — Algoritma Performans ve Analitik Raporu`,
    ``,
    `**Oluşturulma Tarihi:** ${nowStr}  `,
    `**Veri Seti:** ${dataset.label} (N = ${dataset.stats.count})  `,
    `**Değer Aralığı:** ${dataset.stats.min} – ${dataset.stats.max} | **Ortalama:** ${dataset.stats.mean} | **Medyan:** ${dataset.stats.median} | **Düzensizlik:** %${dataset.stats.disorderPct}`,
    ``,
    `## Öne Çıkan Analitik Bulgular`,
    ...insights.map((item) => `- ${item}`),
    ``,
  ];

  if (activeRun) {
    md.push(
      `## Seçili Simülasyon Özeti: ${activeRun.algorithmName}`,
      ``,
      `| Metrik | Değer |`,
      `| --- | ---: |`,
      `| Karşılaştırma Sayısı | ${activeRun.comparisons.toLocaleString('tr-TR')} |`,
      `| Dizi Erişim Sayısı | ${activeRun.arrayAccesses.toLocaleString('tr-TR')} |`,
      `| Yazma İşlemi | ${activeRun.writes.toLocaleString('tr-TR')} |`,
      `| Takas (Swap) Sayısı | ${activeRun.swaps.toLocaleString('tr-TR')} |`,
      `| Simülasyon Gecikmesi | ${activeRun.delayMs} ms |`,
      `| Toplam Simülasyon Süresi | ${activeRun.durationMs.toFixed(1)} ms |`,
      ``
    );
  }

  if (benchmarks.length > 0) {
    md.push(
      `## Çoklu Algoritma Kıyaslama Tablosu (N = ${dataset.stats.count})`,
      ``,
      `| Algoritma | Kategori | Karşılaştırma | Dizi Erişimi | Yazma | Takas | Ham Süre (ms) | Karmaşıklık |`,
      `| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |`
    );
    for (const b of benchmarks) {
      md.push(
        `| ${b.algorithmName} | ${b.category} | ${b.comparisons.toLocaleString('tr-TR')} | ${b.arrayAccesses.toLocaleString('tr-TR')} | ${b.writes.toLocaleString('tr-TR')} | ${b.swaps.toLocaleString('tr-TR')} | ${b.cpuTimeMs.toFixed(2)} | \`${b.avgTimeComplexity}\` |`
      );
    }
    md.push('');
  }

  const filename = `siralab_analitik_rapor_${safeTimestamp()}.md`;
  const blob = new Blob([md.join('\n')], { type: 'text/markdown;charset=utf-8' });
  triggerBlobDownload(blob, filename);
  return filename;
}

export function exportReportHtml(
  activeRun: SimulationRun | null,
  benchmarks: BenchmarkEntry[],
  dataset: DatasetProfile
): string {
  const insights = deriveReportInsights(activeRun, benchmarks, dataset);
  const nowStr = new Date().toLocaleString('tr-TR');
  const maxAccess = Math.max(1, ...benchmarks.map((b) => b.arrayAccesses));

  const svgBars = benchmarks
    .map((b, i) => {
      const y = 16 + i * 32;
      const barW = Math.max(4, Math.round((b.arrayAccesses / maxAccess) * 420));
      const fill = b.algorithmId === activeRun?.algorithmId ? '#0b57d0' : '#4a607c';
      return `
        <g transform="translate(0, ${y})">
          <text x="0" y="15" font-size="12" fill="#181c22" font-family="system-ui, sans-serif">${b.algorithmName}</text>
          <rect x="190" y="3" width="${barW}" height="16" rx="4" fill="${fill}" />
          <text x="${198 + barW}" y="15" font-size="11" fill="#44474e" font-family="monospace">${b.arrayAccesses.toLocaleString('tr-TR')}</text>
        </g>
      `;
    })
    .join('');

  const svgHeight = Math.max(100, benchmarks.length * 32 + 24);

  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>SıraLab Analitik Raporu — ${dataset.label}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #181c22; background: #f8f9fc; margin: 0; padding: 32px; line-height: 1.5; }
    .page { max-width: 960px; margin: 0 auto; background: #ffffff; border: 1px solid #d5dce6; border-radius: 16px; padding: 36px; }
    h1 { font-size: 24px; margin: 0 0 6px; color: #041e49; }
    h2 { font-size: 16px; margin: 28px 0 12px; color: #181c22; border-bottom: 1px solid #e1e7f0; padding-bottom: 6px; }
    .meta { font-size: 13px; color: #44474e; margin-bottom: 24px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .kpi { background: #f1f4f9; border-radius: 12px; padding: 14px; }
    .kpi-label { font-size: 12px; color: #44474e; }
    .kpi-val { font-size: 20px; font-weight: 700; font-family: ui-monospace, monospace; margin-top: 4px; color: #0b57d0; }
    ul { padding-left: 18px; margin: 8px 0; }
    li { margin-bottom: 6px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #e1e7f0; text-align: left; }
    th { background: #f1f4f9; font-weight: 600; color: #181c22; }
    td.num, th.num { text-align: right; font-family: ui-monospace, monospace; }
    .chart-wrap { background: #f8f9fc; border: 1px solid #e1e7f0; border-radius: 12px; padding: 16px; overflow-x: auto; }
    @media print { body { background: #fff; padding: 0; } .page { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <h1>SıraLab — Detaylı Algoritma Analitik Raporu</h1>
    <div class="meta">Tarih: ${nowStr} &middot; Veri Seti: ${dataset.label} &middot; Eleman Sayısı: ${dataset.stats.count} &middot; Başlangıç Düzensizliği: %${dataset.stats.disorderPct}</div>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Eleman Sayısı (N)</div><div class="kpi-val">${dataset.stats.count}</div></div>
      <div class="kpi"><div class="kpi-label">Değer Aralığı</div><div class="kpi-val">${dataset.stats.min} – ${dataset.stats.max}</div></div>
      <div class="kpi"><div class="kpi-label">Ortalama / Medyan</div><div class="kpi-val">${dataset.stats.mean} / ${dataset.stats.median}</div></div>
      <div class="kpi"><div class="kpi-label">Başlangıç Düzenliliği</div><div class="kpi-val">%${dataset.stats.sortednessPct}</div></div>
    </div>

    ${
      activeRun
        ? `<h2>Seçili Simülasyon: ${activeRun.algorithmName}</h2>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Karşılaştırma</div><div class="kpi-val">${activeRun.comparisons.toLocaleString('tr-TR')}</div></div>
      <div class="kpi"><div class="kpi-label">Dizi Erişimi</div><div class="kpi-val">${activeRun.arrayAccesses.toLocaleString('tr-TR')}</div></div>
      <div class="kpi"><div class="kpi-label">Yazma İşlemi</div><div class="kpi-val">${activeRun.writes.toLocaleString('tr-TR')}</div></div>
      <div class="kpi"><div class="kpi-label">Takas Sayısı</div><div class="kpi-val">${activeRun.swaps.toLocaleString('tr-TR')}</div></div>
    </div>`
        : ''
    }

    <h2>Analitik Bulgular</h2>
    <ul>
      ${insights.map((ins) => `<li>${ins}</li>`).join('')}
    </ul>

    ${
      benchmarks.length > 0
        ? `<h2>Dizi Erişimi Karşılaştırma Grafiği</h2>
    <div class="chart-wrap">
      <svg width="700" height="${svgHeight}" viewBox="0 0 700 ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        ${svgBars}
      </svg>
    </div>

    <h2>Çoklu Algoritma Kıyaslama Tablosu</h2>
    <table>
      <thead>
        <tr>
          <th>Algoritma</th>
          <th>Kategori</th>
          <th class="num">Karşılaştırma</th>
          <th class="num">Dizi Erişimi</th>
          <th class="num">Yazma</th>
          <th class="num">Takas</th>
          <th class="num">Süre (ms)</th>
          <th>Karmaşıklık</th>
        </tr>
      </thead>
      <tbody>
        ${benchmarks
          .map(
            (b) => `<tr>
          <td>${b.algorithmName}</td>
          <td>${b.category}</td>
          <td class="num">${b.comparisons.toLocaleString('tr-TR')}</td>
          <td class="num">${b.arrayAccesses.toLocaleString('tr-TR')}</td>
          <td class="num">${b.writes.toLocaleString('tr-TR')}</td>
          <td class="num">${b.swaps.toLocaleString('tr-TR')}</td>
          <td class="num">${b.cpuTimeMs.toFixed(2)}</td>
          <td><code>${b.avgTimeComplexity}</code></td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }
  </div>
</body>
</html>`;

  const filename = `siralab_analitik_rapor_${safeTimestamp()}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerBlobDownload(blob, filename);
  return filename;
}

export function exportCanvasPng(canvas: HTMLCanvasElement | null, algorithmName: string): string | null {
  if (!canvas) return null;
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  const slug = algorithmName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `siralab_${slug}_${safeTimestamp()}.png`;
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return filename;
}
