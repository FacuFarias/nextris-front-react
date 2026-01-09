import TablaDynamic from "@/components/TableDynamic";
import { useTiposEstudio } from "./hooks/useTiposEstudio";
import { tipoEstudioColumns, getTipoEstudioActions } from "./components/columns";
import { useState } from "react";
import { TipoEstudioModal } from "./components/TipoEstudioModal";
import type { TipoEstudio } from "./types/tipos-estudio.types";
import { toast } from "sonner";

export const TiposEstudio = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoEstudio, setSelectedTipoEstudio] = useState<TipoEstudio | null>(null);

    const { tiposEstudio, isLoading, createTipoEstudio, updateTipoEstudio } = useTiposEstudio();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (tipoEstudio?: TipoEstudio) => {
        setSelectedTipoEstudio(tipoEstudio || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTipoEstudio(null);
    };

    const handleSubmit = (data: { description: string }) => {
        if (selectedTipoEstudio) {
            // Actualizar
            updateTipoEstudio(
                { id: selectedTipoEstudio.guid, data: data as any },
                {
                    onSuccess: () => {
                        toast.success("Tipo de estudio actualizado exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el tipo de estudio");
                    },
                }
            );
        } else {
            // Crear
            createTipoEstudio(data as any, {
                onSuccess: () => {
                    toast.success("Tipo de estudio creado exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear el tipo de estudio");
                },
            });
        }
    };

    const tipoEstudioActions = getTipoEstudioActions(handleOpenModal);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tipos de Estudio</h2>
                    <p className="text-muted-foreground">Gestión de tipos de estudios médicos</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nuevo Tipo de Estudio
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(tiposEstudio?.data) ? tiposEstudio.data : []}
                    columns={tipoEstudioColumns}
                    showIndex
                    actions={tipoEstudioActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(tiposEstudio?.data) ? tiposEstudio.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <TipoEstudioModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedTipoEstudio ? { description: selectedTipoEstudio.description } : undefined}
                isLoading={false}
            />
        </div>
    )
}
