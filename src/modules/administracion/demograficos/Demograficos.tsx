import { useMemo, useState } from "react";
import { Users, RefreshCcw } from "lucide-react";
import { MainLayout } from "@/layouts/layout";
import TablaDynamic from "@/components/TableDynamic";
import { toast } from "sonner";
import { InputSearch } from "@/components/InputSearch";
import { Autocomplete } from "@/components/autocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBodyParts } from "@/modules/configuracion/configuracion-tablas/examenes/partes-cuerpo";
import { useModalidades } from "@/modules/configuracion/configuracion-tablas/examenes/modalidades";
import { useGrupoEstudio } from "@/modules/configuracion/configuracion-tablas/examenes/grupos-estudio";
import { useDemograficos, useUpdateDemograficos } from "./hooks/use-demograficos";
import { demograficosColumns } from "./components/columns";
import { EditarDemograficos } from "./components/EditarDemograficos";
import type { Examinacion, UpdateDemograficosPayload } from "./types/demograficos.type";
import fondoImage from "@/assets/redaccion.jpg";
import backDarkImage from "@/assets/back-dark.jpg";

const DATE_RANGE_DAYS: Record<string, number> = {
    "1d": 1, "3d": 3, "7d": 7, "14d": 14,
    "1m": 30, "2m": 60, "3m": 90, "1y": 365,
};

function isOlderThan(isoDate: string, days: number): boolean {
    if (!isoDate) return false;
    const diff = (Date.now() - new Date(isoDate).getTime()) / 86400000;
    return diff > days;
}

export const Demograficos = () => {
    const { examinaciones, isLoading, refetch } = useDemograficos();
    const updateMutation = useUpdateDemograficos();

    const [selected, setSelected] = useState<Examinacion | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [studyGroupId, setStudyGroupId] = useState<string | undefined>(undefined);
    const [modalityId, setModalityId] = useState<string | undefined>(undefined);
    const [bodyPartId, setBodyPartId] = useState<string | undefined>(undefined);
    const [dateRange, setDateRange] = useState("all");

    // Catálogos
    const { gruposEstudio } = useGrupoEstudio();
    const { modalidades } = useModalidades();
    const { bodyParts } = useBodyParts();

    const gruposOptions = useMemo(() => {
        if (!Array.isArray(gruposEstudio?.data)) return [];
        return gruposEstudio.data.map((g: any) => ({ value: g.guid, label: g.description }));
    }, [gruposEstudio]);

    const modalidadesOptions = useMemo(() => {
        if (!Array.isArray(modalidades?.data)) return [];
        return modalidades.data.map((m: any) => ({ value: m.guid, label: m.description }));
    }, [modalidades]);

    const bodyPartsOptions = useMemo(() => {
        if (!Array.isArray(bodyParts?.data)) return [];
        return bodyParts.data.map((b: any) => ({ value: b.guid, label: b.description }));
    }, [bodyParts]);

    // Filtrado client-side
    const filteredData = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return examinaciones.filter(ex => {
            if (search) {
                const fullName = `${ex.name} ${ex.surname}`.toLowerCase();
                const matches =
                    fullName.includes(search) ||
                    ex.nationalcode.toLowerCase().includes(search) ||
                    ex.localacc.toLowerCase().includes(search) ||
                    ex.study_type.toLowerCase().includes(search);
                if (!matches) return false;
            }
            if (studyGroupId && ex.studygroup_id !== studyGroupId) return false;
            if (modalityId && ex.modality_id !== modalityId) return false;
            if (bodyPartId && ex.bodypart_id !== bodyPartId) return false;
            if (dateRange !== "all") {
                const days = DATE_RANGE_DAYS[dateRange];
                if (days && !isOlderThan(ex.createdon_raw, days)) return false;
            }
            return true;
        });
    }, [examinaciones, searchTerm, studyGroupId, modalityId, bodyPartId, dateRange]);

    const handleDoubleClick = (exam: Examinacion) => {
        setSelected(exam);
        setModalOpen(true);
    };

    const handleSave = (guid: string, payload: UpdateDemograficosPayload) => {
        updateMutation.mutate({ guid, payload }, {
            onSuccess: (data) => {
                toast.success(data.message || "Datos actualizados correctamente");
                setModalOpen(false);
                setSelected(null);
            },
            onError: () => {
                toast.error("Error al actualizar los datos");
            },
        });
    };

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="bg-brand-purple p-2 rounded-lg">
                        <Users className="w-4 h-4 sm:w-6 sm:h-5 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Demográficos</h1>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 mb-2 dark:bg-[#2a2e32] dark:border-gray-700">
                    {/* Búsqueda y catálogos */}
                    <div className="flex flex-col gap-2 flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros</span>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="sm:min-w-[250px]">
                                <InputSearch
                                    searchTerm={searchTerm}
                                    setSearchTerm={(v) => { setSearchTerm(v); setPage(1); }}
                                    placeholder="Buscar paciente, DNI o accession..."
                                />
                            </div>
                            <Autocomplete
                                options={gruposOptions}
                                value={studyGroupId}
                                onValueChange={(v) => { setStudyGroupId(v); setPage(1); }}
                                placeholder="Grupo de estudio"
                                emptyMessage="No se encontraron grupos."
                                searchPlaceholder="Buscar grupo..."
                            />
                            <Autocomplete
                                options={modalidadesOptions}
                                value={modalityId}
                                onValueChange={(v) => { setModalityId(v); setPage(1); }}
                                placeholder="Modalidad"
                                emptyMessage="No se encontraron modalidades."
                                searchPlaceholder="Buscar modalidad..."
                            />
                            <Autocomplete
                                options={bodyPartsOptions}
                                value={bodyPartId || ""}
                                onValueChange={(v) => { setBodyPartId(v); setPage(1); }}
                                placeholder="Parte del cuerpo"
                                emptyMessage="No se encontraron partes del cuerpo."
                                searchPlaceholder="Buscar parte..."
                            />
                        </div>
                    </div>

                    <div className="hidden sm:block w-px bg-gray-300 self-stretch" />
                    <div className="block sm:hidden h-px bg-gray-300" />

                    {/* Rango de fechas */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fechas</span>
                        <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
                            <SelectTrigger className="h-9 text-sm min-w-[150px]">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo</SelectItem>
                                <SelectItem value="1d">Hace &gt; 1 día</SelectItem>
                                <SelectItem value="3d">Hace &gt; 3 días</SelectItem>
                                <SelectItem value="7d">Hace &gt; 7 días</SelectItem>
                                <SelectItem value="14d">Hace &gt; 14 días</SelectItem>
                                <SelectItem value="1m">Hace &gt; 1 mes</SelectItem>
                                <SelectItem value="2m">Hace &gt; 2 meses</SelectItem>
                                <SelectItem value="3m">Hace &gt; 3 meses</SelectItem>
                                <SelectItem value="1y">Hace &gt; 1 año</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabla */}
                <TablaDynamic<Examinacion>
                    data={filteredData}
                    columns={demograficosColumns}
                    showIndex
                    loading={isLoading}
                    rowIdKey="exam_guid"
                    selectedRow={selected}
                    onRowDoubleClick={handleDoubleClick}
                    emptyMessage="No hay estudios para mostrar."
                    tableBackgroundImage={fondoImage}
                    tableBackgroundImageDark={backDarkImage}
                    pagination={{
                        page,
                        pageSize: perPage,
                        serverSide: false,
                        total: filteredData.length,
                    }}
                    onPaginationChange={(newPage) => setPage(newPage)}
                    perPageValue={perPage}
                    onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
                    perPageOptions={[10, 20, 50, 100]}
                    additionalControls={
                        <button
                            onClick={() => {
                                refetch();
                                toast.success("Lista actualizada");
                            }}
                            className="p-1.5 rounded-md bg-brand-purple text-white hover:bg-brand-purple/90 transition-colors cursor-pointer"
                        >
                            <RefreshCcw className="h-4 w-4" />
                        </button>
                    }
                />
            </div>

            <EditarDemograficos
                examinacion={selected}
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelected(null); }}
                onSave={handleSave}
                isSaving={updateMutation.isPending}
            />
        </MainLayout>
    );
};
