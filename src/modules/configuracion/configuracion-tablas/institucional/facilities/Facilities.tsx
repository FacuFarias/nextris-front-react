import TablaDynamic from "@/components/TableDynamic";
import { useFacilities } from "./hooks/useFacilities";
import { useState } from "react";
import { facilityColumns, getFacilityActions } from "./components/columns";
import { PrimaryButton } from "@/components";
import { FacilityModal } from "./components/FacilityModal";
import { FacilityPlanModal } from "./components/FacilityPlanModal";
import type { FacilityFormData } from "./types/facilities.types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { facilitiesService } from "./services/facilities.service";
import { Checkbox } from "@/components/ui/checkbox";

export const Facilities = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<any>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    const { facilities, plans, isLoading, createFacility, updateFacility, activateFacility, deactivateFacility } = useFacilities();

    const selectedFacilityId = selectedFacility?.guid as string | undefined;
    const visibleFacilities = (facilities?.data || []).filter((facility) => {
        if (includeInactive) {
            return true;
        }

        return String(facility.status || "").trim().toLowerCase() !== "inactive";
    });

    const { data: usageHistoryResponse } = useQuery({
        queryKey: ["facility-usage-history", selectedFacilityId],
        queryFn: () => facilitiesService.getUsageMonthly(selectedFacilityId as string, 12),
        enabled: Boolean(selectedFacilityId && isEditModalOpen),
    });

    const { data: planChangeLogsResponse } = useQuery({
        queryKey: ["facility-plan-change-logs", selectedFacilityId],
        queryFn: () => facilitiesService.getPlanChangeLogs(selectedFacilityId as string, 30),
        enabled: Boolean(selectedFacilityId && isEditModalOpen),
    });

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenEditModal = (facility?: any) => {
        setSelectedFacility(facility || null);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedFacility(null);
    };

    const handleOpenPlanModal = (facility: any) => {
        setSelectedFacility(facility);
        setIsPlanModalOpen(true);
    };

    const handleClosePlanModal = () => {
        setIsPlanModalOpen(false);
        setSelectedFacility(null);
    };

    const handleSubmit = (data: FacilityFormData) => {

        // Aquí irá la lógica para crear o actualizar la facility
        if (selectedFacility) {
            // Actualizar
            updateFacility(
                { id: selectedFacility.guid, data: data as any },
                {
                    onSuccess: () => {
                        toast.success("Facility actualizada exitosamente");
                        handleCloseEditModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la facility");
                    },
                }
            );
        } else {
            // Crear
            createFacility(data as any, {
                onSuccess: () => {
                    toast.success("Facility creada exitosamente");
                    handleCloseEditModal();
                },
                onError: () => {
                    toast.error("Error al crear la facility");
                },
            });
        }

        handleCloseEditModal();
    };

    const handlePlanSubmit = (planCode: string) => {
        if (!selectedFacility?.guid) {
            return;
        }

        updateFacility(
            { id: selectedFacility.guid, data: { plan_code: planCode } as any },
            {
                onSuccess: () => {
                    toast.success("Plan actualizado exitosamente");
                    handleClosePlanModal();
                },
                onError: () => {
                    toast.error("Error al actualizar el plan");
                },
            }
        );
    };

    const handleActivateFacility = (facility: any) => {
        activateFacility(facility.guid, {
            onSuccess: () => {
                toast.success("Institución activada exitosamente");
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || "Error al activar la institución");
            },
        });
    };

    const handleDeactivateFacility = (facility: any) => {
        if (!confirm(`¿Desea desactivar la institución ${facility.name}? También se desactivarán sus ubicaciones.`)) {
            return;
        }

        deactivateFacility(facility.guid, {
            onSuccess: () => {
                toast.success("Institución desactivada exitosamente. Sus ubicaciones fueron desactivadas.");
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || "Error al desactivar la institución");
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">INSTITUCIONES</h2>
                    <p className="text-muted-foreground">Gestión de instalaciones médicas</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                            checked={includeInactive}
                            onCheckedChange={(checked) => setIncludeInactive(Boolean(checked))}
                        />
                        Ver inactivas
                    </label>
                    <PrimaryButton onClick={() => handleOpenEditModal()}>
                        Nueva Institución
                    </PrimaryButton>
                </div>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={visibleFacilities}
                    columns={facilityColumns}
                    showIndex
                    actions={getFacilityActions(
                        (facility) => {
                            handleOpenEditModal(facility);
                        },
                        (facility) => {
                            handleOpenPlanModal(facility);
                        },
                        (facility) => {
                            handleActivateFacility(facility);
                        },
                        (facility) => {
                            handleDeactivateFacility(facility);
                        }
                    )}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: visibleFacilities.length,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            {/* Modal de Crear/Editar */}
            <FacilityModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSubmit={handleSubmit}
                initialData={selectedFacility ? {
                    description: selectedFacility.description || selectedFacility.name || "",
                    id_patientdomain: selectedFacility.id_patientdomain || selectedFacility.patientdomain_id || "",
                    plan_code: selectedFacility.plan?.code?.toLowerCase() || "free",
                    // SMTP Config
                    smtp_server: selectedFacility.smtp_config?.smtp_server,
                    smtp_port: selectedFacility.smtp_config?.smtp_port,
                    smtp_user: selectedFacility.smtp_config?.smtp_user,
                    smtp_password: selectedFacility.smtp_config?.smtp_password,
                    smtp_from: selectedFacility.smtp_config?.smtp_from,
                    smtp_from_name: selectedFacility.smtp_config?.smtp_from_name,
                    smtp_use_tls: selectedFacility.smtp_config?.smtp_use_tls ?? selectedFacility.smtp_config?.use_tls,
                    // Backend Config
                    backend_db_user: selectedFacility.backend_config?.backend_db_user ?? selectedFacility.backend_config?.db_user,
                    backend_db_password: selectedFacility.backend_config?.backend_db_password ?? selectedFacility.backend_config?.db_password,
                    backend_db_host: selectedFacility.backend_config?.backend_db_host ?? selectedFacility.backend_config?.db_host,
                    backend_db_port: selectedFacility.backend_config?.backend_db_port ?? selectedFacility.backend_config?.db_port,
                    backend_db_name: selectedFacility.backend_config?.backend_db_name ?? selectedFacility.backend_config?.db_name,
                    backend_base_folder: selectedFacility.backend_config?.backend_base_folder ?? selectedFacility.backend_config?.base_folder,
                    backend_ipserver: selectedFacility.backend_config?.backend_ipserver ?? selectedFacility.backend_config?.ipserver,
                    // WhatsApp Config
                    whatsapp_api_url: selectedFacility.whatsapp_config?.whatsapp_api_url ?? selectedFacility.whatsapp_config?.api_url,
                    whatsapp_token: selectedFacility.whatsapp_config?.whatsapp_token ?? selectedFacility.whatsapp_config?.api_token,
                    whatsapp_phone_number_id: selectedFacility.whatsapp_config?.whatsapp_phone_number_id ?? selectedFacility.whatsapp_config?.phone_number_id,
                    whatsapp_business_account_id: selectedFacility.whatsapp_config?.whatsapp_business_account_id ?? selectedFacility.whatsapp_config?.business_account_id,
                    whatsapp_webhook_verify_token: selectedFacility.whatsapp_config?.whatsapp_webhook_verify_token ?? selectedFacility.whatsapp_config?.webhook_verify_token,
                    whatsapp_is_active: selectedFacility.whatsapp_config?.whatsapp_is_active ?? selectedFacility.whatsapp_config?.is_active,
                } : undefined}
                plans={plans?.data || []}
                usageHistory={usageHistoryResponse?.data || []}
                planChangeLogs={planChangeLogsResponse?.data || []}
                isLoading={false}
            />

            <FacilityPlanModal
                isOpen={isPlanModalOpen}
                onClose={handleClosePlanModal}
                onSubmit={handlePlanSubmit}
                facilityName={selectedFacility?.name || selectedFacility?.description}
                initialPlanCode={selectedFacility?.plan?.code}
                plans={plans?.data || []}
                isLoading={false}
            />
        </div>
    )
}
