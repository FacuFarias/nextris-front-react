import { ResponsiblePortal } from "@/modules/veterinary/ResponsiblePortal";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/layouts/layout";
import { useState } from "react";
import { DynamicBreadcrumb } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { createStudyColumns } from "./components/columns";
import { useEstudios } from "./hooks/use-estudios";
import { ShareStudyModal } from "./components/ShareStudyModal";
import { StudyCard } from "./components/StudyCard";
import { FileSearch, AlertCircle, BookPlus, Search, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { useStudyShare } from "./hooks/use-study-share";
import { useMisDatos } from "@/modules/mis-datos/hooks/use-mis-datos";

const HumanEstudios = () => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const share = useStudyShare();
    const { profile } = useMisDatos();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [search, setSearch] = useState("");

    const { studiesData, isLoading, isError, error, refetch } = useEstudios({
        page,
        per_page: perPage,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: search || undefined,
    });

    const pagination = studiesData && {
        page: studiesData.data.page,
        pageSize: studiesData.data.per_page,
        total: studiesData.data.total,
    };

    const patient = studiesData?.data.data[0];

    const columns = createStudyColumns(share.start);

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

    const clearFilters = () => {
        setDateFrom("");
        setDateTo("");
        setSearch("");
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleDateChange = (field: "from" | "to", value: string) => {
        if (field === "from") setDateFrom(value);
        else setDateTo(value);
        setPage(1);
    };

    const hasActiveFilters = dateFrom || dateTo || search;

    return (
        <MainLayout>
            <div className="page-dark-gradient min-w-0 rounded-2xl p-3 sm:p-6 shadow-sm flex flex-col gap-1">
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">Mis estudios</p>
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-300 [overflow-wrap:anywhere]">
                            {profile?.full_name || patient?.patient_name || "Mis estudios"}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 [overflow-wrap:anywhere]">
                            ID del paciente: {profile?.patient_id_number || patient?.patient_id || "-"}
                        </p>
                    </div>
                </div>

                <div className="mb-4 space-y-3">
                    <label htmlFor="patient-study-search" className="sr-only">Buscar estudios</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input id="patient-study-search" type="search" value={search} onChange={event => handleSearchChange(event.target.value)}
                            placeholder="Buscar estudio, acceso o médico"
                            className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-base text-foreground focus:outline-2 focus:outline-brand-purple" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => setFiltersOpen(value => !value)} aria-expanded={filtersOpen} aria-controls="patient-study-dates" className="gap-2">
                            <Calendar className="h-4 w-4" />Filtrar por fecha{(dateFrom || dateTo) ? " · Activo" : ""}
                        </Button>
                        {hasActiveFilters && <Button variant="ghost" onClick={clearFilters} className="gap-2"><X className="h-4 w-4" />Limpiar filtros</Button>}
                    </div>
                    {filtersOpen && <div id="patient-study-dates" className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-2">
                        <label className="min-w-0 space-y-1 text-sm font-medium">Desde
                            <DateInput value={dateFrom} onChange={value => handleDateChange("from", value)} className="block min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 text-base" />
                        </label>
                        <label className="min-w-0 space-y-1 text-sm font-medium">Hasta
                            <DateInput value={dateTo} onChange={value => handleDateChange("to", value)} className="block min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 text-base" />
                        </label>
                    </div>}
                </div>

                {/* Contenido */}
                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : isError ? (
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-800 dark:text-red-300">
                            Error al cargar los estudios: {error?.message || "Error desconocido"}
                        </p>
                        <Button variant="outline" onClick={() => { void refetch(); }}>Reintentar</Button>
                    </div>
                ) : !studiesData?.data || studiesData.data.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-[#1a1b24] rounded-lg border dark:border-[rgba(255,255,255,0.07)] mt-5">
                        <FileSearch className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No se encontraron estudios
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                            {search || dateFrom || dateTo
                                ? "No hay estudios que coincidan con los filtros aplicados."
                                : "Aún no tienes estudios médicos disponibles."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Vista móvil: tarjetas */}
                        <div className="md:hidden flex flex-col gap-4">
                            <div className="space-y-3">
                                {studiesData.data.data.map((study) => (
                                    <StudyCard
                                        key={study.examination_id}
                                        study={study}
                                        onShare={share.start}
                                    />
                                ))}
                            </div>
                            {/* Paginación móvil */}
                            {pagination && pagination.total > 0 && (
                                <div className="flex flex-col items-center gap-2 pt-4 pb-2 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="min-h-11 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {page} de {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="min-h-11 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                    <select
                                        aria-label="Estudios por página"
                                        value={perPage}
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="min-h-11 px-3 py-2 text-base rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b24] text-gray-700 dark:text-gray-300"
                                    >
                                        {[10, 20, 50, 100].map((opt) => (
                                            <option key={opt} value={opt}>{opt} / página</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Vista escritorio: tabla */}
                        <div className="hidden md:flex flex-col bg-white dark:bg-transparent rounded-lg shadow-sm border dark:border-[rgba(255,255,255,0.07)] flex-1 min-h-0 mt-5">
                            <TablaDynamic
                                data={studiesData.data.data}
                                rowIdKey="examination_id"
                                filterAnimationKey={JSON.stringify([search, dateFrom, dateTo])}
                                columns={columns}
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
                                tableClassName="[&_tbody_td]:text-sm [&_tbody_td_.text-xs]:text-sm"
                            />
                        </div>
                    </>
                )}
            </div>

            {share.state && (
                <ShareStudyModal
                    state={share.state}
                    onClose={share.close}
                    onCopy={share.copy}
                    onRetry={() => share.start(share.state!.study)}
                    onRetryQr={share.retryQr}
                />
            )}
        </MainLayout>
    );
};

export const Estudios = () => { const { authData } = useAuth(); return authData?.user.portal_subject === "responsible" ? <ResponsiblePortal /> : <HumanEstudios />; };
