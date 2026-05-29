import { SplashScreen } from '../../../components/SplashScreen';
import { ConfigRow } from '../../../components/ConfigRow';
import { MethodSelector } from '../../../components/MethodSelector';
import { MatrixInput } from '../../../components/MatrixInput';
import { ResultDisplay } from '../../../components/ResultDisplay';
import { SectionDivider } from '../../../components/SectionDivider';
import { ASSIGNMENT_METHODS } from '../types';
import type { useAssignmentSolver } from '../hooks/useAssignmentSolver';
import { generatePDF } from '../../../services/pdfExport';
import '../../../styles/module.css';
import '../../../styles/ai.css';

interface AssignmentTabProps {
  solver: ReturnType<typeof useAssignmentSolver>;
}

export function AssignmentTab({ solver }: AssignmentTabProps) {
  if (solver.phase === 'splash') {
    return (
      <SplashScreen
        icon={
          <svg width="28" height="28" fill="none" stroke="var(--accent)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
        title="Módulo de Asignación"
        description="Asigna agentes a tareas minimizando o maximizando el costo/beneficio total. Implementa el método húngaro mostrando cada paso de reducción y cobertura de ceros."
        methodTags={['reducción de filas', 'reducción de columnas', 'cobertura de ceros', 'asignación óptima']}
        onStart={solver.startModule}
      />
    );
  }

  const methodLabel = ASSIGNMENT_METHODS.find((m) => m.value === solver.method)?.label ?? solver.method;

  const handleExportPDF = () => {
    if (!solver.result) return;
    generatePDF({
      assignmentResult: solver.result,
      aiAnalysis: solver.aiAnalysis ?? undefined,
      assignmentInputCosts: solver.costs.map((row) => row.map((v) => parseFloat(v.replace(',', '.')) || 0)),
      assignmentInputSupply: solver.supply.map((v) => parseFloat(v.replace(',', '.')) || 0),
      assignmentInputDemand: solver.demand.map((v) => parseFloat(v.replace(',', '.')) || 0),
      assignmentRowLabels: solver.rowLabels,
      assignmentColLabels: solver.colLabels,
      assignmentMethod: methodLabel,
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="module-header">
        <div className="module-title-area">
          <div className="module-title">Módulo de Asignación</div>
          <div className="module-sub">gestión de talento — método húngaro paso a paso</div>
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
            label: 'Filas',
            value: solver.rowsCount,
            onChange: (v) => solver.setRowsCount(v),
            min: 2,
            max: 10,
          },
          {
            label: 'Columnas',
            value: solver.colsCount,
            onChange: (v) => solver.setColsCount(v),
            min: 2,
            max: 10,
          },
        ]}
      />

      <MethodSelector
        label="Método"
        options={ASSIGNMENT_METHODS}
        value={solver.method}
        onChange={solver.setMethod}
      />

      <MatrixInput
        rows={solver.rowsCount}
        cols={solver.colsCount}
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
        showSupplyDemand={false}
        matrixLabel="Matriz de costos — agentes × tareas"
      />

      {solver.error && <div className="error-message">{solver.error}</div>}

      {solver.loading && (
        <div className="loading-overlay">
          <div className="spinner" />
          Resolviendo...
        </div>
      )}

      {solver.result && (
        <>
          <ResultDisplay
            result={solver.result}
            rowLabels={solver.rowLabels}
            colLabels={solver.colLabels}
            methodName={methodLabel}
            isAssignment
          />

          <SectionDivider label="conclusión logística ejecutiva — groq ai" />
          <div className="result-panel" style={{ marginTop: 20, position: 'relative' }}>
            <div className="result-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="icon">★</span> Análisis Estratégico de Groq IA
              </span>
              {solver.aiAnalysis && (
                <button
                  className="btn-ghost danger"
                  onClick={solver.resetAIAnalysis}
                  style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Reiniciar IA
                </button>
              )}
            </div>

            <div className="ai-container" style={{ padding: '12px 0 6px' }}>
              {solver.aiLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '24px 0' }}>
                  <div className="spinner" />
                  <span style={{ color: 'var(--text2)', fontSize: '13px' }}>Consultando a Groq y redactando conclusiones...</span>
                </div>
              )}

              {solver.aiError && (
                <div className="error-message" style={{ margin: 0 }}>
                  {solver.aiError}
                </div>
              )}

              {!solver.aiAnalysis && !solver.aiLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0' }}>
                  <span style={{ color: 'var(--text3)', fontSize: '13px' }}>
                    Obtén conclusiones estratégicas sobre las asignaciones óptimas calculadas.
                  </span>
                  <button
                    className="btn-analyze"
                    onClick={solver.generateAIAnalysis}
                    style={{ margin: 0 }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                    Generar Conclusión con Groq IA
                  </button>
                </div>
              )}

              {solver.aiAnalysis && (
                <div className="ai-analysis-text" style={{ animation: 'fadeIn 0.2s ease', color: 'var(--text)' }}>
                  {solver.aiAnalysis}
                </div>
              )}
            </div>
          </div>

          <button className="btn-export-pdf" onClick={handleExportPDF} style={{ marginTop: 24 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2v13M5 9l7 7 7-7M3 19h18" />
            </svg>
            Exportar PDF
          </button>
        </>
      )}
    </div>
  );
}
