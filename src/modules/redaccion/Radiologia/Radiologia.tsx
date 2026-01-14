import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb"
import { InputSearch } from "@/components/InputSearch"
import { MainLayout } from "@/layouts/layout"
import { HandHelping } from "lucide-react"
import { useState } from "react"
import { useInformes } from "./hooks/use-informes"
import { getInformesActions, informeColumns } from "./components/columns"
import TablaDynamic from "@/components/TableDynamic"
import type { Informes } from "./types/informes.types"
import { useDebounce } from "@uidotdev/usehooks"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export const Radiologia = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [verFinalizados, setVerFinalizados] = useState(false);
    const [asignadosAMi, setAsignadosAMi] = useState(false);
    const [listoParaLeer, setListoParaLeer] = useState(true);
    const useDebounceSearch = useDebounce(searchTerm, 500);
    const { informesData, isLoading: isLoadingInformes } = useInformes({ page, per_page: 8, search: useDebounceSearch, show_reported: verFinalizados, show_ready: listoParaLeer });

    const pagination = informesData && {
        page: informesData?.data?.page || 1,
        pageSize: informesData?.data?.per_page || 5,
        total: informesData?.data?.total || 0,
    };

    const handleRedactarInforme = (informe: Informes) => {
        const url = `/redaccion/radiologia/redactar-informe/${informe.guid}/${informe.study_instance_uid}`;
        // Abrir en una nueva ventana sin barras de herramientas y restricciones
        window.open(
            url,
            '_blank',
            'toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1400,height=900,top=50,left=100'
        );
    };

    const handleViewImagenes = (informe: Informes) => {

        //abrir en otra pestaña
        window.open(
            `https://viewer.nextris.cloud/viewer?StudyInstanceUIDs=${informe.study_instance_uid}`,
            '_blank',
        );
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
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple">Redacción de reportes</h1>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex-1">
                        <InputSearch
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            placeholder="Buscar paciente o historial..."
                        />
                    </div>

                    {/* Filtros con checkboxes */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="listo-leer"
                                    checked={listoParaLeer}
                                    onCheckedChange={(checked) => setListoParaLeer(checked as boolean)}
                                    className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                                />
                                <Label
                                    htmlFor="listo-leer"
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Listo para leer
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="finalizados"
                                    checked={verFinalizados}
                                    onCheckedChange={(checked) => setVerFinalizados(checked as boolean)}
                                    className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                                />
                                <Label
                                    htmlFor="finalizados"
                                    className="text-sm font-medium text-gray-700 cursor-pointer"
                                >
                                    Ver finalizados
                                </Label>
                            </div>

                        </div>


                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="asignados"
                                checked={asignadosAMi}
                                onCheckedChange={(checked) => setAsignadosAMi(checked as boolean)}
                                className="data-[state=checked]:bg-brand-purple data-[state=checked]:border-brand-purple"
                            />
                            <Label
                                htmlFor="asignados"
                                className="text-sm font-medium text-gray-700 cursor-pointer"
                            >
                                Asignados a mí
                            </Label>
                        </div>



                    </div>
                </div>

                {/* Resultados */}
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-700">Resultados</h2>
                </div>

                {isLoadingInformes ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <TablaDynamic<Informes>
                        data={(informesData?.data?.data) || []}
                        columns={informeColumns}
                        showIndex
                        pagination={pagination}
                        actions={getInformesActions(handleRedactarInforme, handleViewImagenes)}
                        onPaginationChange={(newPage) => {
                            setPage(newPage);
                        }}
                    />
                )}


            </div>
        </MainLayout>
    )
}
