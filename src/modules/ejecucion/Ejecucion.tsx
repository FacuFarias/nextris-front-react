import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';
import { InputSearch } from '@/components/InputSearch';
import { MainLayout } from '@/layouts/layout'
import { HandHelping } from 'lucide-react';
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useEjecucion } from './hooks/use-ejecucion';
import TablaDynamic from '@/components/TableDynamic';
import { ejecucionColumns, getEjecucionActions } from './components/columns';
import fondoImage from "@/assets/ejecucion.jpg";
import backDarkImage from "@/assets/back-dark.jpg";
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
        const params = new URLSearchParams();
        if (Array.isArray(ejecucion.flags) && ejecucion.flags.length > 0) {
            params.set('flags', ejecucion.flags.join(','));
        }
        if (Array.isArray(ejecucion.tag_ids) && ejecucion.tag_ids.length > 0) {
            params.set('tag_ids', ejecucion.tag_ids.join(','));
        }

        const query = params.toString();
        navigate(`/ejecucion/detalle/${ejecucion.guid}${query ? `?${query}` : ''}`);
    };

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm z-10 flex flex-col flex-1 min-h-0">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <HandHelping className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Ejecutar Órdenes</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar paciente o historial..."
                    />
                </div>



                <TablaDynamic
                    data={filteredData}
                    columns={ejecucionColumns}
                    showIndex
                    loading={isLoading}
                    preserveTableHeight
                    stickyPagination
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
                    perPageValue={pageSize}
                    onPerPageChange={(value) => {
                        setPageSize(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    tableBackgroundImage={fondoImage}
                    tableBackgroundImageDark={backDarkImage}
                />


            </div>
        </MainLayout>
    )
}
