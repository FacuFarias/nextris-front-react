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
import type { Study } from "./types";

export const Estudios = () => {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [shareStudy, setShareStudy] = useState<Study | null>(null);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [search, setSearch] = useState("");

    const { studiesData, isLoading, isError, error } = useEstudios({
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

    const columns = createStudyColumns((study) => setShareStudy(study));

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
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 flex flex-col min-h-0 flex-1">
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">
                            {patient?.patient_name || "Patient Name"}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Patient ID: {patient?.patient_id || "-"}
                        </p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Buscar por N° acceso, tipo, médico, modalidad..."
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b24] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50"
                        />
                    </div>
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 min-[420px]:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]">
                        <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                        <DateInput
                            value={dateFrom}
                            onChange={(value) => handleDateChange("from", value)}
                            className="px-2 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b24] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 focus:border-brand-purple/50"
                        />
                        <span className="hidden text-xs text-gray-400 min-[420px]:inline">a</span>
                        <DateInput
                            value={dateTo}
                            onChange={(value) => handleDateChange("to", value)}
                            className="col-start-2 min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 focus:border-brand-purple/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/30 dark:border-gray-600 dark:bg-[#1a1b24] dark:text-gray-100 min-[420px]:col-start-auto"
                        />
                        {hasActiveFilters && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={clearFilters}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Contenido */}
                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : isError ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-800 dark:text-red-300">
                            Error al cargar los estudios: {error?.message || "Error desconocido"}
                        </p>
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
                        <div className="md:hidden flex-1 flex flex-col min-h-0 mt-5">
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                {studiesData.data.data.map((study) => (
                                    <StudyCard
                                        key={study.examination_id}
                                        study={study}
                                        onShare={(s) => setShareStudy(s)}
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
                                            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {page} de {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-3 py-1.5 text-xs rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                    <select
                                        value={perPage}
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1b24] text-gray-700 dark:text-gray-300"
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

            {shareStudy && (
                <ShareStudyModal
                    study={shareStudy}
                    onClose={() => setShareStudy(null)}
                />
            )}
        </MainLayout>
    );
};
