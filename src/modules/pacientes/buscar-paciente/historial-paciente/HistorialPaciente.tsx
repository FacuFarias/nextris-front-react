import { MainLayout } from '@/layouts/layout'
import { useLocation, useNavigate } from 'react-router-dom'
import { useHistorialPaciente, useViewImagenDicom } from './hooks/use-historial-paciente';
import { Search, ArrowLeft } from 'lucide-react';
import { InputSearch } from '@/components/InputSearch';
import { useMemo, useState } from 'react';
import { TablaDynamic } from '@/components/TableDynamic';
import type { HistoryPatient } from '../types/BuscarPaciente';
import { getHistoryPatientActions, historyColumns } from './components/columns';
import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';
import { Button } from '@/components/ui/button';
import fondoImage from "@/assets/fondo1.png";
import backDarkImage from "@/assets/back-dark.jpg";
import { useDebounce } from '@uidotdev/usehooks';
import { useAuth } from '@/context/AuthContext';

export const HistorialPaciente = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { authData } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const { historyData, isLoading } = useHistorialPaciente({ patientId: location?.state?.patient.guid });
    const { viewImagenDicom } = useViewImagenDicom();

    const onViewImage = (patient: HistoryPatient) => {
        const currentUserId = authData?.user?.id;
        if (!currentUserId) {
            return;
        }
        viewImagenDicom({ imageId: patient.guid, userId: currentUserId });
    };

    const onViewReport = (patient: HistoryPatient) => {
        if (!patient.pdf_path) {
            return;
        }
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        window.open(`${baseURL}/pdfs/${patient.pdf_path}`, '_blank');
    };

    // Generar las acciones con las funciones
    const patientActions = getHistoryPatientActions(
        onViewReport,
        onViewImage
    );

    // Filtrado local por búsqueda
    const filteredData = useMemo(() => {
        const data = historyData?.data || [];
        if (!debouncedSearch) return data;
        const search = debouncedSearch.toLowerCase();
        return data.filter((item) =>
            item.estudio?.toLowerCase().includes(search) ||
            item.medico_autor?.toLowerCase().includes(search) ||
            item.medico_referente?.toLowerCase().includes(search) ||
            item.modalidad?.toLowerCase().includes(search) ||
            item.fecha?.toLowerCase().includes(search)
        );
    }, [historyData?.data, debouncedSearch]);

    // Paginación local
    const paginatedData = useMemo(() => {
        const start = (page - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, page, perPage]);

    const pagination = {
        page,
        pageSize: perPage,
        total: filteredData.length,
    };

    return (
        <MainLayout>
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm border border-border z-10 h-full flex flex-col overflow-hidden">
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex justify-between items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex gap-2 items-center">
                        <div className="bg-brand-purple p-2 sm:p-3 rounded-lg w-min">
                            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Historial Paciente / {location?.state?.patient.name} {location?.state?.patient?.surname}</h1>
                    </div>

                    <Button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 bg-transparent text-gray-600 mb-4 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-5 h-5 dark:text-purple-400" />
                        <span className="font-medium dark:text-purple-400">Volver</span>
                    </Button>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={(value) => {
                            setSearchTerm(value);
                            setPage(1);
                        }}
                        placeholder="Buscar estudio, médico, modalidad..."
                    />
                </div>


                <TablaDynamic<HistoryPatient>
                    data={paginatedData}
                    columns={historyColumns}
                    showIndex
                    loading={isLoading}
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
                />
            </div>
        </MainLayout>
    )
}
