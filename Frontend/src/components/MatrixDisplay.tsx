import '../styles/matrix.css';

interface MatrixDisplayProps {
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  highlightNonZero?: boolean;
  title?: string;
  supplyLabel?: string;
  demandLabel?: string;
  supply?: number[];
  demand?: number[];
}

export function MatrixDisplay({
  data,
  rowLabels,
  colLabels,
  highlightNonZero = false,
  title,
  supply,
  demand,
  supplyLabel = 'Oferta',
  demandLabel = 'Demanda',
}: MatrixDisplayProps) {
  if (!data.length) return null;

  const rows = data.length;
  const cols = data[0]?.length ?? 0;

  return (
    <div className="matrix-section">
      {title && <div className="matrix-label">{title}</div>}
      <div className="matrix-wrap">
        <table className="matrix matrix-display">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j}>{colLabels?.[j] ?? `Col ${j + 1}`}</th>
              ))}
              {supply && <th style={{ color: 'var(--accent)' }}>{supplyLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <th className="row-header">{rowLabels?.[i] ?? `Fila ${i + 1}`}</th>
                {Array.from({ length: cols }, (_, j) => {
                  const val = data[i]?.[j] ?? 0;
                  const isHighlighted = highlightNonZero && val !== 0;
                  return (
                    <td key={j} className={isHighlighted ? 'highlighted' : ''}>
                      {val}
                    </td>
                  );
                })}
                {supply && <td className="highlighted">{supply[i]}</td>}
              </tr>
            ))}
            {demand && (
              <tr>
                <th className="row-header">{demandLabel}</th>
                {demand.map((d, j) => (
                  <td key={j}>{d}</td>
                ))}
                {supply && <td></td>}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
