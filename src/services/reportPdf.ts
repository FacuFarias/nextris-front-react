import { api } from "@/lib/api";

const openBlobUrl = (blob: Blob, target?: Window | null) => {
    const url = URL.createObjectURL(blob);
    const windowRef = target || window.open("about:blank", "_blank");
    if (windowRef) {
        windowRef.location.href = url;
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
        URL.revokeObjectURL(url);
    }
    return windowRef;
};

export const fetchReportPdf = async (examId: string, download = false) => {
    const response = await api.get(`/reports/${encodeURIComponent(examId)}/pdf`, {
        params: download ? { download: true } : undefined,
        responseType: "blob",
    });
    return new Blob([response.data], { type: "application/pdf" });
};

export const openReportPdf = async (examId: string) => {
    const target = window.open("about:blank", "_blank");
    if (!target) throw new Error("El navegador bloqueó la ventana del informe");
    try {
        const blob = await fetchReportPdf(examId);
        openBlobUrl(blob, target);
    } catch (error) {
        target.close();
        throw error;
    }
};

export const downloadReportPdf = async (examId: string) => {
    const blob = await fetchReportPdf(examId, true);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `informe_${examId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
};

export const reportPdfObjectUrl = async (examId: string) => {
    const blob = await fetchReportPdf(examId);
    return URL.createObjectURL(blob);
};
