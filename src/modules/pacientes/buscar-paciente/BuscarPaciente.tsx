//layout
import { MainLayout } from "@/layouts/layout";
//react
import { useState } from "react";
//lucide react
import { Search, UserPlus, Users, Plus, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
//components
import { DynamicBreadcrumb, InputSearch, Modal } from "@/components";
import { useDebounce } from "@uidotdev/usehooks";
import fondoImage from "@/assets/patients.jpg";
import backDarkImage from "@/assets/back-dark.jpg";

//hooks and services
import { useBuscarPaciente, useDesactivarUsuario, useActivarUsuario } from "./hooks/use-buscar-paciente";
import { useCreatePatient, useEditPatient } from "./hooks/use-create-patient";
import TablaDynamic from "@/components/TableDynamic";

//types and columns
import type { Patient } from "./types/BuscarPaciente";
import { getPatientActions, patientColumns } from "./components/columns";
import type { CreatePatientFormValues } from "./schemas/create-patient.schema";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { IsAdmin } from "@/components/IsAdmin";

import { CreatePatientForm } from "./components/CreatePatientForm";
import { useTableColumns } from "@/hooks/use-table-columns";
import { useAuth } from "@/context/AuthContext";

export const BuscarPaciente = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [hideWithoutStudies, setHideWithoutStudies] = useState(false);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [sortDescending, setSortDescending] = useState(false);
    const useDebounceSearch = useDebounce(searchTerm, 300);
    const navigate = useNavigate();
    const { authData } = useAuth();
    const createPatientMutation = useCreatePatient();
    const editPatientMutation = useEditPatient();
    const desactivarUsuarioMutation = useDesactivarUsuario();
    const activarUsuarioMutation = useActivarUsuario();
    //crear/editar paciente modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const { visibleColumns, filteredColumns, toggleColumn } = useTableColumns({ columns: patientColumns });
    const userPermissions = Array.isArray((authData?.user as any)?.permissions)
        ? ((authData?.user as any)?.permissions as string[])
        : [];
    const canManagePatients = userPermissions.includes('*') || userPermissions.includes('patients.manage');
    // Funciones para las acciones de la tabla
    const handleEditPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleAddPatient = () => {
        setSelectedPatient(null);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleDeactivateUser = (patient: Patient) => {
        if (patient.guid) {
            desactivarUsuarioMutation.mutate(patient.guid);
        }
    };

    const handleActivateUser = (patient: Patient) => {
        if (patient.guid) {
            activarUsuarioMutation.mutate(patient.guid);
        }
    };

    const handleViewHistory = (patient: Patient) => {
        // Solo navegar si tiene estudios
        if (patient.study_count === 0) return;
        navigate(`/buscar-pacientes/historial-paciente`, { state: { patient } });
    };

    // Generar las acciones con las funciones
    const patientActions = getPatientActions(
        handleEditPatient,
        handleDeactivateUser,
        handleActivateUser,
        handleViewHistory,
        canManagePatients,
    );
    const { patientsData, isLoading, isFetching, error: patientsError } = useBuscarPaciente({ page, per_page: perPage, search: useDebounceSearch, hide_without_studies: hideWithoutStudies, column_filters: JSON.stringify(columnFilters) });


    const pagination = patientsData && {
        page: patientsData?.data?.page || 1,
        pageSize: patientsData?.data?.per_page || 5,
        total: patientsData?.data?.total || 0,
    };

    const handleCreatePatient = (data: CreatePatientFormValues) => {
        // Si estamos en modo edición, enviar solo los campos modificados
        if (isEditMode && selectedPatient) {
            const changedFields: Partial<CreatePatientFormValues> = {};
            const initialData = {
                name: selectedPatient.name,
                surname: selectedPatient.surname,
                documentnumber: selectedPatient.nationalcode,
                birthdate: selectedPatient.birthdate,
                gender: selectedPatient.gender as "M" | "F" | "Otro",
                email: selectedPatient.email,
                phone: selectedPatient.phone || "",
                patientdomain_id: selectedPatient.patientid,
                patientid: selectedPatient.patientid,
            };

            // Comparar cada campo y agregar solo los que cambiaron
            (Object.keys(data) as Array<keyof CreatePatientFormValues>).forEach((key) => {
                if (data[key] !== initialData[key as keyof typeof initialData]) {
                    (changedFields as any)[key] = data[key];
                }
            });

            // Si hay cambios, enviar solo esos campos
            if (Object.keys(changedFields).length > 0) {
                editPatientMutation.mutate({ patientId: selectedPatient.guid, updatedData: changedFields }, {
                    onSuccess: () => {
                        setIsModalOpen(false);
                        setSelectedPatient(null);
                        setIsEditMode(false);
                    },
                });
            } else {
                // No hay cambios, cerrar modal
                setIsModalOpen(false);
                setSelectedPatient(null);
                setIsEditMode(false);
            }
        } else {
            // Modo crear: enviar todos los datos
            createPatientMutation.mutate(data, {
                onSuccess: () => {
                    setIsModalOpen(false);
                },
            });
        }
    };

    return (
        <MainLayout>
            <div className="page-dark-gradient min-h-0 flex-1 rounded-lg border border-border p-3 shadow-sm dark:border-[rgba(255,255,255,0.06)] dark:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.08)] z-10 flex flex-col overflow-hidden sm:p-6">
                {/* Breadcrumb */}
                <div className="hidden md:block"><DynamicBreadcrumb /></div>

                {/* Header */}
                <div className="hidden items-center gap-2 sm:gap-3 mb-4 md:flex">
                    <div className="bg-brand-purple dark:bg-gradient-to-br dark:from-purple-600 dark:to-purple-900 p-2 rounded-lg dark:shadow-[0_0_16px_rgba(139,92,246,0.5),0_2px_8px_rgba(0,0,0,0.4)]">
                        <Search className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]">Pacientes</h1>
                </div>

                <div className="mb-3 flex items-center justify-between md:hidden">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-brand-purple p-2 text-white"><Users className="h-5 w-5" /></div>
                        <h1 className="text-lg font-semibold text-foreground">Pacientes</h1>
                    </div>
                    <IsAdmin>
                        <button type="button" onClick={handleAddPatient} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-purple text-white shadow-lg" aria-label="Agregar paciente">
                            <Plus className="h-5 w-5" />
                        </button>
                    </IsAdmin>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar paciente o historial..."
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer whitespace-nowrap select-none hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={hideWithoutStudies}
                            onChange={(e) => {
                                setHideWithoutStudies(e.target.checked);
                                setPage(1);
                            }}
                            className="w-4 h-4 rounded border-input dark:border-input dark:bg-input/30 text-brand-purple dark:text-purple-500 focus:ring-brand-purple dark:focus:ring-purple-500 accent-brand-purple dark:accent-purple-500 cursor-pointer"
                        />
                        Solo con estudios
                    </label>
                    <IsAdmin>
                        <div className="hidden sm:block">
                            <PrimaryButton onClick={handleAddPatient}>
                                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                AGREGAR
                            </PrimaryButton>
                        </div>
                    </IsAdmin>

                </div>

                <div className="mt-1 flex gap-2 md:hidden">
                    <button type="button" onClick={() => setMobileFiltersOpen((open) => !open)} className="flex h-11 flex-1 items-center justify-between rounded-lg border border-border bg-card px-3 text-sm text-foreground">
                        <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Filtros</span><ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setSortDescending((value) => !value)} className="flex h-11 flex-1 items-center justify-between rounded-lg border border-border bg-card px-3 text-sm text-foreground">
                        <span className="flex items-center gap-2"><ArrowUpDown className="h-4 w-4" /> Ordenar: Nombre {sortDescending ? "Z-A" : "A-Z"}</span><ChevronDown className="h-4 w-4" />
                    </button>
                </div>
                {mobileFiltersOpen && (
                    <div className="mt-2 rounded-lg border border-border bg-card p-3 md:hidden">
                        <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                            <input type="checkbox" checked={hideWithoutStudies} onChange={(e) => { setHideWithoutStudies(e.target.checked); setPage(1); }} className="h-5 w-5 accent-brand-purple" />
                            Solo con estudios
                        </label>
                    </div>
                )}

                    <TablaDynamic<Patient>
                    data={[...((patientsData?.data?.data) || [])].sort((a, b) => {
                        const comparison = `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`);
                        return sortDescending ? -comparison : comparison;
                    })}
                    columns={filteredColumns}
                    showIndex
                    loading={isLoading}
                    refreshing={isFetching && !isLoading}
                    refreshError={Boolean(patientsError)}
                    refreshScopeKey={JSON.stringify([page, perPage, useDebounceSearch, hideWithoutStudies, columnFilters, sortDescending])}
                    filterAnimationKey={JSON.stringify([useDebounceSearch, hideWithoutStudies, columnFilters])}
                    onRowDoubleClick={handleViewHistory}
                    actions={patientActions}
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
                    tableBackgroundImage={fondoImage}
                    tableBackgroundImageDark={backDarkImage}
                    mobileMode="cards"
                    allColumns={patientColumns}
                    visibleColumns={visibleColumns}
                    onToggleColumn={toggleColumn}
                    serverSideFiltering={true}
                    onColumnFiltersChange={(filters) => {
                        setColumnFilters(filters);
                        setPage(1);
                    }}
                />

                {/* Modal de Agregar/Editar Paciente */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedPatient(null);
                        setIsEditMode(false);
                    }}
                    title={isEditMode ? "Editar Paciente" : "Agregar Nuevo Paciente"}
                    description={isEditMode ? "Modifique los datos del paciente" : "Complete los datos del nuevo paciente"}
                    size="lg"
                >
                    <CreatePatientForm
                        onSubmit={handleCreatePatient}
                        isLoading={createPatientMutation.isPending}
                        initialData={isEditMode && selectedPatient ? {
                            name: selectedPatient.name,
                            surname: selectedPatient.surname,
                            documentnumber: selectedPatient.nationalcode,
                            birthdate: selectedPatient.birthdate,
                            gender: selectedPatient.gender as "M" | "F" | "Otro",
                            email: selectedPatient.email,
                            phone: selectedPatient.phone || "",
                            patientdomain_id: selectedPatient.patientid,
                            patientid: selectedPatient.patientid,
                        } : undefined}
                    />
                </Modal>

            </div>
        </MainLayout>
    );
};
