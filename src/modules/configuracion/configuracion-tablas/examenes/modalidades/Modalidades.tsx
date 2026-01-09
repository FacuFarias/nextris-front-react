import { useState } from "react";
import { useModalidades } from "./hooks/useModalidades";
import TablaDynamic from "@/components/TableDynamic";
import { modalidadColumns, getModalidadActions } from "./components/columns";
import { ModalidadModal } from "./components/ModalidadModal";
import type { Modalidad } from "./types/modalidades.types";
import { toast } from "sonner";

export const Modalidades = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModalidad, setSelectedModalidad] = useState<Modalidad | null>(null);

    const { modalidades, isLoading, createModalidad, updateModalidad } = useModalidades();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (modalidad?: Modalidad) => {
        setSelectedModalidad(modalidad || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedModalidad(null);
    };

    const handleSubmit = (data: { description: string }) => {
        if (selectedModalidad) {
            // Actualizar
            updateModalidad(
                { id: selectedModalidad.guid, data: data as any },
                {
                    onSuccess: () => {
                        toast.success("Modalidad actualizada exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la modalidad");
                    },
                }
            );
        } else {
            // Crear
            createModalidad(data as any, {
                onSuccess: () => {
                    toast.success("Modalidad creada exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la modalidad");
                },
            });
        }
    };

    const modalidadActions = getModalidadActions(handleOpenModal);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Modalidades</h2>
                    <p className="text-muted-foreground">Gestión de modalidades de exámenes</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nueva Modalidad
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(modalidades?.data) ? modalidades.data : []}
                    columns={modalidadColumns}
                    showIndex
                    actions={modalidadActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(modalidades?.data) ? modalidades.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <ModalidadModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedModalidad ? { description: selectedModalidad.description } : undefined}
                isLoading={false}
            />
        </div>
    )
}
