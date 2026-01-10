import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { useRequestingPhysicians } from "./hooks/useRequestingPhysicians";
import type { RequestingPhysician, RequestingPhysicianFormData } from "./types/requesting-physicians.types";
import { toast } from "sonner";
import { getRequestingPhysicianActions, getRequestingPhysicianColumns } from "./components/columns";
import { RequestingPhysicianModal } from "./components/RequestingPhysicianModal";

export const MedicosSolicitantes = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPhysician, setSelectedPhysician] = useState<RequestingPhysician | null>(null);

    const {
        physicians,
        isLoading,
        createPhysician,
        updatePhysician,
        deletePhysician,
    } = useRequestingPhysicians();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (physicianData?: RequestingPhysician) => {
        setSelectedPhysician(physicianData || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPhysician(null);
    };

    const handleSubmit = (data: RequestingPhysicianFormData) => {
        if (selectedPhysician) {
            // Actualizar
            updatePhysician(
                { id: selectedPhysician.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Médico actualizado exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el médico");
                    },
                }
            );
        } else {
            // Crear
            createPhysician(data, {
                onSuccess: () => {
                    toast.success("Médico creado exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear el médico");
                },
            });
        }
    };

    const handleDelete = (physician: RequestingPhysician) => {
        if (confirm(`¿Está seguro de eliminar al médico ${physician.description}? Esta acción no se puede deshacer.`)) {
            deletePhysician(physician.guid, {
                onSuccess: () => {
                    toast.success("Médico eliminado exitosamente");
                },
                onError: () => {
                    toast.error("Error al eliminar el médico");
                },
            });
        }
    };

    const physicianColumns = getRequestingPhysicianColumns();
    const physicianActions = getRequestingPhysicianActions(
        handleOpenModal,
        handleDelete
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Médicos Solicitantes</h2>
                    <p className="text-muted-foreground">Gestión de médicos solicitantes</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nuevo Médico
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(physicians?.data) ? physicians.data : []}
                    columns={physicianColumns}
                    showIndex
                    actions={physicianActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(physicians?.data) ? physicians.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <RequestingPhysicianModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedPhysician ? {
                    description: selectedPhysician.description,
                    phone: selectedPhysician.phone || undefined,
                    mail: selectedPhysician.mail || undefined,
                    note: selectedPhysician.note || undefined,
                    location_id: selectedPhysician.location_id || undefined,
                } : undefined}
                isLoading={false}
            />
        </div>
    )
}
