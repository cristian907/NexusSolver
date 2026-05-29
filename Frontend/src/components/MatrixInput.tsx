import '../styles/matrix.css';

function isValidNumericInput(value: string): boolean {
  return /^-?\d*\.?\d*$/.test(value);
}

interface MatrixInputProps {
  rows: number;
  cols: number;
  costs: string[][];
  supply: string[];
  demand: string[];
  rowLabels: string[];
  colLabels: string[];
  onCostChange: (r: number, c: number, value: string) => void;
  onSupplyChange: (index: number, value: string) => void;
  onDemandChange: (index: number, value: string) => void;
  onRowLabelChange: (index: number, value: string) => void;
  onColLabelChange: (index: number, value: string) => void;
  showSupplyDemand: boolean;
  matrixLabel?: string;
}

export function MatrixInput({
  rows,
  cols,
  costs,
  supply,
  demand,
  rowLabels,
  colLabels,
  onCostChange,
  onSupplyChange,
  onDemandChange,
  onRowLabelChange,
  onColLabelChange,
  showSupplyDemand,
  matrixLabel = 'Matriz de costos',
}: MatrixInputProps) {
  return (
    <div className="matrix-section">
      <div className="matrix-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span>{matrixLabel}</span>
        <span style={{ fontSize: '10px', textTransform: 'lowercase', opacity: 0.6, fontStyle: 'italic', fontFamily: 'var(--sans)' }}>
          (haz clic sobre las etiquetas para renombrar agentes/tareas/orígenes/destinos)
        </span>
      </div>
      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th></th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j}>
                  <input
                    className="label-input"
                    value={colLabels[j] ?? ''}
                    onChange={(e) => onColLabelChange(j, e.target.value)}
                  />
                </th>
              ))}
              {showSupplyDemand && <th style={{ color: 'var(--accent)' }}>Oferta</th>}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <th className="row-header">
                  <input
                    className="label-input row-label"
                    value={rowLabels[i] ?? ''}
                    onChange={(e) => onRowLabelChange(i, e.target.value)}
                  />
                </th>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={costs[i]?.[j] ?? '0'}
                      onChange={(e) => {
                        if (isValidNumericInput(e.target.value)) onCostChange(i, j, e.target.value);
                      }}
                    />
                  </td>
                ))}
                {showSupplyDemand && (
                  <td>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="supply"
                      value={supply[i] ?? '0'}
                      onChange={(e) => {
                        if (isValidNumericInput(e.target.value)) onSupplyChange(i, e.target.value);
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {showSupplyDemand && (
              <tr>
                <th></th>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j}>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="demand"
                      value={demand[j] ?? '0'}
                      onChange={(e) => {
                        if (isValidNumericInput(e.target.value)) onDemandChange(j, e.target.value);
                      }}
                    />
                  </td>
                ))}
                <td style={{ padding: '3px' }}>
                  <div style={{
                    width: 64, height: 36, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, color: 'var(--text3)',
                    fontFamily: 'var(--mono)',
                  }}>
                    demanda
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
