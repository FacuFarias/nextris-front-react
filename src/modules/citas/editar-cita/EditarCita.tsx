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
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { actualizarCita } from "../service/cita.service"
import { toast } from "sonner"
import { citasKeys } from "../constants/query-keys"
import fondoImage from "@/assets/calendar.jpg"




export const EditarCita = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
    const debouncedSearch = useDebounce(searchTerm, 500);
    const { citasData, isLoading: isLoadingCitas } = useCitas({ page, per_page: perPage, search: debouncedSearch });
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const actualizarCitaMutation = useMutation({
        mutationFn: (cita: Cita) => {
            const payload = {
                doctor_id: cita.doctor_id,
                requesting_physician_id: cita.requesting_physician_id,
                exam_id: cita.exam_id,
            };
            return actualizarCita(cita.guid, payload);
        },
        onSuccess: () => {
            toast.success("Cita actualizada exitosamente", {
                position: "top-right",
            });
            queryClient.invalidateQueries({ queryKey: citasKeys.lists() });
            handleCloseModal();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Error al actualizar cita", {
                position: "top-right",
            });
        },
    });



    const pagination = citasData && {
        page: citasData?.data?.page || 1,
        pageSize: citasData?.data?.per_page || perPage,
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
        actualizarCitaMutation.mutate(citaActualizada);
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
            <div className="bg-card backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10 flex flex-col flex-1 min-h-0">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />
                {/* Header con Tabs integrados */}
                <div className="flex flex-col flex-1 min-h-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <CalendarPlus className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Editar Cita</h1>
                    </div>

                    {/* Barra de búsqueda */}
                    <div className="mb-2">
                        <InputSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Buscar cita..." />
                    </div>
                    {/* Tabla de pacientes */}

                    <TablaDynamic<Cita>
                        data={citasData?.data?.data || []}
                        columns={citaColumns}
                        showIndex
                        loading={isLoadingCitas}
                        preserveTableHeight
                        rowIdKey="guid"
                        emptyMessage="No se encontraron citas."
                        pagination={pagination}
                        onPaginationChange={(newPage) => {
                            setPage(newPage);
                        }}
                        perPageValue={perPage}
                        onPerPageChange={(value) => {
                            setPerPage(value);
                            setPage(1);
                        }}
                        perPageOptions={[10, 20, 50, 100]}
                        actions={citasActions}
                        tableBackgroundImage={fondoImage}
                        stickyPagination
                    />
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
