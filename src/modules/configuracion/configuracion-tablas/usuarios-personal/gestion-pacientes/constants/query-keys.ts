import type { PatientListParams } from '../types/patients.types';

export const patientKeys = {
    all: ['patients'] as const,
    lists: () => [...patientKeys.all, 'list'] as const,
    list: (params: PatientListParams) => [...patientKeys.lists(), params] as const,
    details: () => [...patientKeys.all, 'detail'] as const,
    detail: (id: string) => [...patientKeys.details(), id] as const,
};
