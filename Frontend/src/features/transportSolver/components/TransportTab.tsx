import { SplashScreen } from '../../../components/SplashScreen';
import { ConfigRow } from '../../../components/ConfigRow';
import { MethodSelector } from '../../../components/MethodSelector';
import { MatrixInput } from '../../../components/MatrixInput';
import { ResultDisplay } from '../../../components/ResultDisplay';
import { TRANSPORT_METHODS } from '../types';
import type { useTransportSolver } from '../hooks/useTransportSolver';
import '../../../styles/module.css';

interface TransportTabProps {
  solver: ReturnType<typeof useTransportSolver>;
}

export function TransportTab({ solver }: TransportTabProps) {
  if (solver.phase === 'splash') {
    return (
      <SplashScreen
        icon={
          <svg width="28" height="28" fill="none" stroke="var(--accent)" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <path d="M16 8h4l3 5v3h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        }
        title="Módulo de Transporte"
        description="Optimiza la distribución de recursos desde múltiples orígenes hacia múltiples destinos, minimizando el costo total de transporte."
        methodTags={['esquina noroeste', 'costo mínimo', 'vogel (VAM)']}
        onStart={solver.startModule}
      />
    );
  }

  const totalSupply = solver.supply.reduce((acc, s) => acc + (parseFloat(s.replace(',', '.')) || 0), 0);
  const totalDemand = solver.demand.reduce((acc, d) => acc + (parseFloat(d.replace(',', '.')) || 0), 0);
  const balanced = totalSupply === totalDemand;

  const methodLabel = TRANSPORT_METHODS.find((m) => m.value === solver.method)?.label ?? solver.method;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="module-header">
        <div className="module-title-area">
          <div className="module-title">Módulo de Transporte</div>
          <div className="module-sub">cadena de suministro — distribución óptima de recursos</div>
        </div>
        <div className="module-actions">
          <button className="btn-ghost danger" onClick={solver.reset}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.67" />
            </svg>
            Limpiar
          </button>
          <button className="btn-solve" onClick={solver.solve} disabled={solver.loading}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Resolver
          </button>
        </div>
      </div>

      <ConfigRow
        fields={[
          {
            label: 'Orígenes (m)',
            value: solver.rows,
            onChange: (v) => solver.setDimensions(v, solver.cols),
          },
          {
            label: 'Destinos (n)',
            value: solver.cols,
            onChange: (v) => solver.setDimensions(solver.rows, v),
          },
        ]}
        balanceInfo={
          totalSupply > 0 || totalDemand > 0
            ? {
                balanced,
                message: balanced
                  ? `✓ balanceado — Σoferta = Σdemanda = ${totalSupply}`
                  : `⚠ no balanceado — oferta: ${totalSupply}, demanda: ${totalDemand}`,
              }
            : undefined
        }
      />

      <MethodSelector
        label="Método"
        options={TRANSPORT_METHODS}
        value={solver.method}
        onChange={solver.setMethod}
      />

      <MatrixInput
        rows={solver.rows}
        cols={solver.cols}
        costs={solver.costs}
        supply={solver.supply}
        demand={solver.demand}
        rowLabels={solver.rowLabels}
        colLabels={solver.colLabels}
        onCostChange={solver.setCost}
        onSupplyChange={solver.setSupply}
        onDemandChange={solver.setDemand}
        onRowLabelChange={solver.setRowLabel}
        onColLabelChange={solver.setColLabel}
        showSupplyDemand={true}
        matrixLabel="Matriz de costos + ofertas / demandas"
      />

      {solver.error && <div className="error-message">{solver.error}</div>}

      {solver.loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          Resolviendo...
        </div>
      )}

      {solver.result && (
        <ResultDisplay
          result={solver.result}
          rowLabels={solver.rowLabels}
          colLabels={solver.colLabels}
          methodName={methodLabel}
        />
      )}
    </div>
  );
}
