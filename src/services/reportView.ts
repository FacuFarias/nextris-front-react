import { api } from '@/lib/api';
import type { PatientReportView } from '@/modules/estudios/types/patientReport';

export async function getReportView(examId: string): Promise<PatientReportView> {
    try {
        const response = await api.get(`/reports/${encodeURIComponent(examId)}/view`, { timeout: 20000 });
        const result = response.data?.data;
        if (result?.source !== 'nextris' || !result.report) {
            throw new Error('NextRIS no devolvió un informe disponible.');
        }
        return result;
    } catch (error: unknown) {
        const failure = error as { response?: { data?: { message?: string } } };
        throw new Error(failure.response?.data?.message
            || (error instanceof Error ? error.message : 'No se pudo consultar el informe en NextRIS. Intente nuevamente.'));
    }
}
