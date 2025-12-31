import { MainLayout } from '@/layouts/layout'
import { useLocation, useNavigate } from 'react-router-dom'
import { useHistorialPaciente, useViewImagenDicom } from './hooks/use-historial-paciente';
import { Search, ArrowLeft } from 'lucide-react';
import { InputSearch } from '@/components/InputSearch';
import { useState } from 'react';
import { TablaDynamic } from '@/components/TableDynamic';
import type { HistoryPatient } from '../types/BuscarPaciente';
import { getHistoryPatientActions, historyColumns } from './components/columns';
import { DynamicBreadcrumb } from '@/components/DynamicBreadcrumb';
import { Button } from '@/components/ui/button';

export const HistorialPaciente = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState("");
    const { historyData, isLoading } = useHistorialPaciente({ patientId: location?.state?.patient.guid });
    const { viewImagenDicom } = useViewImagenDicom();
    const onViewImage = (patient: HistoryPatient) => {
        viewImagenDicom({ imageId: patient.guid, userId: location?.state?.patient.guid! });
    };

    const onViewReport = (patient: HistoryPatient) => {
        console.log("asdas", patient)
    };

    // Generar las acciones con las funciones
    const patientActions = getHistoryPatientActions(
        onViewReport,
        onViewImage
    );
    return (
        <MainLayout>
            <div className="bg-white backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                <DynamicBreadcrumb />

                {/* Botón Volver */}

                {/* Header */}
                <div className="flex justify-between items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex gap-2 items-center">
                        <div className="bg-brand-purple p-2 sm:p-3 rounded-lg w-min">
                            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Historial Paciente / {location?.state?.patient.name} {location?.state?.patient?.surname}</h1>
                    </div>

                    <Button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 bg-transparent text-gray-600  mb-4 hover:bg-transparent"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Volver</span>
                    </Button>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar paciente o historial..."
                    />
                    {/* <PrimaryButton onClick={() => setIsModalOpen(true)}>
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        AGREGAR
                    </PrimaryButton> */}
                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">RESULTADOS</h2>
                </div>

                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic<HistoryPatient>
                        data={(historyData?.data) || []}
                        columns={historyColumns}
                        showIndex
                        onRowClick={(patient) => {
                            console.log("Paciente seleccionado:", patient);
                        }}
                        actions={patientActions}
                    /* pagination={pagination} */
                    /*  onPaginationChange={(newPage) => {
                         setPage(newPage);
                     }} */
                    />
                )}


            </div>
        </MainLayout>
    )
}
