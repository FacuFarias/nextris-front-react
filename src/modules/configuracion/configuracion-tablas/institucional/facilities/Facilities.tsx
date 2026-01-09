import TablaDynamic from "@/components/TableDynamic";
import { useFacilities } from "./hooks/useFacilities";
import { useState } from "react";
import { facilityColumns, getFacilityActions } from "./components/columns";
import { PrimaryButton } from "@/components";
import { FacilityModal } from "./components/FacilityModal";
import type { FacilityFormData } from "./types/facilities.types";
import { toast } from "sonner";

export const Facilities = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<any>(null);

    const { facilities, isLoading, createFacility, updateFacility } = useFacilities();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (facility?: any) => {
        setSelectedFacility(facility || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedFacility(null);
    };

    const handleSubmit = (data: FacilityFormData) => {
        console.log('Datos a guardar:', data);

        // Aquí irá la lógica para crear o actualizar la facility
        if (selectedFacility) {
            // Actualizar
            updateFacility(
                { id: selectedFacility.guid, data: data as any },
                {
                    onSuccess: () => {
                        toast.success("Facility actualizada exitosamente");
                        handleCloseModal();
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
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la facility");
                },
            });
        }

        handleCloseModal();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Facilities</h2>
                    <p className="text-muted-foreground">Gestión de instalaciones médicas</p>
                </div>
                <PrimaryButton onClick={() => handleOpenModal()}>
                    Nueva Facility
                </PrimaryButton>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={facilities?.data || []}
                    columns={facilityColumns}
                    showIndex
                    actions={getFacilityActions((facility) => {
                        handleOpenModal(facility);
                    })}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: facilities?.data.length || 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            {/* Modal de Crear/Editar */}
            <FacilityModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedFacility ? {
                    description: selectedFacility.description,
                    // SMTP Config
                    smtp_server: selectedFacility.smtp_config?.smtp_server,
                    smtp_port: selectedFacility.smtp_config?.smtp_port,
                    smtp_user: selectedFacility.smtp_config?.smtp_user,
                    smtp_password: selectedFacility.smtp_config?.smtp_password,
                    smtp_from: selectedFacility.smtp_config?.smtp_from,
                    smtp_from_name: selectedFacility.smtp_config?.smtp_from_name,
                    smtp_use_tls: selectedFacility.smtp_config?.smtp_use_tls,
                    // Backend Config
                    backend_db_user: selectedFacility.backend_config?.backend_db_user,
                    backend_db_password: selectedFacility.backend_config?.backend_db_password,
                    backend_db_host: selectedFacility.backend_config?.backend_db_host,
                    backend_db_port: selectedFacility.backend_config?.backend_db_port,
                    backend_db_name: selectedFacility.backend_config?.backend_db_name,
                    backend_base_folder: selectedFacility.backend_config?.backend_base_folder,
                    backend_ipserver: selectedFacility.backend_config?.backend_ipserver,
                    // WhatsApp Config
                    whatsapp_api_url: selectedFacility.whatsapp_config?.whatsapp_api_url,
                    whatsapp_token: selectedFacility.whatsapp_config?.whatsapp_token,
                    whatsapp_phone_number_id: selectedFacility.whatsapp_config?.whatsapp_phone_number_id,
                    whatsapp_business_account_id: selectedFacility.whatsapp_config?.whatsapp_business_account_id,
                    whatsapp_webhook_verify_token: selectedFacility.whatsapp_config?.whatsapp_webhook_verify_token,
                    whatsapp_is_active: selectedFacility.whatsapp_config?.whatsapp_is_active,
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
