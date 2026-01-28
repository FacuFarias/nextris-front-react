import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';
import { InputSearch } from '@/components/InputSearch';
import { MainLayout } from '@/layouts/layout'
import { HandHelping } from 'lucide-react';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useEjecucion } from './hooks/use-ejecucion';
import TablaDynamic from '@/components/TableDynamic';
import { ejecucionColumns, getEjecucionActions } from './components/columns';
import type { Ejecucion as EjecucionType } from './types/ejecucion.type';

export const Ejecucion = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const navigate = useNavigate();
    const { ejecucionData, isLoading } = useEjecucion();

    // Filtrar datos por el término de búsqueda
    const filteredData = ejecucionData?.data?.filter((item: EjecucionType) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            item.patient_name?.toLowerCase().includes(searchLower) ||
            item.guid?.toLowerCase().includes(searchLower) ||
            item.study_type?.toLowerCase().includes(searchLower) ||
            item.status?.toLowerCase().includes(searchLower)
        );
    }) || [];


    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleVerDetalle = (ejecucion: EjecucionType) => {
        navigate(`/ejecucion/detalle/${ejecucion.guid}`);
    };

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <HandHelping className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Ejecutar Órdenes</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar paciente o historial..."
                    />
                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">Resultados de Órdenes</h2>
                </div>

                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic
                        data={filteredData}
                        columns={ejecucionColumns}
                        showIndex
                        actions={getEjecucionActions(handleVerDetalle)}
                        onRowDoubleClick={(ejecucion: EjecucionType) => {
                            handleVerDetalle(ejecucion);
                        }
                        }
                        pagination={{
                            page,
                            pageSize,
                            serverSide: false,
                            total: filteredData.length,
                        }}
                        onPaginationChange={handlePaginationChange}
                    />
                )}


            </div>
        </MainLayout>
    )
}
