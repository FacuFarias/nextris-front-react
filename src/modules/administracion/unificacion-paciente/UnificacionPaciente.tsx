import TablaDynamic from "@/components/TableDynamic";
import { MainLayout } from "@/layouts/layout";
import { useBuscarPaciente } from "@/modules/pacientes/buscar-paciente/hooks/use-buscar-paciente";
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import type { TableColumn } from "@/types/table";
import { Checkbox } from "@/components/ui/checkbox";
import { unificacionColumns } from "./components/columns";
import { ModalUnificacion } from "./components/ModalUnificacion";
import { toast } from "sonner";
import { useUnificacionPaciente } from "./hooks/useUnificacionPaciente";
import { InputSearch } from "@/components";
import { useDebounce } from "@uidotdev/usehooks";

export const UnificacionPaciente = () => {
    const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const useDebounceSearch = useDebounce(searchTerm, 300);

    const { patientsData, isLoading, refetchPatients } = useBuscarPaciente({
        page,
        per_page: perPage,
        search: useDebounceSearch,
    });
    const mutateUnificacion = useUnificacionPaciente();
    // Manejar selección de pacientes
    const handleCheckboxChange = (patient: Patient, checked: boolean) => {
        if (checked) {
            // Solo permitir máximo 2 selecciones
            if (selectedPatients.length < 2) {
                setSelectedPatients(prev => [...prev, patient]);
            }
        } else {
            setSelectedPatients(prev => prev.filter(p => p.guid !== patient.guid));
        }
    };

    // Abrir modal automáticamente cuando hay 2 pacientes seleccionados
    useEffect(() => {
        if (selectedPatients.length === 2) {
            setIsModalOpen(true);
        }
    }, [selectedPatients]);

    // Limpiar selección
    const handleClearSelection = () => {
        setSelectedPatients([]);
        setIsModalOpen(false);
    };

    // Agregar columna de checkbox a las columnas existentes
    const columnsWithCheckbox: TableColumn<Patient>[] = [
        {
            key: "checkbox",
            label: "",
            headerClassName: "w-[32px]",
            className: "py-1 px-0.5",
            render: (_value, row) => {
                const isChecked = selectedPatients.some(p => p.guid === row.guid);
                const isDisabled = !isChecked && selectedPatients.length >= 2;

                return (
                    <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => handleCheckboxChange(row, checked as boolean)}
                        disabled={isDisabled}
                        onClick={(e) => e.stopPropagation()}
                    />
                );
            }
        },
        ...unificacionColumns
    ];

    const handleSubmitUnificacion = () => {
        if (selectedPatients.length !== 2) {
            toast.error("Debe seleccionar 2 pacientes para unificar");
            return;
        }
        const patientId = selectedPatients[0].guid;
        const duplicatePatientId = selectedPatients[1].guid;

        mutateUnificacion.mutate(
            { master_guid: patientId, duplicate_guid: duplicatePatientId },
            {
                onSuccess: () => {
                    toast.success("Pacientes unificados exitosamente");
                    handleClearSelection(); // Cerrar modal y limpiar selección

                    refetchPatients();
                },
                onError: (error: any) => {
                    toast.error(error?.message || "Error al unificar pacientes");
                    // Modal permanece abierto para que el usuario pueda reintentar
                }
            }
        );

    };
    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm border border-border dark:border-[rgba(255,255,255,0.06)] dark:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.08)] z-10 h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-brand-purple dark:bg-gradient-to-br dark:from-purple-600 dark:to-purple-900 p-2 rounded-lg dark:shadow-[0_0_16px_rgba(139,92,246,0.5),0_2px_8px_rgba(0,0,0,0.4)]">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]">Unificación de Paciente</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex items-center gap-3 mb-4">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={(value) => {
                            setSearchTerm(value);
                            setPage(1);
                        }}
                        placeholder="Seleccione pacientes a unificar"
                    />
                    {selectedPatients.length > 0 && (
                        <>
                            <span className="text-sm text-brand-purple dark:text-purple-400 whitespace-nowrap">
                                ({selectedPatients.length}/2)
                            </span>
                            <button
                                onClick={handleClearSelection}
                                className="text-sm text-red-600 hover:text-red-700 whitespace-nowrap"
                            >
                                Limpiar selección
                            </button>
                        </>
                    )}
                </div>

                <TablaDynamic<Patient>
                    data={patientsData?.data?.data || []}
                    filterAnimationKey={useDebounceSearch}
                    columns={columnsWithCheckbox}
                    showIndex
                    rowIdKey="guid"
                    loading={isLoading}
                    pagination={{
                        page: patientsData?.data?.page || 1,
                        pageSize: patientsData?.data?.per_page || 10,
                        total: patientsData?.data?.total || 0,
                    }}
                    onPaginationChange={(newPage) => {
                        setPage(newPage);
                    }}
                    perPageValue={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    serverSideFiltering={true}
                    emptyMessage="No se encontraron pacientes."
                />

                {/* Modal de Unificación */}
                <ModalUnificacion
                    isOpen={isModalOpen}
                    onClose={handleClearSelection}
                    patients={selectedPatients}
                    handleSubmitUnificacion={handleSubmitUnificacion}
                    isLoading={mutateUnificacion.isPending}

                />
            </div>
        </MainLayout>
    )
}
