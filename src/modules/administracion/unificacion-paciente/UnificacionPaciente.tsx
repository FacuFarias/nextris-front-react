import { DireccionSelector } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { MainLayout } from "@/layouts/layout";
import { usePacienteDireccion } from "@/modules/admision/admision-espontanea/hooks/use-paciente-direccion";
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente";
import { useDebounce } from "@uidotdev/usehooks";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import type { TableColumn } from "@/types/table";
import { Checkbox } from "@/components/ui/checkbox";
import { unificacionColumns } from "./components/columns";
import { ModalUnificacion } from "./components/ModalUnificacion";
import { toast } from "sonner";
import { useUnificacionPaciente } from "./hooks/useUnificacionPaciente";

export const UnificacionPaciente = () => {
    const [searchTerm] = useState("");
    const [selectedDireccion, setSelectedDireccion] = useState<string>("");
    const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const debouncedSearch = useDebounce(searchTerm, 500);
    const { mutate: fetchPacientesDireccion, data: pacientesData, isPending } = usePacienteDireccion();
    const mutateUnificacion = useUnificacionPaciente();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const handleDireccionChange = (direccionId: string) => {
        setSelectedDireccion(direccionId);
        setSelectedPatients([]); // Limpiar selección al cambiar dirección
        fetchPacientesDireccion(
            { uuid: direccionId, searchTerm: debouncedSearch },
        );
    };

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
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
            className: "w-[50px]",
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

                    // Recargar la lista de pacientes
                    if (selectedDireccion) {
                        fetchPacientesDireccion({
                            uuid: selectedDireccion,
                            searchTerm: debouncedSearch
                        });
                    }
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
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Unificación de Paciente</h1>
                    </div>
                    {/* Selector de Dirección */}
                    <DireccionSelector
                        selectedDireccion={selectedDireccion}
                        onDireccionChange={handleDireccionChange}
                        isPending={isPending}
                        isRow={true}
                    />

                    {/* Barra de búsqueda */}
                    {/*  {selectedDireccion && (
                        <div className="w-full">
                            <InputSearch
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                placeholder="Buscar por paciente, médico y equipo..."
                            />
                        </div>
                    )} */}

                    {/* Tabla de pacientes */}
                    <div className="bg-white dark:bg-[#2a2e32]  rounded-lg border border-purple-100 dark:border-gray-700 p-4 mt-3">
                        <div className="w-full flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-4">
                                Seleccione pacientes a unificar
                                {selectedPatients.length > 0 && (
                                    <span className="ml-2 text-sm text-brand-purple dark:text-purple-400">
                                        ({selectedPatients.length}/2 seleccionados)
                                    </span>
                                )}
                            </h2>

                            {selectedPatients.length > 0 && (
                                <button
                                    onClick={handleClearSelection}
                                    className="text-sm text-red-600 hover:text-red-700 mb-4"
                                >
                                    Limpiar selección
                                </button>
                            )}
                        </div>

                        {isPending ? (
                            <div className='flex justify-center items-center h-40'>
                                <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                            </div>
                        ) : (
                            <TablaDynamic<Patient>
                                data={selectedDireccion ? (pacientesData?.data || []) : []}
                                columns={columnsWithCheckbox}
                                showIndex
                                rowIdKey="guid"
                                onPaginationChange={handlePaginationChange}

                                pagination={{
                                    page,
                                    pageSize,
                                    serverSide: false,
                                    total: Array.isArray(pacientesData?.data) ? pacientesData.data.length : 0,
                                }}
                                emptyMessage="Seleccione una dirección para ver los pacientes asociados."
                            />
                        )}
                    </div>
                </div>

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