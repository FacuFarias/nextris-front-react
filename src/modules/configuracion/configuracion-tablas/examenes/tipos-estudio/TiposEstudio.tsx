import TablaDynamic from "@/components/TableDynamic";
import { useTiposEstudio } from "./hooks/useTiposEstudio";
import { tipoEstudioColumns, getTipoEstudioActions } from "./components/columns";
import { useState, useMemo } from "react";
import { TipoEstudioModal } from "./components/TipoEstudioModal";
import type { TipoEstudio, TipoEstudioFormData } from "./types/tipos-estudio.types";
import { toast } from "sonner";
import { useModalidades } from "../modalidades/hooks/useModalidades";
import { useBodyParts } from "../partes-cuerpo/hooks/useBodyParts";

export const TiposEstudio = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTipoEstudio, setSelectedTipoEstudio] = useState<TipoEstudio | null>(null);

    const { tiposEstudio, isLoading, createTipoEstudio, updateTipoEstudio } = useTiposEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();

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

    const handleSubmit = (data: TipoEstudioFormData) => {
        if (selectedTipoEstudio) {
            // Actualizar
            updateTipoEstudio(
                { id: selectedTipoEstudio.guid, data },
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
            createTipoEstudio(data, {
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

    // Buscar IDs a partir de los nombres cuando se edita
    const initialData = useMemo(() => {
        if (!selectedTipoEstudio) return undefined;

        // Buscar el ID de modalidad por nombre
        const modalityId = modalidades?.data?.find(
            (m: any) => m.description === selectedTipoEstudio.modality
        )?.guid || selectedTipoEstudio.modality_id || "";

        // Buscar el ID de parte del cuerpo por nombre
        const bodypartId = bodyParts?.data?.find(
            (b: any) => b.description === selectedTipoEstudio.bodypart
        )?.guid || selectedTipoEstudio.bodypart_id || "";

        return {
            code: selectedTipoEstudio.code,
            description: selectedTipoEstudio.description,
            studygroup_id: selectedTipoEstudio.studygroup_id || "",
            bodypart_id: bodypartId,
            modality_id: modalityId,
            rvu: selectedTipoEstudio.rvu,
            nofviews: selectedTipoEstudio.nofviews,
        };
    }, [selectedTipoEstudio, modalidades, bodyParts]);

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
                initialData={initialData}
                isLoading={false}
            />
        </div>
    )
}
