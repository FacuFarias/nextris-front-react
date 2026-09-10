import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, FileText, Image, Loader2, ShieldCheck } from "lucide-react";
import nextrisLogo from "@/assets/logo/logo5.png";
import clinicaParqueLogo from "@/assets/logo/CLINICA PARQUE_LOGO.png";
import { formatDate, formatDateTime } from "@/lib/fechaYhora";

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
    report_available: boolean;
    viewer_url: string;
    report_url: string | null;
}

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
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!shortCode) {
            setError("El enlace del caso no es válido.");
            setIsLoading(false);
            return;
        }

        api.get<{ success: boolean; data: CaseData; message?: string }>("/s/" + shortCode + "/case")
            .then((response) => {
                if (!response.data.success) throw new Error(response.data.message || "Enlace inválido o expirado");
                setCaseData(response.data.data);
            })
            .catch((requestError: unknown) => {
                setError(
                    (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    (requestError instanceof Error ? requestError.message : "No se pudo cargar el caso")
                );
            })
            .finally(() => setIsLoading(false));
    }, [shortCode]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7f3fc]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7f3fc] p-4">
                <div className="w-full max-w-md rounded-xl border border-purple-100 bg-white p-8 text-center shadow-lg">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <h1 className="text-xl font-semibold text-slate-900">Enlace no disponible</h1>
                    <p className="mt-2 text-sm text-slate-600">{error || "Este enlace del caso es inválido o expiró."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f3fc] px-4 py-8 text-slate-800 sm:px-8">
            <main className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-purple-100 bg-white shadow-xl">
                <header className="bg-gradient-to-r from-[#4a148c] via-[#6a1bb0] to-[#8e24aa] px-6 py-7 text-white sm:px-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                                <img src={nextrisLogo} alt="Logo de NextRIS" className="h-full w-full object-contain" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold tracking-[0.25em]">NEXTRIS</p>
                                <p className="mt-1 text-sm text-purple-100">Enlace del caso · Estudio médico compartido</p>
                            </div>
                        </div>
                        <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-lg bg-white px-2 shadow-sm">
                            <img src={clinicaParqueLogo} alt="Logo de Clínica Parque" className="max-h-full max-w-full object-contain" />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm text-purple-100">
                        <ShieldCheck className="h-4 w-4" />
                        Este enlace vence el {formatExpiry(caseData.expires_at)}
                    </div>
                </header>

                <section className="grid divide-y border-b md:grid-cols-3 md:divide-x md:divide-y-0">
                    <InfoSection title="Paciente" items={[
                        ["Nombre", caseData.patient.name || "-"],
                        ["ID del paciente", caseData.patient.id || "-"],
                        ["Sexo", caseData.patient.sex || "-"],
                        ["Fecha de nacimiento", formatDate(caseData.patient.birthdate)],
                    ]} />
                    <InfoSection title="Estudio de imágenes" items={[
                        ["N.º de acceso", caseData.study.accession_number || "-"],
                        ["Fecha del estudio", (formatDate(caseData.study.date) + " " + formatTime(caseData.study.time)).trim()],
                        ["Descripción", caseData.study.description || "-"],
                        ["Modalidad", caseData.study.modality || "-"],
                        ["Cantidad de imágenes", String(caseData.study.image_count)],
                    ]} />
                    <InfoSection title="Examen" items={[
                        ["Sede", caseData.exam.facility || "-"],
                        ["Institución", caseData.exam.institution || "-"],
                        ["Médico referente", caseData.exam.referring_physician || "-"],
                        ["ID del examen", caseData.exam.id || "-"],
                    ]} />
                </section>

                <section className="flex flex-wrap items-center justify-center gap-3 px-6 py-7 sm:px-10">
                    <Button onClick={() => window.open(caseData.viewer_url, "_blank", "noopener,noreferrer")} className="gap-2 bg-[#6a1bb0] hover:bg-[#4a148c]">
                        <Image className="h-4 w-4" />
                        Ver estudio
                    </Button>
                    <Button
                        disabled={!caseData.report_available || !caseData.report_url}
                        onClick={() => caseData.report_url && window.open(caseData.report_url, "_blank", "noopener,noreferrer")}
                        className="gap-2 bg-[#6a1bb0] hover:bg-[#4a148c]"
                        title={caseData.report_available ? "Ver reporte" : "Reporte no disponible"}
                    >
                        <FileText className="h-4 w-4" />
                        {caseData.report_available ? "Ver reporte" : "Reporte no disponible"}
                    </Button>
                    <Button variant="outline" onClick={() => window.close()} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Salir
                    </Button>
                </section>

                <footer className="border-t bg-[#fbf9fe] px-6 py-5 text-center text-xs text-slate-500 sm:px-10">
                    Este enlace del caso fue generado por NextRIS. Solo permite acceder al estudio asociado al enlace.
                </footer>
            </main>
        </div>
    );
};

const InfoSection = ({ title, items }: { title: string; items: [string, string][] }) => (
    <div className="p-6 sm:p-8">
        <h2 className="mb-5 text-lg font-medium text-[#6a1bb0]">{title}</h2>
        <dl className="space-y-4">
            {items.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[minmax(110px,auto)_1fr] gap-3 text-sm">
                    <dt className="text-slate-500">{label}:</dt>
                    <dd className="break-words font-medium text-slate-800">{value}</dd>
                </div>
            ))}
        </dl>
    </div>
);
