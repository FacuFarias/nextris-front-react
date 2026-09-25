import { DynamicBreadcrumb, InputSearch } from "@/components"
import TablaDynamic from "@/components/TableDynamic";
import { MainLayout } from "@/layouts/layout"
import { AlertTriangle, Navigation } from "lucide-react"
import { useState } from "react";
import { useDistribucion } from "./hooks/useDistribucion";
import { distribucionColumns } from "./components/columns";
import { getDistribucionActions } from "./components/actions";
import type { Examen } from "./types/distribucion.types";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { distribucionService } from "./services/distribucion.service";
import { useAppConfig } from "@/context/AppConfigContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import fondoImage from "@/assets/mail.jpg";
import backDarkImage from "@/assets/dark-calendar.jpg";

export const Distribucion = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [allReported, setAllReported] = useState(false);
    const [dateField, setDateField] = useState<string>("admision");
    const [dateRange, setDateRange] = useState<string>("all");
    const isEnviadoFilter = dateField === "enviado";

    const { config } = useAppConfig();

    const { data: facilityPlanData } = useQuery({
        queryKey: ["facility-plan", config?.id?.toString() || "1", "distribucion"],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${config?.id?.toString() || "1"}/plan`);
            return response.data?.data || null;
        },
        enabled: Boolean(config?.id?.toString() || "1"),
        staleTime: 60 * 1000,
    });

    const distributeMonthlyLimit: number | null = facilityPlanData?.plan?.max_distribute_monthly ?? null;
    const distributedCount: number = facilityPlanData?.usage_monthly?.distributed_count ?? 0;
    const isDistributeLimitReached =
        typeof distributeMonthlyLimit === "number"
        && distributeMonthlyLimit >= 0
        && distributedCount >= distributeMonthlyLimit;

    const {
        examenes,
        isLoading,
        isFetching,
        error: distributionError,
        sendReportAsync,
    } = useDistribucion(allReported, page, pageSize, dateRange, dateField);

    const pagination = {
        page: examenes?.data?.page || page,
        pageSize: examenes?.data?.per_page || pageSize,
        total: examenes?.data?.total || 0,
    };
    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleSendReport = async (examen: Examen) => {
        if (isDistributeLimitReached) {
            toast.error(`Límite mensual de distribución alcanzado (${distributedCount}/${distributeMonthlyLimit}).`);
            return;
        }

        try {
            await sendReportAsync({ examId: examen.guid });
            toast.success("Informe enviado correctamente");
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            toast.error(backendMessage || "Error al enviar el informe");
            console.error(error);
        }
    };

    const handleViewReport = async (examen: Examen) => {
        try {
            await distribucionService.viewReport(examen.guid);
            toast.success("Abriendo informe en nueva pestaña");
        } catch (error) {
            toast.error("Error al abrir el informe");
            console.error("Error al abrir informe:", error);
        }
    };

    const handleOpenDicomViewer = async (examen: Examen) => {
        try {
            toast.loading("Abriendo visor DICOM...");
            await distribucionService.getDicomViewer(examen.guid);
            toast.dismiss();
            toast.success("Visor DICOM abierto en nueva pestaña");
        } catch (error) {
            toast.dismiss();
            toast.error("Error al abrir el visor DICOM");
            console.error("Error al abrir visor DICOM:", error);
        }
    };

    const actions = getDistribucionActions(
        handleSendReport,
        handleViewReport,
        handleOpenDicomViewer,
        isDistributeLimitReached,
    );

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 h-full flex flex-col overflow-hidden">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Distribución de informes</h1>
                </div>

                {isDistributeLimitReached && (
                    <div className="mb-3 rounded-lg border border-red-500/70 bg-red-500/15 px-4 py-3 text-sm text-red-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <strong className="font-semibold">Límite alcanzado:</strong> ya no tienes disponibilidad para distribuir más estudios este mes ({distributedCount}/{distributeMonthlyLimit}).
                        </div>
                    </div>
                )}

                {/* Barra de búsqueda y filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar paciente, examen o email..."
                    />

                    <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg dark:bg-[#2a2e32]">
                        <Switch
                            id="all-reported"
                            checked={isEnviadoFilter ? true : allReported}
                            onCheckedChange={setAllReported}
                            disabled={isEnviadoFilter}
                        />
                        <Label htmlFor="all-reported" className="text-sm cursor-pointer">
                            Incluir enviados
                        </Label>
                    </div>

                    {/* Filtro de Fecha */}
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg dark:bg-[#2a2e32]">
                        <Select value={dateField} onValueChange={(v) => { setDateField(v); if (v === 'enviado') setAllReported(true); setPage(1); }}>
                            <SelectTrigger className="h-9 text-sm min-w-[100px] border-0 bg-transparent">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admision">Admisión</SelectItem>
                                <SelectItem value="estudio">Estudio</SelectItem>
                                <SelectItem value="enviado">Enviado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
                            <SelectTrigger className="h-9 text-sm min-w-[130px] border-0 bg-transparent">
                                <SelectValue placeholder="Hasta" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo</SelectItem>
                                <SelectItem value="1d">Último día</SelectItem>
                                <SelectItem value="3d">Últimos 3 días</SelectItem>
                                <SelectItem value="7d">Últimos 7 días</SelectItem>
                                <SelectItem value="14d">Últimos 14 días</SelectItem>
                                <SelectItem value="1m">Último mes</SelectItem>
                                <SelectItem value="2m">Últimos 2 meses</SelectItem>
                                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                                <SelectItem value="1y">Último año</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabla de resultados */}
                <TablaDynamic
                    data={examenes?.data?.data || []}
                    columns={distribucionColumns}
                    showIndex
                    loading={isLoading}
                    refreshing={isFetching && !isLoading}
                    refreshError={Boolean(distributionError)}
                    refreshScopeKey={JSON.stringify([allReported, page, pageSize, dateRange, dateField])}
                    filterAnimationKey={JSON.stringify([allReported, dateRange, dateField])}
                    preserveTableHeight
                    actions={actions}
                    pagination={pagination}
                    onPaginationChange={handlePaginationChange}
                    perPageValue={pageSize}
                    onPerPageChange={(value) => {
                        setPageSize(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    tableBackgroundImage={fondoImage}
                    tableBackgroundImageDark={backDarkImage}
                    mobileMode="cards"
                    stickyPagination
                />
            </div>
        </MainLayout>
    )
}
