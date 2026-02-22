import { MainLayout } from "@/layouts/layout";
import { useState } from "react";
import { DynamicBreadcrumb } from "@/components";
import TablaDynamic from "@/components/TableDynamic";
import { createStudyColumns } from "./components/columns";
import { StudyFilters } from "./components/StudyFilters";
import { useEstudios } from "./hooks/use-estudios";
import { ShareStudyModal } from "./components/ShareStudyModal";
import { FileSearch, AlertCircle, BookPlus } from "lucide-react";
import type { Study } from "./types";

export const Estudios = () => {
    const [page, setPage] = useState(1);
    const [shareStudy, setShareStudy] = useState<Study | null>(null);
    const perPage = 10;

    const { studiesData, isLoading, isError, error } = useEstudios({
        page,
        per_page: perPage,
        status: "reported",
    });

    const pagination = studiesData && {
        page: studiesData.data.page,
        pageSize: studiesData.data.per_page,
        total: studiesData.data.total,
    };

    const columns = createStudyColumns((study) => setShareStudy(study));

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10">
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Mis estudios</h1>
                </div>

                {/* Contador */}
                <StudyFilters totalCount={studiesData?.data?.total || 0} />

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
                            Aún no tienes estudios médicos con informe disponible.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-transparent rounded-lg shadow-sm border dark:border-[rgba(255,255,255,0.07)]">
                        <TablaDynamic
                            data={studiesData.data.data}
                            columns={columns}
                            pagination={pagination}
                            onPaginationChange={(newPage) => {
                                setPage(newPage);
                            }}
                        />
                    </div>
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
