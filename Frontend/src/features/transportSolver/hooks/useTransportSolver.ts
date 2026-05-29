import { useReducer, useCallback } from 'react';
import type { TransportProblemRequest, ResultadoTransporteResponse } from '../../../types/api';
import type { TransportMethod } from '../types';
import {
  solveTransportNorthWest,
  solveTransportMinimumCost,
  solveTransportVogel,
} from '../services';

type Phase = 'splash' | 'input' | 'solved';

interface State {
  phase: Phase;
  rows: number;
  cols: number;
  costs: string[][];
  supply: string[];
  demand: string[];
  rowLabels: string[];
  colLabels: string[];
  method: TransportMethod;
  result: ResultadoTransporteResponse | null;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'START' }
  | { type: 'SET_DIMENSIONS'; rows: number; cols: number }
  | { type: 'SET_COST'; r: number; c: number; value: string }
  | { type: 'SET_SUPPLY'; index: number; value: string }
  | { type: 'SET_DEMAND'; index: number; value: string }
  | { type: 'SET_ROW_LABEL'; index: number; value: string }
  | { type: 'SET_COL_LABEL'; index: number; value: string }
  | { type: 'SET_METHOD'; method: TransportMethod }
  | { type: 'SOLVE_START' }
  | { type: 'SOLVE_SUCCESS'; result: ResultadoTransporteResponse }
  | { type: 'SOLVE_ERROR'; error: string }
  | { type: 'RESET' };

function createMatrix(rows: number, cols: number, prev?: string[][]): string[][] {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => prev?.[i]?.[j] ?? '0'),
  );
}

function createVector(size: number, prev?: string[], defaultVal = '0'): string[] {
  return Array.from({ length: size }, (_, i) => prev?.[i] ?? defaultVal);
}

function createLabels(size: number, prefix: string, prev?: string[]): string[] {
  return Array.from({ length: size }, (_, i) => prev?.[i] ?? `${prefix} ${i + 1}`);
}

const initialState: State = {
  phase: 'splash',
  rows: 3,
  cols: 4,
  costs: [],
  supply: [],
  demand: [],
  rowLabels: [],
  colLabels: [],
  method: 'north-west-corner',
  result: null,
  loading: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        phase: 'input',
        costs: createMatrix(state.rows, state.cols),
        supply: createVector(state.rows),
        demand: createVector(state.cols),
        rowLabels: createLabels(state.rows, 'Origen'),
        colLabels: createLabels(state.cols, 'Destino'),
        result: null,
        error: null,
      };
    case 'SET_DIMENSIONS': {
      const { rows, cols } = action;
      return {
        ...state,
        rows,
        cols,
        costs: createMatrix(rows, cols, state.costs),
        supply: createVector(rows, state.supply),
        demand: createVector(cols, state.demand),
        rowLabels: createLabels(rows, 'Origen', state.rowLabels),
        colLabels: createLabels(cols, 'Destino', state.colLabels),
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
      return { ...state, loading: true, error: null };
    case 'SOLVE_SUCCESS':
      return { ...state, loading: false, phase: 'solved', result: action.result };
    case 'SOLVE_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function parseNumber(s: string): number | null {
  const cleaned = s.replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function useTransportSolver() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startModule = useCallback(() => dispatch({ type: 'START' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const setDimensions = useCallback((rows: number, cols: number) => {
    dispatch({ type: 'SET_DIMENSIONS', rows, cols });
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
    dispatch({ type: 'SET_METHOD', method: method as TransportMethod });
  }, []);

  const getRequestData = useCallback((): TransportProblemRequest | null => {
    const costs: number[][] = [];
    for (let i = 0; i < state.rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < state.cols; j++) {
        const n = parseNumber(state.costs[i]?.[j] ?? '0');
        if (n === null || n < 0) return null;
        row.push(n);
      }
      costs.push(row);
    }
    const supply: number[] = [];
    for (let i = 0; i < state.rows; i++) {
      const n = parseNumber(state.supply[i] ?? '0');
      if (n === null || n < 0) return null;
      supply.push(n);
    }
    const demand: number[] = [];
    for (let j = 0; j < state.cols; j++) {
      const n = parseNumber(state.demand[j] ?? '0');
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
      const solvers = {
        'north-west-corner': solveTransportNorthWest,
        'minimum-cost': solveTransportMinimumCost,
        'vogel': solveTransportVogel,
      };
      const result = await solvers[state.method](data);
      dispatch({ type: 'SOLVE_SUCCESS', result });
    } catch (e) {
      dispatch({ type: 'SOLVE_ERROR', error: e instanceof Error ? e.message : 'Error desconocido' });
    }
  }, [state.method, getRequestData]);

  return {
    ...state,
    startModule,
    reset,
    setDimensions,
    setCost,
    setSupply,
    setDemand,
    setRowLabel,
    setColLabel,
    setMethod,
    solve,
    getRequestData,
  };
}
