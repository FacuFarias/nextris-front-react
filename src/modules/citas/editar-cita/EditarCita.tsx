//components
import { TablaDynamic } from "@/components/TableDynamic"
//hooks
import { useDebounce } from "@uidotdev/usehooks"
//layout
import { MainLayout } from "@/layouts/layout"
//icons and react
import { CalendarPlus } from "lucide-react"
import { useState } from "react"
import { citaColumns, getCitasActions } from "./components/columns"
import type { Cita } from "./types/cita.type"
import { useCitas } from "./hooks/use-citas"
import { InputSearch } from "@/components/InputSearch"
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { useNavigate } from "react-router-dom"
import { ModalEditarCitaContent } from "./components/ModalEditarCita"
import { Modal } from "@/components/Modal"




export const EditarCita = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
    const debouncedSearch = useDebounce(searchTerm, 500);
    const { citasData, isLoading: isLoadingCitas } = useCitas({ page, per_page: 8, search: debouncedSearch });
    const navigate = useNavigate();



    const pagination = citasData && {
        page: citasData?.data?.page || 1,
        pageSize: citasData?.data?.per_page || 5,
        total: citasData?.data?.total || 0,
    };

    const handleEditCita = (cita: Cita) => {
        setCitaSeleccionada(cita);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Mantener el contenido durante la animación de cierre
        setTimeout(() => {
            setCitaSeleccionada(null);
        }, 400);
    };

    const handleGuardarCambios = (citaActualizada: Cita) => {
        // Aquí implementarás la lógica para guardar los cambios
        console.log("Guardando cambios:", citaActualizada);
        handleCloseModal();
    };

    const handleEditFecha = (cita: Cita) => {
        navigate(`/cita/editar-cita/${cita.guid}`,
            {
                state: { cita }
            }
        );

    };
    const citasActions = getCitasActions(
        handleEditCita,
        handleEditFecha,
    );
    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <CalendarPlus className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple">Editar Cita</h1>
                    </div>

                    {/* Barra de búsqueda */}
                    <InputSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar cita..." />
                    {/* Tabla de pacientes */}

                    {isLoadingCitas ? (
                        <div className='flex justify-center items-center h-40'>
                            <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                        </div>
                    ) : (
                        <TablaDynamic<Cita>
                            data={citasData?.data?.data || []}
                            columns={citaColumns}
                            showIndex
                            rowIdKey="guid"
                            emptyMessage="No se encontraron citas."
                            pagination={pagination}
                            onPaginationChange={(newPage) => {
                                setPage(newPage);
                            }}
                            actions={citasActions}
                        />
                    )}
                </div>
            </div>

            {/* Modal para editar cita */}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Editar Cita"
                description="Modifica los detalles de la cita"
                size="xxl"
            >
                {citaSeleccionada && (
                    <ModalEditarCitaContent
                        cita={citaSeleccionada}
                        onGuardar={handleGuardarCambios}
                        onCancelar={handleCloseModal}
                    />
                )}
            </Modal>
        </MainLayout>
    )
}
