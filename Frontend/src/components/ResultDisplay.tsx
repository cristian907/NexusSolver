import { useState } from 'react';
import type { ResultadoTransporteResponse } from '../types/api';
import { MatrixDisplay } from './MatrixDisplay';
import { SectionDivider } from './SectionDivider';
import '../styles/results.css';

interface ResultDisplayProps {
  result: ResultadoTransporteResponse;
  rowLabels: string[];
  colLabels: string[];
  methodName: string;
  isAssignment?: boolean;
}

// ── Step grouping ─────────────────────────────────────────────────────────────

function groupPasos(pasos: string[]) {
  const groups: { title: string; items: string[] }[] = [];
  let current: { title: string; items: string[] } | null = null;

  for (const paso of pasos) {
    const trimmed = paso.trim();
    if (/^---/.test(trimmed)) {
      if (current) groups.push(current);
      const title = trimmed.replace(/^-+\s*/, '').replace(/\s*-+$/, '').trim();
      current = { title, items: [] };
    } else if (trimmed !== '') {
      if (!current) current = { title: 'General', items: [] };
      current.items.push(paso);
    }
  }
  if (current) groups.push(current);
  return groups;
}

// ── Matrix text parser ────────────────────────────────────────────────────────

const MATRIX_MARKER_RE = /\[Matriz[^\]]*\]:/;

interface ParsedMatrix {
  title: string;
  headers: string[];
  rows: { label: string; values: string[] }[];
}

function parseMatrixLines(lines: string[]): { headers: string[]; rows: { label: string; values: string[] }[] } | null {
  if (lines.length < 2) return null;

  // Find a data row to determine column width and value-start offset.
  // Data rows have format: "      {label:>{ancho_fila}}: {val:>{ancho_col}.1f}..."
  // The prefix length (before first value) equals ancho_fila + 8, same as the header prefix.
  const dataLine = lines.slice(1).find(l => l.includes(':'));
  if (!dataLine) return null;

  const colonIdx = dataLine.indexOf(': ');
  if (colonIdx === -1) return null;
  const valuesStr = dataLine.slice(colonIdx + 2);
  const numValues = valuesStr.trim().split(/\s+/).filter(v => v !== '').length;
  if (numValues === 0) return null;

  // Column width = total values string length / number of values (fixed-width right-aligned)
  const colWidth = Math.round(valuesStr.length / numValues);
  const offset = colonIdx + 2; // same prefix length in header line

  // Extract headers using fixed column width from the same offset
  const headerLine = lines[0];
  const headers: string[] = [];
  for (let pos = offset; pos < headerLine.length; pos += colWidth) {
    headers.push(headerLine.slice(pos, pos + colWidth).trim());
  }

  // Parse data rows
  const rows = lines.slice(1).map(line => {
    const ci = line.indexOf(': ');
    if (ci === -1) return null;
    const label = line.slice(0, ci).trim();
    const vStr = line.slice(ci + 2);
    const values: string[] = [];
    for (let pos = 0; pos < vStr.length; pos += colWidth) {
      const chunk = vStr.slice(pos, pos + colWidth).trim();
      if (chunk !== '') values.push(chunk);
    }
    return { label, values };
  }).filter(Boolean) as { label: string; values: string[] }[];

  return { headers, rows };
}

function parseMatrixBlock(text: string): { before: string; matrices: ParsedMatrix[] } {
  const matrices: ParsedMatrix[] = [];
  let remaining = text;
  let before = '';
  let firstPass = true;

  while (true) {
    const match = MATRIX_MARKER_RE.exec(remaining);
    if (!match) {
      if (firstPass) before = remaining.trim();
      break;
    }

    if (firstPass) {
      before = remaining.slice(0, match.index).trim();
      firstPass = false;
    }

    const markerTitle = match[0].slice(1, -2).trim();
    const afterMarker = remaining.slice(match.index + match[0].length);
    const nextMatch = MATRIX_MARKER_RE.exec(afterMarker);
    const matrixText = nextMatch
      ? afterMarker.slice(0, afterMarker.indexOf(nextMatch[0])).trim()
      : afterMarker.trim();

    const lines = matrixText.split('\n').filter(l => l.trim() !== '');
    const parsed = parseMatrixLines(lines);
    if (parsed) {
      matrices.push({ title: markerTitle, ...parsed });
    }

    remaining = afterMarker.slice(afterMarker.indexOf(matrixText) + matrixText.length);
  }

  return { before, matrices };
}

// ── Diff table parser ─────────────────────────────────────────────────────────

interface DiffData {
  rowDiffs: Map<number, number>;
  colDiffs: Map<number, number>;
}

function parseDiffs(text: string): DiffData | null {
  const match = text.match(/Diferencias calculadas:\s*(.+)/);
  if (!match) return null;

  const rowDiffs = new Map<number, number>();
  const colDiffs = new Map<number, number>();

  for (const part of match[1].split(',')) {
    const m = part.trim().match(/^([FC])(\d+)\(([^)]+)\)$/);
    if (m) {
      const idx = parseInt(m[2]);
      const val = parseFloat(m[3]);
      if (m[1] === 'F') rowDiffs.set(idx, val);
      else colDiffs.set(idx, val);
    }
  }

  if (rowDiffs.size === 0 && colDiffs.size === 0) return null;
  return { rowDiffs, colDiffs };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepMatrixTable({ title, headers, rows }: ParsedMatrix) {
  const isDemandRow = (label: string) => label.toLowerCase() === 'demanda';
  const isSupplyCol = (header: string) => header.toLowerCase() === 'oferta';

  return (
    <div className="step-matrix-wrap">
      <div className="step-matrix-title">{title}</div>
      <div className="step-matrix-scroll">
        <table className="step-table">
          <thead>
            <tr>
              <th className="step-table-corner"></th>
              {headers.map((h, i) => (
                <th key={i} className={isSupplyCol(h) ? 'supply-col' : ''}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={isDemandRow(row.label) ? 'demand-row' : ''}>
                <td className="step-table-label">{row.label}</td>
                {row.values.map((v, ci) => (
                  <td key={ci} className={isSupplyCol(headers[ci] ?? '') ? 'supply-col' : ''}>
                    {v === '0.0' || v === '0' ? '—' : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface DiffTableProps extends DiffData {
  costs: number[][];
  supply: number[];
  demand: number[];
  rowLabels: string[];
  colLabels: string[];
}

function DiffTable({ rowDiffs, colDiffs, costs, supply, demand, rowLabels, colLabels }: DiffTableProps) {
  const rowIndices = Array.from(rowDiffs.keys()).sort((a, b) => a - b);
  const colIndices = Array.from(colDiffs.keys()).sort((a, b) => a - b);
  const showSupplyDemand = supply.length > 0 && demand.length > 0;

  const fmtCost = (i: number, j: number) => {
    const v = costs[i]?.[j];
    return v !== undefined ? v.toLocaleString() : '–';
  };

  const fmtSupply = (i: number) => supply[i] !== undefined ? supply[i].toLocaleString() : '–';
  const fmtDemand = (j: number) => demand[j] !== undefined ? demand[j].toLocaleString() : '–';

  const rowLabel = (i: number) => rowLabels[i] ?? `F${i}`;
  const colLabel = (j: number) => colLabels[j] ?? `C${j}`;

  return (
    <div className="step-matrix-wrap">
      <div className="step-matrix-title">Penalizaciones (Diferencias de Vogel)</div>
      <div className="step-matrix-scroll">
        <table className="step-table diff-table">
          <thead>
            <tr>
              <th className="step-table-corner"></th>
              {colIndices.map(j => <th key={j}>{colLabel(j)}</th>)}
              {showSupplyDemand && <th className="supply-col-header">Oferta</th>}
              <th className="diff-header">Dif fila</th>
            </tr>
          </thead>
          <tbody>
            {rowIndices.map(i => (
              <tr key={i}>
                <td className="step-table-label">{rowLabel(i)}</td>
                {colIndices.map(j => (
                  <td key={j} className="cost-cell">{fmtCost(i, j)}</td>
                ))}
                {showSupplyDemand && <td className="supply-cell">{fmtSupply(i)}</td>}
                <td className="diff-value">{rowDiffs.get(i)}</td>
              </tr>
            ))}
            {showSupplyDemand && (
              <tr className="demand-row-sep">
                <td className="step-table-label">Demanda</td>
                {colIndices.map(j => (
                  <td key={j} className="demand-cell">{fmtDemand(j)}</td>
                ))}
                <td className="empty-cell"></td>
                <td className="empty-cell"></td>
              </tr>
            )}
            <tr className="diff-col-row">
              <td className="step-table-label diff-label">Dif col</td>
              {colIndices.map(j => (
                <td key={j} className="diff-value">{colDiffs.get(j)}</td>
              ))}
              {showSupplyDemand && <td className="empty-cell"></td>}
              <td className="empty-cell"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StepContentProps {
  text: string;
  costs: number[][];
  supply: number[];
  demand: number[];
  rowLabels: string[];
  colLabels: string[];
  isAssignment: boolean;
}

function StepContent({ text, costs, supply, demand, rowLabels, colLabels, isAssignment }: StepContentProps) {
  // Check for inline matrix blocks
  if (MATRIX_MARKER_RE.test(text)) {
    const { before, matrices } = parseMatrixBlock(text);
    return (
      <div className="step-rich">
        {before && <div className="step-text">{before}</div>}
        {matrices.map((m, i) => (
          <StepMatrixTable key={i} {...m} />
        ))}
      </div>
    );
  }

  // Check for differences step
  if (text.includes('Diferencias calculadas:')) {
    const diffs = parseDiffs(text);
    if (diffs) {
      return (
        <div className="step-rich">
          <DiffTable
            {...diffs}
            costs={costs}
            supply={isAssignment ? [] : supply}
            demand={isAssignment ? [] : demand}
            rowLabels={rowLabels}
            colLabels={colLabels}
          />
        </div>
      );
    }
  }

  return <div className="step-text">{text.trim()}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ResultDisplay({ result, rowLabels, colLabels, methodName, isAssignment = false }: ResultDisplayProps) {
  const [openPanels, setOpenPanels] = useState({
    originalData: true,
    balancing: true,
    assignments: true,
    steps: true,
  });
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const togglePanel = (key: keyof typeof openPanels) =>
    setOpenPanels(p => ({ ...p, [key]: !p[key] }));

  const toggleSection = (i: number) =>
    setOpenSections(s => ({ ...s, [i]: !(s[i] !== false) }));

  const balancedRows = result.matriz_costos_balanceada.length;
  const balancedCols = result.matriz_costos_balanceada[0]?.length ?? 0;

  const balancedRowLabels = [...rowLabels];
  while (balancedRowLabels.length < balancedRows) {
    balancedRowLabels.push(`Ficticio ${balancedRowLabels.length - rowLabels.length + 1}`);
  }

  const balancedColLabels = [...colLabels];
  while (balancedColLabels.length < balancedCols) {
    balancedColLabels.push(`Ficticio ${balancedColLabels.length - colLabels.length + 1}`);
  }

  const nonZeroCount = result.asignaciones.reduce(
    (acc, row) => acc + row.filter((v) => v !== 0).length,
    0,
  );

  const grupos = groupPasos(result.pasos);
  const hasSections = grupos.length > 1 || (grupos.length === 1 && grupos[0].title !== 'General');

  return (
    <div className="results-area">
      <SectionDivider label={`resultados — ${methodName}`} />

      {/* Summary Stats */}
      <div className="result-panel">
        <div className="result-summary">
          <div className="stat-card">
            <div className="stat-label">Costo total</div>
            <div className="stat-value">${result.costo_total.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Asignaciones</div>
            <div className="stat-value neutral">{nonZeroCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Método</div>
            <div className="stat-value neutral" style={{ fontSize: 14 }}>{methodName}</div>
          </div>
        </div>
      </div>

      {/* 1. Original Data */}
      <div className="result-panel">
        <button className="result-panel-toggle" onClick={() => togglePanel('originalData')}>
          <span className="icon">1.</span> Datos Originales del Problema
          <span className="toggle-chevron">{openPanels.originalData ? '▾' : '▸'}</span>
        </button>
        {openPanels.originalData && (
          <div className="result-panel-content">
            <MatrixDisplay
              data={result.matriz_costos_original}
              rowLabels={rowLabels}
              colLabels={colLabels}
              supply={isAssignment ? undefined : result.oferta_original}
              demand={isAssignment ? undefined : result.demanda_original}
              title="Matriz de costos unitarios"
            />
          </div>
        )}
      </div>

      {/* 2. Balancing */}
      <div className="result-panel">
        <button className="result-panel-toggle" onClick={() => togglePanel('balancing')}>
          <span className="icon">2.</span> Proceso de Balanceo
          <span className="toggle-chevron">{openPanels.balancing ? '▾' : '▸'}</span>
        </button>
        {openPanels.balancing && (
          <div className="result-panel-content">
            {result.fue_balanceada ? (
              <>
                <div className="balance-info unbalanced">
                  {result.tipo_balanceo}
                </div>
                <MatrixDisplay
                  data={result.matriz_costos_balanceada}
                  rowLabels={balancedRowLabels}
                  colLabels={balancedColLabels}
                  supply={isAssignment ? undefined : result.oferta_balanceada}
                  demand={isAssignment ? undefined : result.demanda_balanceada}
                  title="Matriz balanceada"
                />
              </>
            ) : (
              <div className="balance-info balanced">
                ✓ No se requirió balanceo — {result.tipo_balanceo}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Assignments */}
      <div className="result-panel">
        <button className="result-panel-toggle" onClick={() => togglePanel('assignments')}>
          <span className="icon">3.</span> Resultado de Asignaciones Óptimas
          <span className="toggle-chevron">{openPanels.assignments ? '▾' : '▸'}</span>
        </button>
        {openPanels.assignments && (
          <div className="result-panel-content">
            <MatrixDisplay
              data={result.asignaciones}
              rowLabels={balancedRowLabels}
              colLabels={balancedColLabels}
              highlightNonZero
              title="Matriz de asignaciones (unidades a enviar)"
            />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <span style={{
                fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700,
                color: 'var(--accent)',
              }}>
                ★ COSTO TOTAL: ${result.costo_total.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Steps */}
      <div className="result-panel">
        <button className="result-panel-toggle" onClick={() => togglePanel('steps')}>
          <span className="icon">4.</span> Bitácora de Pasos
          <span className="toggle-chevron">{openPanels.steps ? '▾' : '▸'}</span>
        </button>
        {openPanels.steps && (
          <div className="result-panel-content">
            {hasSections ? (
              <div className="step-section-list">
                {grupos.map((grupo, gi) => {
                  const isOpen = openSections[gi] !== false;
                  return (
                    <div key={gi} className="step-section">
                      <button
                        className="step-section-toggle"
                        onClick={() => toggleSection(gi)}
                      >
                        <span className="toggle-chevron">{isOpen ? '▾' : '▸'}</span>
                        {grupo.title}
                      </button>
                      {isOpen && (
                        <div className="step-section-content">
                          {grupo.items.map((paso, pi) => (
                            <div key={pi} className="step">
                              <div className="step-num">{pi + 1}</div>
                              <StepContent
                              text={paso}
                              costs={result.matriz_costos_balanceada}
                              supply={result.oferta_balanceada}
                              demand={result.demanda_balanceada}
                              rowLabels={balancedRowLabels}
                              colLabels={balancedColLabels}
                              isAssignment={isAssignment}
                            />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="step-list">
                {result.pasos.map((paso, i) => (
                  <div key={i} className="step">
                    <div className="step-num">{i + 1}</div>
                    <StepContent
                              text={paso}
                              costs={result.matriz_costos_balanceada}
                              supply={result.oferta_balanceada}
                              demand={result.demanda_balanceada}
                              rowLabels={balancedRowLabels}
                              colLabels={balancedColLabels}
                              isAssignment={isAssignment}
                            />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
