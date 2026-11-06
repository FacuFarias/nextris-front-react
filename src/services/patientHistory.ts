import { api } from '@/lib/api';
import type { CombinedHistoryResponse } from '@/types/patientHistory';

export const combinedHistoryKey = (patientId?: string) => ['patient-history-combined', patientId];

export async function getCombinedPatientHistory(patientId: string): Promise<CombinedHistoryResponse> {
    return (await api.get<CombinedHistoryResponse>(`/patients/${encodeURIComponent(patientId)}/history/combined`)).data;
}
