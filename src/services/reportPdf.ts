import { api } from '@/lib/api';

const absolute = (path: string) => `${api.defaults.baseURL ?? ''}${path}`;

export const staffReportPdfLink = (examId: string) => `/reports/${encodeURIComponent(examId)}/pdf-link`;
export const portalReportPdfLink = (examId: string) => `/veterinary/portal/reports/${encodeURIComponent(examId)}/pdf-link`;

/** Pide al servidor una URL firmada; así el navegador usa el nombre de archivo real del informe. */
export async function getReportPdfUrl(linkPath: string) {
    try {
        const response = await api.post<{ data: { url: string } }>(linkPath, {}, { timeout: 45000 });
        return absolute(response.data.data.url);
    } catch (error) {
        const failure = error as { response?: { data?: { message?: string } } };
        throw new Error(failure.response?.data?.message || (error instanceof Error ? error.message : 'No se pudo abrir el informe'));
    }
}

export async function downloadReportPdf(linkPath: string) {
    const link = document.createElement('a');
    link.href = await getReportPdfUrl(linkPath);
    link.download = '';
    link.click();
}

/** Llamar directo desde el clic: la pestaña se reserva antes de esperar, para que el navegador no la bloquee. */
export async function openReportPdf(linkPath: string) {
    const tab = window.open('', '_blank');
    if (tab) {
        tab.opener = null;
        tab.document.title = 'Abriendo informe…';
        tab.document.body.textContent = 'Abriendo informe…';
    }
    try {
        const url = await getReportPdfUrl(linkPath);
        if (tab && !tab.closed) {
            tab.location.replace(url);
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = '';
            link.click();
        }
    } catch (error) {
        tab?.close();
        throw error;
    }
}

export const openPublicReportPdf = (shortCode: string) => {
    window.open(absolute(`/s/${encodeURIComponent(shortCode)}/report.pdf`), '_blank', 'noopener');
};
