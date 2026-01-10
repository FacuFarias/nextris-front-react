import { MainLayout } from "@/layouts/layout";
import { useState } from "react";
import { DynamicBreadcrumb } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { studyColumns } from "./components/columns";
import { StudyFilters } from "./components/StudyFilters";
import { useEstudios } from "./hooks/use-estudios";
import { FileSearch, AlertCircle, BookPlus } from "lucide-react";

export const Estudios = () => {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<"reported" | "pending" | "all">("all");
    const perPage = 10;

    const { studiesData, isLoading, isError, error } = useEstudios({
        page,
        per_page: perPage,
        status: status === "all" ? "" : status,
    });

    const pagination = studiesData && {
        page: studiesData.data.page,
        pageSize: studiesData.data.per_page,
        total: studiesData.data.total,
    };

    const handleStatusChange = (newStatus: "reported" | "pending" | "all") => {
        setStatus(newStatus);
        setPage(1); // Resetear a la primera página al cambiar filtro
    };

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                <DynamicBreadcrumb />


                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Mis estudios</h1>

                </div>
                {/* Filtros */}
                <StudyFilters
                    status={status}
                    onStatusChange={handleStatusChange}
                    totalCount={studiesData?.data?.total || 0}
                />

                {/* Contenido */}
                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : isError ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p className="text-sm text-red-800">
                            Error al cargar los estudios: {error?.message || "Error desconocido"}
                        </p>
                    </div>
                ) : !studiesData?.data || studiesData.data.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border mt-5">
                        <FileSearch className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No se encontraron estudios
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                            {status === "reported"
                                ? "No tienes estudios con informe disponible."
                                : status === "pending"
                                    ? "No tienes estudios pendientes de informe."
                                    : "Aún no tienes estudios médicos registrados."}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border">
                        <TablaDynamic
                            data={studiesData.data.data}
                            columns={studyColumns}
                            pagination={pagination}
                            onPaginationChange={(newPage) => {
                                setPage(newPage);
                            }}
                        />
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
