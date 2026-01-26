import TablaDynamic from "@/components/TableDynamic";
import { useState } from "react";
import { toast } from "sonner";
import { useGrupoEstudio } from "./hooks/useGruposEstudio";
import type { GruposEstudio as GruposEstudiosType } from "./types/grupos-estudio.types";
import { getGruposEstudioActions, gruposEstudioColumns } from "./components/columns";
import { GruposEstudioModal } from "./components/GruposEstudioModal";


export const GruposEstudio = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGrupoEstudio, setSelectedGrupoEstudio] = useState<GruposEstudiosType | null>(null);

    const { gruposEstudio, isLoading, createGrupoEstudio, updateGrupoEstudio } = useGrupoEstudio();
    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (grupoEstudio?: GruposEstudiosType) => {
        setSelectedGrupoEstudio(grupoEstudio || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedGrupoEstudio(null);
    };

    const handleSubmit = (data: { description: string }) => {
        if (selectedGrupoEstudio) {
            // Actualizar
            updateGrupoEstudio(
                { id: selectedGrupoEstudio.guid, data: data as any },
                {
                    onSuccess: () => {
                        toast.success("Grupo de estudio actualizado exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el grupo de estudio");
                    },
                }
            );
        } else {
            // Crear
            createGrupoEstudio(data as any, {
                onSuccess: () => {
                    toast.success("Grupo de estudio creado exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear el grupo de estudio");
                },
            });
        }
    };

    const gruposEstudioActions = getGruposEstudioActions(handleOpenModal);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Grupos de Estudio</h2>
                    <p className="text-muted-foreground">Gestión de grupos de estudio para exámenes</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nuevo Grupo de Estudio
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(gruposEstudio?.data) ? gruposEstudio.data : []}
                    columns={gruposEstudioColumns}
                    showIndex
                    actions={gruposEstudioActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(gruposEstudio?.data) ? gruposEstudio.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <GruposEstudioModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedGrupoEstudio ? { description: selectedGrupoEstudio.description } : undefined}
                isLoading={false}
            />
        </div>
    )
}
