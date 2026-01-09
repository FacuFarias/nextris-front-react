import TablaDynamic from "@/components/TableDynamic";
import { useBodyParts } from "./hooks/useBodyParts";
import { useState } from "react";
import { bodyPartColumns, getBodyPartActions } from "./components/columns";
import { BodyPartModal } from "./components/BodyPartModal";
import type { BodyPart } from "./types/body-parts.types";
import { toast } from "sonner";

export const PartesCuerpo = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);

    const { bodyParts, isLoading, createBodyPart, updateBodyPart } = useBodyParts();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (bodyPart?: BodyPart) => {
        setSelectedBodyPart(bodyPart || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBodyPart(null);
    };

    const handleSubmit = (data: { description: string }) => {
        if (selectedBodyPart) {
            // Actualizar
            updateBodyPart(
                { id: selectedBodyPart.guid, data: data as any },
                {
                    onSuccess: () => {
                        toast.success("Parte del cuerpo actualizada exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la parte del cuerpo");
                    },
                }
            );
        } else {
            // Crear
            createBodyPart(data as any, {
                onSuccess: () => {
                    toast.success("Parte del cuerpo creada exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la parte del cuerpo");
                },
            });
        }
    };

    const bodyPartActions = getBodyPartActions(handleOpenModal);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Partes del Cuerpo</h2>
                    <p className="text-muted-foreground">Gestión de partes del cuerpo para exámenes</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nueva Parte del Cuerpo
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(bodyParts?.data) ? bodyParts.data : []}
                    columns={bodyPartColumns}
                    showIndex
                    actions={bodyPartActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(bodyParts?.data) ? bodyParts.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <BodyPartModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedBodyPart ? { description: selectedBodyPart.description } : undefined}
                isLoading={false}
            />
        </div>
    );
};
