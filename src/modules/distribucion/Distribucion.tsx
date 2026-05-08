import { DynamicBreadcrumb, InputSearch } from "@/components"
import TablaDynamic from "@/components/TableDynamic";
import { MainLayout } from "@/layouts/layout"
import { AlertTriangle, Navigation } from "lucide-react"
import { useState } from "react";
import { useDistribucion } from "./hooks/useDistribucion";
import { distribucionColumns } from "./components/columns";
import { getDistribucionActions } from "./components/actions";
import { UpdateEmailModal } from "./components/UpdateEmailModal";
import { SendReportModal } from "./components/SendReportModal";
import type { Examen } from "./types/distribucion.types";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { distribucionService } from "./services/distribucion.service";
import { useFacility } from "@/context/FacilityContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import fondoImage from "@/assets/mail.jpg";
import backDarkImage from "@/assets/dark-calendar.jpg";

export const Distribucion = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [allReported, setAllReported] = useState(false);

    // Modals state
    const [isUpdateEmailModalOpen, setIsUpdateEmailModalOpen] = useState(false);
    const [isSendReportModalOpen, setIsSendReportModalOpen] = useState(false);
    const [selectedExamen, setSelectedExamen] = useState<Examen | null>(null);
    const { selectedFacilityId } = useFacility();

    const { data: facilityPlanData } = useQuery({
        queryKey: ["facility-plan", selectedFacilityId, "distribucion"],
        queryFn: async () => {
            const response = await api.get(`/config/facilities/${selectedFacilityId}/plan`);
            return response.data?.data || null;
        },
        enabled: Boolean(selectedFacilityId),
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
        sendReportAsync,
        isSendingReport,
        updateEmailAsync,
        isUpdatingEmail
    } = useDistribucion(allReported, page, pageSize, selectedFacilityId);

    const pagination = {
        page: examenes?.data?.page || page,
        pageSize: examenes?.data?.per_page || pageSize,
        total: examenes?.data?.total || 0,
    };
    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenUpdateEmailModal = (examen: Examen) => {
        setSelectedExamen(examen);
        setIsUpdateEmailModalOpen(true);
    };

    const handleOpenSendReportModal = (examen: Examen) => {
        if (isDistributeLimitReached) {
            toast.error(`Límite mensual de distribución alcanzado (${distributedCount}/${distributeMonthlyLimit}).`);
            return;
        }
        setSelectedExamen(examen);
        setIsSendReportModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsUpdateEmailModalOpen(false);
        setIsSendReportModalOpen(false);
        setSelectedExamen(null);
    };

    const handleUpdateEmail = async (email: string) => {
        if (!selectedExamen) return;

        try {
            await updateEmailAsync({
                examId: selectedExamen.guid,
                payload: { email }
            });
            toast.success("Email actualizado correctamente");
            handleCloseModals();
        } catch (error) {
            toast.error("Error al actualizar el email");
            console.error(error);
        }
    };

    const handleSendReport = async (email: string) => {
        if (!selectedExamen) return;
        if (isDistributeLimitReached) {
            toast.error(`Límite mensual de distribución alcanzado (${distributedCount}/${distributeMonthlyLimit}).`);
            return;
        }

        try {
            await sendReportAsync({
                examId: selectedExamen.guid,
                payload: { email }
            });
            toast.success("Informe enviado correctamente");
            handleCloseModals();
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            toast.error(backendMessage || "Error al enviar el informe");
            console.error(error);
        }
    };

    const handleViewReport = (examen: Examen) => {
        try {
            distribucionService.viewReport(examen.guid);
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
        handleOpenUpdateEmailModal,
        handleOpenSendReportModal,
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
                            checked={allReported}
                            onCheckedChange={setAllReported}
                        />
                        <Label htmlFor="all-reported" className="text-sm cursor-pointer">
                            Mostrar todos los enviados
                        </Label>
                    </div>
                </div>

                {/* Tabla de resultados */}
                <TablaDynamic
                    data={examenes?.data?.data || []}
                    columns={distribucionColumns}
                    showIndex
                    loading={isLoading}
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
                    stickyPagination
                />

                {/* Modal Actualizar Email */}
                <UpdateEmailModal
                    isOpen={isUpdateEmailModalOpen}
                    onClose={handleCloseModals}
                    onSubmit={handleUpdateEmail}
                    initialEmail={selectedExamen?.mail}
                    patientName={selectedExamen?.paciente}
                    isLoading={isUpdatingEmail}
                />

                {/* Modal Enviar Informe */}
                <SendReportModal
                    isOpen={isSendReportModalOpen}
                    onClose={handleCloseModals}
                    onSubmit={handleSendReport}
                    initialEmail={selectedExamen?.mail}
                    examName={selectedExamen?.examen}
                    patientName={selectedExamen?.paciente}
                    isLoading={isSendingReport}
                />
            </div>
        </MainLayout>
    )
}
