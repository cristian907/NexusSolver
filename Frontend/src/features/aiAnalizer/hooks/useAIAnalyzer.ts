import { useReducer, useCallback } from 'react';
import type {
  ResultadoTransporteResponse,
  TransportProblemRequest,
  AssignmentProblemRequest,
} from '../../../types/api';
import { solveCombined, analyzeResults } from '../services';

interface State {
  loading: boolean;
  error: string | null;
  transportResult: ResultadoTransporteResponse | null;
  assignmentResult: ResultadoTransporteResponse | null;
  aiAnalysis: string | null;
}

type Action =
  | { type: 'START' }
  | { type: 'SOLVE_DONE'; transportResult?: ResultadoTransporteResponse; assignmentResult?: ResultadoTransporteResponse }
  | { type: 'ANALYSIS_DONE'; analysis: string }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' };

const initialState: State = {
  loading: false,
  error: null,
  transportResult: null,
  assignmentResult: null,
  aiAnalysis: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return { ...initialState, loading: true };
    case 'SOLVE_DONE':
      return {
        ...state,
        transportResult: action.transportResult ?? null,
        assignmentResult: action.assignmentResult ?? null,
      };
    case 'ANALYSIS_DONE':
      return { ...state, loading: false, aiAnalysis: action.analysis };
    case 'ERROR':
      return { ...state, loading: false, error: action.error };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function useAIAnalyzer() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const optimizeAndAnalyze = useCallback(async (
    transportData: TransportProblemRequest | null,
    assignmentData: AssignmentProblemRequest | null,
    labels?: {
      transportOriginNames?: string[];
      transportDestinationNames?: string[];
      assignmentOriginNames?: string[];
      assignmentDestinationNames?: string[];
    },
  ) => {
    if (!transportData && !assignmentData) {
      dispatch({ type: 'ERROR', error: 'Debe iniciar al menos un módulo (Transporte o Asignación) antes de analizar.' });
      return;
    }

    dispatch({ type: 'START' });

    try {
      const solveResult = await solveCombined({
        transport_problem: transportData ?? undefined,
        assignment_problem: assignmentData ?? undefined,
      });

      dispatch({
        type: 'SOLVE_DONE',
        transportResult: solveResult.transport_result,
        assignmentResult: solveResult.assignment_result,
      });

      const analyzeResult = await analyzeResults({
        transport_result: solveResult.transport_result,
        assignment_result: solveResult.assignment_result,
        transport_origin_names: labels?.transportOriginNames,
        transport_destination_names: labels?.transportDestinationNames,
        assignment_origin_names: labels?.assignmentOriginNames,
        assignment_destination_names: labels?.assignmentDestinationNames,
      });

      dispatch({ type: 'ANALYSIS_DONE', analysis: analyzeResult.analysis });
    } catch (e) {
      dispatch({ type: 'ERROR', error: e instanceof Error ? e.message : 'Error desconocido' });
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { ...state, optimizeAndAnalyze, reset };
}
