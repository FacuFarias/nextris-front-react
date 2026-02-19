
import { DynamicBreadcrumb, InputSearch } from "@/components";
import { MainLayout } from "@/layouts/layout"
import { Calendar, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useAdmisionCita, useAdmisionConfirm } from "./hooks/use-admision-cita";
import { admisionColumns, getAdmisionActions } from "./components/columns";
import TablaDynamic from "@/components/TableDynamic";
import { ModalAdmision } from "./components/ModalAdmision";
import type { Admision } from "./types/admision.type";
import fondoImage from "@/assets/calendar.jpg";

export const AdmisionCita = () => {

    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdmision, setSelectedAdmision] = useState<Admision | null>(null);

    const { admisionData, isLoading } = useAdmisionCita();
    const { postConfirmAdmision: confirmAdmision } = useAdmisionConfirm(selectedAdmision?.guid);

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (admision: Admision) => {
        setSelectedAdmision(admision);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAdmision(null);
    };


    const handleConfirmAdmision = async (admision: Admision) => {
        const data = {
            equipment_id: admision.equipo
        }
        confirmAdmision(data).then(() => {
            handleCloseModal();
        });
    };

    return (
        <MainLayout>
            <div className="bg-card backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10 flex flex-col flex-1 min-h-0">
                {/* Breadcrumb */}
                <DynamicBreadcrumb />

                {/* Header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple p-2 sm:p-3 rounded-lg">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400">Admisionar citas de hoy</h1>
                </div>

                {/* Barra de búsqueda */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 ">
                    <InputSearch
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        placeholder="Buscar por paciente, medico, médico y equipo..."
                    />
                </div>

                <TablaDynamic
                    data={(admisionData?.data) || []}
                    columns={admisionColumns}
                    showIndex
                    loading={isLoading}
                    preserveTableHeight
                    actions={getAdmisionActions(handleOpenModal)}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: admisionData?.data?.length || 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                    perPageValue={pageSize}
                    onPerPageChange={(value) => {
                        setPageSize(value);
                        setPage(1);
                    }}
                    perPageOptions={[10, 20, 50, 100]}
                    tableBackgroundImage={fondoImage}
                    stickyPagination
                    emptyMessage={
                        <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                            <CheckCircle className='w-16 h-16 text-green-500' />
                            <div className='text-center'>
                                <h3 className='text-xl font-bold text-green-600'>¡Todo al día!</h3>
                                <p className='text-gray-600 mt-1'>No hay citas pendientes de admisión</p>
                            </div>
                        </div>
                    }
                />
                {
                    isModalOpen &&
                    <ModalAdmision
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        admisionData={selectedAdmision}
                        onConfirm={handleConfirmAdmision}
                    />
                }

            </div>
        </MainLayout>
    )
}
