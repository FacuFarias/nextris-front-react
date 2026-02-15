import TablaDynamic from '@/components/TableDynamic'
import { useState } from 'react'
import { useObraSocial } from './hooks/use-obra-social';
import { getObraSocialActions, obraSocialColumns } from './components/columns';
import { toast } from 'sonner';
import type { ObraSocial as ObraSocialType, ObraSocialFormData } from './types/obra-social.types';
import { ObraSocialModal } from './components/ObraSocialModal';

export const ObraSocial = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedObraSocial, setSelectedObraSocial] = useState<ObraSocialType | null>(null);

    const { obraSocial, isLoading, createObraSocial, updateObraSocial } = useObraSocial();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
    const handleOpenModal = (obraSocial?: ObraSocialType) => {
        setSelectedObraSocial(obraSocial || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedObraSocial(null);
    };

    const handleSubmit = (data: ObraSocialFormData) => {
        if (selectedObraSocial) {
            // Actualizar
            updateObraSocial(
                { id: selectedObraSocial.guid, data },
                {
                    onSuccess: () => {
                        toast.success("Obra Social actualizado exitosamente");
                        handleCloseModal();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el Obra Social");
                    },
                }
            );
        } else {
            // Crear
            createObraSocial(data, {
                onSuccess: () => {
                    toast.success("Obra Social creado exitosamente");
                    handleCloseModal();
                },
                onError: () => {
                    toast.error("Error al crear el Obra Social");
                },
            });
        }
    };

    const obraSocialActions = getObraSocialActions(handleOpenModal);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Obra Social</h2>
                    <p className="text-muted-foreground">Gestión de obras sociales</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nueva Obra Social
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(obraSocial?.data) ? obraSocial.data : []}
                    columns={obraSocialColumns}
                    showIndex
                    actions={obraSocialActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(obraSocial?.data) ? obraSocial.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <ObraSocialModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                initialData={selectedObraSocial ? {
                    description: selectedObraSocial.description,
                    externalcode: selectedObraSocial.externalcode ?? undefined,
                    headerdescription: selectedObraSocial.headerdescription ?? undefined,
                } : null}
                isLoading={false}
            />
        </div>
    )
}
