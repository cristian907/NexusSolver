export type { TransportProblemRequest } from '../../../types/api';

export type TransportMethod = 'north-west-corner' | 'minimum-cost' | 'vogel';

export const TRANSPORT_METHODS: { value: TransportMethod; label: string }[] = [
  { value: 'north-west-corner', label: 'Esquina Noroeste' },
  { value: 'minimum-cost', label: 'Costo Mínimo' },
  { value: 'vogel', label: 'Vogel (VAM)' },
];
