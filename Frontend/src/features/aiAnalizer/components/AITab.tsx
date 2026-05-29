import { ResultDisplay } from '../../../components/ResultDisplay';
import { SectionDivider } from '../../../components/SectionDivider';
import { generatePDF } from '../../../services/pdfExport';
import type { useAIAnalyzer } from '../hooks/useAIAnalyzer';
import type { useTransportSolver } from '../../transportSolver/hooks/useTransportSolver';
import type { useAssignmentSolver } from '../../assignmentSolver/hooks/useAssignmentSolver';
import { TRANSPORT_METHODS } from '../../transportSolver/types';
import { ASSIGNMENT_METHODS } from '../../assignmentSolver/types';
import '../../../styles/ai.css';

interface AITabProps {
  analyzer: ReturnType<typeof useAIAnalyzer>;
  transportSolver: ReturnType<typeof useTransportSolver>;
  assignmentSolver: ReturnType<typeof useAssignmentSolver>;
}

export function AITab({ analyzer, transportSolver, assignmentSolver }: AITabProps) {
  const transportActive = transportSolver.phase !== 'splash';
  const assignmentActive = assignmentSolver.phase !== 'splash';

  const transportMethodLabel = TRANSPORT_METHODS.find((m) => m.value === transportSolver.method)?.label ?? '';
  const assignmentMethodLabel = ASSIGNMENT_METHODS.find((m) => m.value === assignmentSolver.method)?.label ?? '';

  const handleOptimize = () => {
    const tData = transportActive ? transportSolver.getRequestData() : null;
    const aData = assignmentActive ? assignmentSolver.getRequestData() : null;
    analyzer.optimizeAndAnalyze(tData, aData, {
      transportOriginNames: transportActive ? transportSolver.rowLabels : undefined,
      transportDestinationNames: transportActive ? transportSolver.colLabels : undefined,
      assignmentOriginNames: assignmentActive ? assignmentSolver.rowLabels : undefined,
      assignmentDestinationNames: assignmentActive ? assignmentSolver.colLabels : undefined,
    });
  };

  const handleExportPDF = () => {
    generatePDF({
      transportResult: analyzer.transportResult ?? undefined,
      assignmentResult: analyzer.assignmentResult ?? undefined,
      aiAnalysis: analyzer.aiAnalysis ?? undefined,
      transportInputCosts: transportActive
        ? transportSolver.costs.map((row) => row.map((v) => parseFloat(v.replace(',', '.')) || 0))
        : undefined,
      transportInputSupply: transportActive
        ? transportSolver.supply.map((v) => parseFloat(v.replace(',', '.')) || 0)
        : undefined,
      transportInputDemand: transportActive
        ? transportSolver.demand.map((v) => parseFloat(v.replace(',', '.')) || 0)
        : undefined,
      assignmentInputCosts: assignmentActive
        ? assignmentSolver.costs.map((row) => row.map((v) => parseFloat(v.replace(',', '.')) || 0))
        : undefined,
      assignmentInputSupply: assignmentActive
        ? assignmentSolver.supply.map((v) => parseFloat(v.replace(',', '.')) || 0)
        : undefined,
      assignmentInputDemand: assignmentActive
        ? assignmentSolver.demand.map((v) => parseFloat(v.replace(',', '.')) || 0)
        : undefined,
      transportRowLabels: transportSolver.rowLabels,
      transportColLabels: transportSolver.colLabels,
      assignmentRowLabels: assignmentSolver.rowLabels,
      assignmentColLabels: assignmentSolver.colLabels,
      transportMethod: transportMethodLabel,
      assignmentMethod: assignmentMethodLabel,
    });
  };

  const hasResults = analyzer.transportResult || analyzer.assignmentResult;

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="ai-header">
        <div className="ai-icon">
          <svg width="20" height="20" fill="none" stroke="var(--accent2)" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="ai-title">Análisis COO — Director de Operaciones</div>
          <div className="ai-sub">groq / llama3-8b-8192 · prompt dinámico basado en datos activos</div>
        </div>
        <div className="modules-detected">
          <div className={`mod-chip ${transportActive ? 'active' : 'inactive'}`}>
            <span className="dot" />Transporte
          </div>
          <div className={`mod-chip ${assignmentActive ? 'active' : 'inactive'}`}>
            <span className="dot" />Asignación
          </div>
        </div>
      </div>

      {!hasResults && !analyzer.loading && (
        <div className="ai-output">
          <div className="ai-placeholder">
            <div className="ai-placeholder-icon">
              <svg width="22" height="22" fill="none" stroke="var(--text3)" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <p>El análisis aparecerá aquí después de presionar "Optimizar y Analizar"</p>
            <button
              className="btn-analyze"
              onClick={handleOptimize}
              disabled={!transportActive && !assignmentActive}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
              Optimizar y Analizar
            </button>
          </div>
        </div>
      )}

      {analyzer.loading && (
        <div className="ai-output">
          <div className="loading-overlay">
            <div className="spinner" />
            Resolviendo problemas y generando análisis IA...
          </div>
        </div>
      )}

      {analyzer.error && <div className="error-message">{analyzer.error}</div>}

      {hasResults && !analyzer.loading && (
        <>
          {analyzer.transportResult && (
            <>
              <SectionDivider label="resultado — transporte" />
              <ResultDisplay
                result={analyzer.transportResult}
                rowLabels={transportSolver.rowLabels}
                colLabels={transportSolver.colLabels}
                methodName={transportMethodLabel}
              />
            </>
          )}

          {analyzer.assignmentResult && (
            <>
              <SectionDivider label="resultado — asignación" />
              <ResultDisplay
                result={analyzer.assignmentResult}
                rowLabels={assignmentSolver.rowLabels}
                colLabels={assignmentSolver.colLabels}
                methodName={assignmentMethodLabel}
              />
            </>
          )}

          {analyzer.aiAnalysis && (
            <>
              <SectionDivider label="conclusión logística ejecutiva — groq ai" />
              <div className="result-panel">
                <div className="result-section-title">
                  <span className="icon">★</span> Análisis Estratégico COO
                </div>
                <div className="ai-analysis-text">{analyzer.aiAnalysis}</div>
              </div>
            </>
          )}

          <button className="btn-export-pdf" onClick={handleExportPDF}>
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
