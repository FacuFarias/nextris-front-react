import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, FileText, Image, Loader2, ShieldCheck } from "lucide-react";
import { brand } from "@/lib/brand";
import { formatDate, formatDateTime } from "@/lib/fechaYhora";
import { PatientReportDialog } from "@/modules/estudios/components/PatientReportDialog";
import type { PatientReportView } from "@/modules/estudios/types/patientReport";

interface CaseData {
    expires_at: string;
    patient: {
        name: string;
        id: string;
        sex: string | null;
        birthdate: string | null;
    };
    study: {
        accession_number: string;
        date: string | null;
        time: string | null;
        description: string;
        modality: string;
        image_count: number;
    };
    exam: {
        id: string;
        facility: string | null;
        institution: string | null;
        referring_physician: string | null;
    };
    responsibles?: { name: string; role: string; phone: string | null; email: string | null }[];
    report_available: boolean;
    viewer_url: string | null;
    report_url: string | null;
}

const responsibleRoles: Record<string, string> = { owner: "Propietario", guardian: "Tutor", custodian: "Cuidador", veterinarian: "Veterinario" };

const formatTime = (value: string | null) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 4) {
        return digits.slice(0, 2) + ":" + digits.slice(2, 4) + (digits.length >= 6 ? ":" + digits.slice(4, 6) : "");
    }
    return value;
};

const formatExpiry = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : formatDateTime(date);
};

export const CaseLink = () => {
    const { shortCode } = useParams<{ shortCode: string }>();
    const [expiredLink, setExpiredLink] = useState<string | null>(null);
    const [loadingReportCode, setLoadingReportCode] = useState<string | null>(null);
    const [reportFailure, setReportFailure] = useState<{ shortCode: string; message: string } | null>(null);
    const [report, setReport] = useState<{ shortCode: string; view: PatientReportView } | null>(null);
    const reportRequest = useRef<AbortController | null>(null);
    const { data: caseData, error, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["shared-case", shortCode],
        enabled: Boolean(shortCode),
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            try {
                const response = await api.get<{ success: boolean; data: CaseData; message?: string }>("/s/" + encodeURIComponent(shortCode!) + "/case");
                if (!response.data.success) throw new Error(response.data.message || "Enlace inválido o expirado");
                if (Date.parse(response.data.data.expires_at) <= Date.now()) throw new Error("Este enlace venció. Solicita un nuevo enlace a quien compartió el estudio.");
                return response.data.data;
            } catch (requestError: unknown) {
                const failure = requestError as { response?: { status?: number; data?: { message?: string } } };
                if (failure.response?.status === 410) throw new Error("Este enlace venció. Solicita un nuevo enlace a quien compartió el estudio.");
                throw new Error(failure.response?.data?.message || (requestError instanceof Error ? requestError.message : "No se pudo cargar el caso"));
            }
        },
    });
    useEffect(() => {
        if (!caseData) return;
        const timeout = window.setTimeout(() => setExpiredLink(caseData.expires_at), Math.min(Math.max(0, Date.parse(caseData.expires_at) - Date.now()), 2147483647));
        return () => window.clearTimeout(timeout);
    }, [caseData]);
    const expired = caseData && (expiredLink === caseData.expires_at || Date.parse(caseData.expires_at) <= Date.now());
    const reportLoading = loadingReportCode === shortCode;
    const reportError = reportFailure && reportFailure.shortCode === shortCode ? reportFailure.message : null;
    useEffect(() => {
        const controller = new AbortController();
        reportRequest.current = controller;
        return () => controller.abort();
    }, [shortCode, expired]);

    const openReport = async () => {
        if (!shortCode || expired) return;
        const controller = reportRequest.current;
        if (!controller || controller.signal.aborted) return;
        setLoadingReportCode(shortCode);
        setReportFailure(null);
        try {
            const response = await api.get<{ success: boolean; data: PatientReportView; message?: string }>(
                `/s/${encodeURIComponent(shortCode)}/report`, { timeout: 20000, signal: controller.signal },
            );
            if (!response.data.success || response.data.data?.source !== "nextris" || !response.data.data.document) {
                throw new Error(response.data.message || "No se pudo consultar el informe en NextRIS");
            }
            if (!controller.signal.aborted) setReport({ shortCode, view: response.data.data });
        } catch (error: unknown) {
            const failure = error as { response?: { data?: { message?: string } } };
            if (!controller.signal.aborted) setReportFailure({ shortCode, message: failure.response?.data?.message
                || (error instanceof Error ? error.message : "No se pudo abrir el informe") });
        } finally {
            if (!controller.signal.aborted) setLoadingReportCode(null);
        }
    };

    if (isLoading) {
        return (
            <div role="status" aria-label="Cargando estudio compartido" className="patient-case flex min-h-dvh items-center justify-center bg-[#f7f3fc]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
            </div>
        );
    }

    if (!caseData || expired || error) {
        return (
            <div className="patient-case flex min-h-dvh items-center justify-center bg-[#f7f3fc] p-4">
                <div className="w-full max-w-md rounded-xl border border-purple-100 bg-white p-8 text-center shadow-lg">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <h1 className="text-xl font-semibold text-slate-900">Enlace no disponible</h1>
                    <p className="mt-2 text-sm text-slate-600">{expired ? "Este enlace venció. Solicita un nuevo enlace a quien compartió el estudio." : error?.message || "Este enlace del caso es inválido o expiró."}</p>
                    {!expired && <Button variant="outline" onClick={() => { void refetch(); }} disabled={isFetching} className="mt-4 min-h-11">Reintentar</Button>}
                </div>
            </div>
        );
    }

    return (
        <div className="patient-case h-dvh bg-[#f7f3fc] p-2 text-slate-800 sm:p-4 md:flex md:items-center md:justify-center">
            <main className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xl md:h-auto md:max-h-full md:w-full md:max-w-5xl">
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <header className="bg-gradient-to-r from-[#4a148c] via-[#6a1bb0] to-[#8e24aa] px-3 py-4 text-white sm:px-6">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-5">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm sm:h-20 sm:w-24 lg:h-24 lg:w-28 lg:p-2">
                                    <img src={brand.logo} alt={`Logo de ${brand.name}`} className="max-h-full max-w-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg font-bold tracking-[0.15em] sm:text-2xl sm:tracking-[0.25em]">{brand.name.toUpperCase()}</p>
                                    <p className="mt-1 text-xs text-purple-100 sm:text-sm">{brand.veterinary ? "Estudio veterinario compartido" : "Estudio médico compartido"}</p>
                                </div>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-lg bg-white p-1 shadow-sm sm:h-14 sm:w-14 lg:h-16 lg:w-16 lg:p-1.5">
                                <img src={brand.productLogo} alt="Logo de NextRIS" className="max-h-full max-w-full object-contain" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-start gap-2 text-xs text-purple-100 sm:text-sm [&>svg]:shrink-0">
                            <ShieldCheck className="h-4 w-4" />
                            Este enlace vence el {formatExpiry(caseData.expires_at)}
                        </div>
                    </header>

                    <section className={`grid divide-y border-b ${brand.veterinary ? "lg:grid-cols-3 lg:divide-x lg:divide-y-0" : "md:grid-cols-2 md:divide-x md:divide-y-0"}`}>
                        <InfoSection title={brand.veterinary ? "Animal" : "Paciente"} items={[
                            ["Nombre", caseData.patient.name || "-"],
                            [brand.veterinary ? "ID del animal" : "ID del paciente", caseData.patient.id || "-"],
                            ["Sexo", caseData.patient.sex || "-"],
                            ["Fecha de nacimiento", formatDate(caseData.patient.birthdate) || "-"],
                        ]} />
                        {brand.veterinary && <div className="min-w-0 divide-y">
                            {(caseData.responsibles?.length ? caseData.responsibles : [null]).map((owner, index) => (
                                <InfoSection key={index} title={index ? `Responsable ${index + 1}` : "Responsable"} items={owner ? [
                                    ["Nombre", owner.name],
                                    ["Relación", responsibleRoles[owner.role] || owner.role],
                                    ["Teléfono", owner.phone || "-"],
                                    ["Email", owner.email || "-", true],
                                ] : [["Nombre", "No registrado"]]} />
                            ))}
                        </div>}
                        <InfoSection title="Estudio de imágenes" items={[
                            ["N.º de acceso", caseData.study.accession_number || "-"],
                            ["Fecha del estudio", (formatDate(caseData.study.date) + " " + formatTime(caseData.study.time)).trim()],
                            ["Descripción", caseData.study.description || "-"],
                            ["Modalidad", caseData.study.modality || "-"],
                            ["Cantidad de imágenes", String(caseData.study.image_count)],
                        ]} />
                    </section>

                    <footer className="bg-[#fbf9fe] px-4 py-3 text-center text-xs text-slate-500 sm:px-6">
                        Este enlace del caso fue generado por {brand.name}. Solo permite acceder al estudio asociado al enlace.
                    </footer>
                </div>

                <section aria-label="Acciones del estudio" className="shrink-0 border-t bg-white px-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
                    {reportError && <p role="alert" className="mb-3 max-h-24 overflow-y-auto text-center text-sm text-red-600">{reportError}</p>}
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:flex sm:justify-center sm:gap-3 [&>button]:min-h-14 [&>button]:min-w-0 [&>button]:flex-col [&>button]:gap-1 [&>button]:whitespace-normal [&>button]:px-2 [&>button]:py-2 [&>button]:text-xs [&>button]:leading-tight sm:[&>button]:min-h-11 sm:[&>button]:flex-row sm:[&>button]:gap-2 sm:[&>button]:px-4 sm:[&>button]:text-sm">
                        <Button disabled={!caseData.viewer_url || caseData.study.image_count === 0} onClick={() => { if (caseData.viewer_url) window.open(caseData.viewer_url, "_blank", "noopener,noreferrer") }} className="gap-2 bg-[#6a1bb0] hover:bg-[#4a148c]">
                            <Image className="h-4 w-4" />
                            {caseData.study.image_count > 0 ? "Ver estudio" : "Sin imágenes"}
                        </Button>
                        <Button
                            disabled={reportLoading || !caseData.report_available}
                            variant="outline"
                            className="gap-2"
                            onClick={() => void openReport()}
                        >
                            {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            {reportLoading ? "Consultando reporte…" : "Ver reporte"}
                        </Button>
                        <Button variant="outline" onClick={() => window.close()} className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Salir
                        </Button>
                    </div>
                </section>
                <PatientReportDialog view={report && report.shortCode === shortCode ? report.view : null} onClose={() => setReport(null)} />
            </main>
        </div>
    );
};

const InfoSection = ({ title, items }: { title: string; items: ([string, string] | [string, string, boolean])[] }) => (
    <div className="min-w-0 p-3 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-[#6a1bb0]">{title}</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {items.map(([label, value, wide]) => (
                <div key={label} className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
                    <dt className="text-xs text-slate-500">{label}:</dt>
                    <dd className="mt-1 min-w-0 text-sm font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</dd>
                </div>
            ))}
        </dl>
    </div>
);
