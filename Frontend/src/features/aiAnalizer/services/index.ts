import { request } from '../../../services/api';
import type { SolveRequest, SolveResponse, AnalyzeRequest, AnalyzeResponse } from '../../../types/api';

export function solveCombined(req: SolveRequest) {
  return request<SolveResponse>('/api/calcs/solve', req);
}

export function analyzeResults(req: AnalyzeRequest) {
  return request<AnalyzeResponse>('/api/ai/analyze', req);
}
