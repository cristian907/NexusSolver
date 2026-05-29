import { request } from '../../../services/api';
import type { AssignmentProblemRequest, ResultadoTransporteResponse } from '../../../types/api';

export function solveAssignmentHungarianMin(req: AssignmentProblemRequest) {
  return request<ResultadoTransporteResponse>('/api/calcs/assignment/hungarian/min', req);
}

export function solveAssignmentHungarianMax(req: AssignmentProblemRequest) {
  return request<ResultadoTransporteResponse>('/api/calcs/assignment/hungarian/max', req);
}
