import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { toast } from "sonner";
import { useObrasSociales } from "./hooks/use-obras-sociales";
import { obraSocialColumns, getObraSocialActions } from "./components/columns";
import { ObraSocialModal } from "./components/ObraSocialModal";
import { LocationAssignmentModal } from "./components/LocationAssignmentModal";
import type { ObraSocial, ObraSocialFormData } from "./types/obras-sociales.types";

export const ObrasSociales = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedObraSocial, setSelectedObraSocial] = useState<ObraSocial | null>(null);

    const { obrasSociales, isLoading, createObraSocial, updateObraSocial } = useObrasSociales();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (obraSocial?: ObraSocial) => {
        setSelectedObraSocial(obraSocial || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedObraSocial(null);
    };

    const handleOpenLocationModal = (obraSocial: ObraSocial) => {
        setSelectedObraSocial(obraSocial);
        setIsLocationModalOpen(true);
    };

    const handleCloseLocationModal = () => {
        setIsLocationModalOpen(false);
        setSelectedObraSocial(null);
    };

    const handleSubmit = (data: ObraSocialFormData) => {
        if (selectedObraSocial) {
            updateObraSocial(
                { id: selectedObraSocial.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Obra Social actualizada exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar la Obra Social");
                    },
                }
            );
        } else {
            createObraSocial(data, {
                onSuccess: () => {
                    toast.success("Obra Social creada exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear la Obra Social");
                },
            });
        }
    };

    const obraSocialActions = getObraSocialActions(handleOpenModal, handleOpenLocationModal);
    const data = Array.isArray(obrasSociales?.data) ? obrasSociales.data : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Obras Sociales</h2>
                    <p className="text-muted-foreground">Gestion de obras sociales y sus ubicaciones asociadas</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nueva Obra Social
                </button>
            </div>

            <TablaDynamic
                data={data}
                columns={obraSocialColumns}
                showIndex
                actions={obraSocialActions}
                loading={isLoading}
                pagination={{
                    page,
                    pageSize,
                    serverSide: false,
                    total: data.length,
                }}
                onPaginationChange={handlePaginationChange}
            />

            <ObraSocialModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={
                    selectedObraSocial
                        ? {
                              description: selectedObraSocial.description,
                              externalcode: selectedObraSocial.externalcode ?? undefined,
                              headerdescription: selectedObraSocial.headerdescription ?? undefined,
                          }
                        : null
                }
                isLoading={false}
            />

            <LocationAssignmentModal
                isOpen={isLocationModalOpen}
                onClose={handleCloseLocationModal}
                obraSocial={selectedObraSocial}
            />
        </div>
    );
};
