import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { Calendar } from "lucide-react"
import { useState } from "react"

export const AdmisionCita = () => {

    const [searchTerm, setSearchTerm] = useState("");
    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Admisionar citas de hoy</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar por paciente, medico, médico y equipo..."
                    />
                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">Citas a admisionar</h2>
                </div>

                {/*  {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic<Patient>
                        data={(patientsData?.data?.data) || []}
                        columns={patientColumns}
                        showIndex
                        onRowDoubleClick={handleViewHistory}
                        actions={patientActions}
                        pagination={pagination}
                        onPaginationChange={(newPage) => {
                            setPage(newPage);
                        }}
                    />
                )} */}




            </div>
        </MainLayout>
    )
}
