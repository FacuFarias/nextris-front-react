import TablaDynamic from "@/components/TableDynamic";
import { useTiposEstudio } from "./hooks/useTiposEstudio";
import { tipoEstudioColumns } from "./components/columns";
import { useState } from "react";

export const TiposEstudio = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const { tiposEstudio, isLoading } = useTiposEstudio();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tipos de Estudio</h2>
                    <p className="text-muted-foreground">Gestión de tipos de estudios médicos</p>
                </div>
                <button className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90">
                    Nuevo Tipo de Estudio
                </button>
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(tiposEstudio?.data) ? tiposEstudio.data : []}
                    columns={tipoEstudioColumns}
                    showIndex

                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(tiposEstudio?.data) ? tiposEstudio.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

        </div>
    )
}
