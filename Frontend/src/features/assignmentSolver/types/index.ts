export type { AssignmentProblemRequest } from '../../../types/api';

export type AssignmentMethod = 'hungarian-min' | 'hungarian-max';

export const ASSIGNMENT_METHODS: { value: AssignmentMethod; label: string }[] = [
  { value: 'hungarian-min', label: 'Húngaro (Minimización)' },
  { value: 'hungarian-max', label: 'Húngaro (Maximización)' },
];
