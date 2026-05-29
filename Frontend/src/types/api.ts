export interface ResultadoTransporteResponse {
  matriz_costos_original: number[][];
  matriz_costos_balanceada: number[][];
  oferta_original: number[];
  demanda_original: number[];
  oferta_balanceada: number[];
  demanda_balanceada: number[];
  asignaciones: number[][];
  costo_total: number;
  fue_balanceada: boolean;
  tipo_balanceo: string;
  pasos: string[];
}

export interface SolveRequest {
  transport_problem?: TransportProblemRequest;
  assignment_problem?: AssignmentProblemRequest;
}

export interface SolveResponse {
  transport_result?: ResultadoTransporteResponse;
  assignment_result?: ResultadoTransporteResponse;
}

export interface AnalyzeRequest {
  transport_result?: ResultadoTransporteResponse;
  assignment_result?: ResultadoTransporteResponse;
  transport_origin_names?: string[];
  transport_destination_names?: string[];
  assignment_origin_names?: string[];
  assignment_destination_names?: string[];
}

export interface AnalyzeResponse {
  analysis: string;
}

export interface TransportProblemRequest {
  costs: number[][];
  supply: number[];
  demand: number[];
  method?: 'minimum-cost' | 'north-west-corner' | 'vogel';
  origin_names?: string[];
  destination_names?: string[];
}

export interface AssignmentProblemRequest {
  costs: number[][];
  supply: number[];
  demand: number[];
  method?: 'hungarian-min' | 'hungarian-max';
  origin_names?: string[];
  destination_names?: string[];
}
