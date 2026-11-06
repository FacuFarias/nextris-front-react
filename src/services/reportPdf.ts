import { api } from '@/lib/api';

async function failureMessage(error: unknown) {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (data instanceof Blob) {
        try { return JSON.parse(await data.text()).message as string; } catch { /* mensaje genérico */ }
    }
    return error instanceof Error ? error.message : 'No se pudo abrir el informe';
}

export async function fetchReportPdf(path: string) {
    try {
        const response = await api.get<Blob>(path, { responseType: 'blob', timeout: 45000 });
        return URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    } catch (error) {
        throw new Error(await failureMessage(error) || 'No se pudo abrir el informe');
    }
}

/** Llamar directo desde el clic: la pestaña se reserva antes de esperar, para que el navegador no la bloquee. */
export async function openReportPdf(path: string) {
    const tab = window.open('', '_blank');
    if (tab) {
        tab.opener = null;
        tab.document.title = 'Abriendo informe…';
        tab.document.body.textContent = 'Abriendo informe…';
    }
    try {
        const url = await fetchReportPdf(path);
        if (tab && !tab.closed) {
            tab.location.replace(url);
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = 'informe.pdf';
            link.click();
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 300000);
    } catch (error) {
        tab?.close();
        throw error;
    }
}

export const staffReportPdfPath = (examId: string) => `/reports/${encodeURIComponent(examId)}/pdf`;
