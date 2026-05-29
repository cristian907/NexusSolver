import { useReducer, useCallback } from 'react';
import type { AssignmentProblemRequest, ResultadoTransporteResponse } from '../../../types/api';
import type { AssignmentMethod } from '../types';
import {
  solveAssignmentHungarianMin,
  solveAssignmentHungarianMax,
} from '../services';
import { analyzeResults } from '../../aiAnalizer/services';

type Phase = 'splash' | 'input' | 'solved';

interface State {
  phase: Phase;
  rowsCount: number;
  colsCount: number;
  costs: string[][];
  supply: string[];
  demand: string[];
  rowLabels: string[];
  colLabels: string[];
  method: AssignmentMethod;
  result: ResultadoTransporteResponse | null;
  loading: boolean;
  error: string | null;
  aiAnalysis: string | null;
  aiLoading: boolean;
  aiError: string | null;
}

type Action =
  | { type: 'START' }
  | { type: 'SET_ROWS_COUNT'; rowsCount: number }
  | { type: 'SET_COLS_COUNT'; colsCount: number }
  | { type: 'SET_COST'; r: number; c: number; value: string }
  | { type: 'SET_SUPPLY'; index: number; value: string }
  | { type: 'SET_DEMAND'; index: number; value: string }
  | { type: 'SET_ROW_LABEL'; index: number; value: string }
  | { type: 'SET_COL_LABEL'; index: number; value: string }
  | { type: 'SET_METHOD'; method: AssignmentMethod }
  | { type: 'SOLVE_START' }
  | { type: 'SOLVE_SUCCESS'; result: ResultadoTransporteResponse }
  | { type: 'SOLVE_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'AI_START' }
  | { type: 'AI_SUCCESS'; analysis: string }
  | { type: 'AI_ERROR'; error: string }
  | { type: 'AI_RESET' };

function createMatrix(rows: number, cols: number, prev?: string[][]): string[][] {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => prev?.[i]?.[j] ?? '0'),
  );
}

function createVector(n: number, prev?: string[], defaultVal = '1'): string[] {
  return Array.from({ length: n }, (_, i) => prev?.[i] ?? defaultVal);
}

function createLabels(n: number, prefix: string, prev?: string[]): string[] {
  return Array.from({ length: n }, (_, i) => prev?.[i] ?? `${prefix} ${i + 1}`);
}

const initialState: State = {
  phase: 'splash',
  rowsCount: 4,
  colsCount: 4,
  costs: [],
  supply: [],
  demand: [],
  rowLabels: [],
  colLabels: [],
  method: 'hungarian-min',
  result: null,
  loading: false,
  error: null,
  aiAnalysis: null,
  aiLoading: false,
  aiError: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'input',
        costs: createMatrix(state.rowsCount, state.colsCount),
        supply: createVector(state.rowsCount),
        demand: createVector(state.colsCount),
        rowLabels: createLabels(state.rowsCount, 'Agente'),
        colLabels: createLabels(state.colsCount, 'Tarea'),
        result: null,
        error: null,
      };
    case 'SET_ROWS_COUNT': {
      const { rowsCount } = action;
      return {
        ...state,
        rowsCount,
        costs: createMatrix(rowsCount, state.colsCount, state.costs),
        supply: createVector(rowsCount, state.supply),
        rowLabels: createLabels(rowsCount, 'Agente', state.rowLabels),
        result: null,
      };
    }
    case 'SET_COLS_COUNT': {
      const { colsCount } = action;
      return {
        ...state,
        colsCount,
        costs: createMatrix(state.rowsCount, colsCount, state.costs),
        demand: createVector(colsCount, state.demand),
        colLabels: createLabels(colsCount, 'Tarea', state.colLabels),
        result: null,
      };
    }
    case 'SET_COST': {
      const costs = state.costs.map((row) => [...row]);
      costs[action.r][action.c] = action.value;
      return { ...state, costs };
    }
    case 'SET_SUPPLY': {
      const supply = [...state.supply];
      supply[action.index] = action.value;
      return { ...state, supply };
    }
    case 'SET_DEMAND': {
      const demand = [...state.demand];
      demand[action.index] = action.value;
      return { ...state, demand };
    }
    case 'SET_ROW_LABEL': {
      const rowLabels = [...state.rowLabels];
      rowLabels[action.index] = action.value;
      return { ...state, rowLabels };
    }
    case 'SET_COL_LABEL': {
      const colLabels = [...state.colLabels];
      colLabels[action.index] = action.value;
      return { ...state, colLabels };
    }
    case 'SET_METHOD':
      return { ...state, method: action.method };
    case 'SOLVE_START':
      return { ...state, loading: true, error: null, aiAnalysis: null };
    case 'SOLVE_SUCCESS':
      return { ...state, loading: false, phase: 'solved', result: action.result };
    case 'SOLVE_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'RESET':
      return initialState;
    case 'AI_START':
      return { ...state, aiLoading: true, aiError: null };
    case 'AI_SUCCESS':
      return { ...state, aiLoading: false, aiAnalysis: action.analysis };
    case 'AI_ERROR':
      return { ...state, aiLoading: false, aiError: action.error };
    case 'AI_RESET':
      return { ...state, aiAnalysis: null, aiLoading: false, aiError: null };
    default:
      return state;
  }
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function useAssignmentSolver() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startModule = useCallback(() => dispatch({ type: 'START' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const setRowsCount = useCallback((rowsCount: number) => {
    dispatch({ type: 'SET_ROWS_COUNT', rowsCount });
  }, []);

  const setColsCount = useCallback((colsCount: number) => {
    dispatch({ type: 'SET_COLS_COUNT', colsCount });
  }, []);

  const setCost = useCallback((r: number, c: number, value: string) => {
    dispatch({ type: 'SET_COST', r, c, value });
  }, []);

  const setSupply = useCallback((index: number, value: string) => {
    dispatch({ type: 'SET_SUPPLY', index, value });
  }, []);

  const setDemand = useCallback((index: number, value: string) => {
    dispatch({ type: 'SET_DEMAND', index, value });
  }, []);

  const setRowLabel = useCallback((index: number, value: string) => {
    dispatch({ type: 'SET_ROW_LABEL', index, value });
  }, []);

  const setColLabel = useCallback((index: number, value: string) => {
    dispatch({ type: 'SET_COL_LABEL', index, value });
  }, []);

  const setMethod = useCallback((method: string) => {
    dispatch({ type: 'SET_METHOD', method: method as AssignmentMethod });
  }, []);

  const getRequestData = useCallback((): AssignmentProblemRequest | null => {
    const costs: number[][] = [];
    for (let i = 0; i < state.rowsCount; i++) {
      const row: number[] = [];
      for (let j = 0; j < state.colsCount; j++) {
        const n = parseNumber(state.costs[i]?.[j] ?? '0');
        if (n === null || n < 0) return null;
        row.push(n);
      }
      costs.push(row);
    }
    const supply: number[] = [];
    for (let i = 0; i < state.rowsCount; i++) {
      const n = parseNumber(state.supply[i] ?? '1');
      if (n === null || n < 0) return null;
      supply.push(n);
    }
    const demand: number[] = [];
    for (let j = 0; j < state.colsCount; j++) {
      const n = parseNumber(state.demand[j] ?? '1');
      if (n === null || n < 0) return null;
      demand.push(n);
    }
    return { costs, supply, demand, method: state.method, origin_names: state.rowLabels, destination_names: state.colLabels };
  }, [state]);

  const solve = useCallback(async () => {
    const data = getRequestData();
    if (!data) {
      dispatch({ type: 'SOLVE_ERROR', error: 'Valores inválidos en la matriz. Asegúrese de ingresar solo números no negativos.' });
      return;
    }
    dispatch({ type: 'SOLVE_START' });
    try {
      const solver = state.method === 'hungarian-min'
        ? solveAssignmentHungarianMin
        : solveAssignmentHungarianMax;
      const result = await solver(data);
      dispatch({ type: 'SOLVE_SUCCESS', result });
    } catch (e) {
      dispatch({ type: 'SOLVE_ERROR', error: e instanceof Error ? e.message : 'Error desconocido' });
    }
  }, [state.method, getRequestData]);

  const generateAIAnalysis = useCallback(async () => {
    if (!state.result) return;
    dispatch({ type: 'AI_START' });
    try {
      const response = await analyzeResults({
        assignment_result: state.result,
        assignment_origin_names: state.rowLabels,
        assignment_destination_names: state.colLabels,
      });
      dispatch({ type: 'AI_SUCCESS', analysis: response.analysis });
    } catch (e) {
      dispatch({ type: 'AI_ERROR', error: e instanceof Error ? e.message : 'Error al generar análisis' });
    }
  }, [state.result, state.rowLabels, state.colLabels]);

  const resetAIAnalysis = useCallback(() => {
    dispatch({ type: 'AI_RESET' });
  }, []);

  return {
    ...state,
    startModule,
    reset,
    setRowsCount,
    setColsCount,
    setCost,
    setSupply,
    setDemand,
    setRowLabel,
    setColLabel,
    setMethod,
    solve,
    getRequestData,
    generateAIAnalysis,
    resetAIAnalysis,
  };
}
