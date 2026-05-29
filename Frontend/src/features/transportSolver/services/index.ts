import { request } from '../../../services/api';
import type { TransportProblemRequest, ResultadoTransporteResponse } from '../../../types/api';

export function solveTransportNorthWest(req: TransportProblemRequest) {
  return request<ResultadoTransporteResponse>('/api/calcs/transport/north-west-corner', req);
}

export function solveTransportMinimumCost(req: TransportProblemRequest) {
  return request<ResultadoTransporteResponse>('/api/calcs/transport/minimum-cost', req);
}

export function solveTransportVogel(req: TransportProblemRequest) {
  return request<ResultadoTransporteResponse>('/api/calcs/transport/vogel', req);
}
