//react
import { useState } from "react";
//components
import { reasignacionColumns } from "./components/columns";
import TablaDynamic from "@/components/TableDynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

//icons and react
import { Calendar, ClipboardList, User } from "lucide-react";
//layout
import { MainLayout } from "@/layouts/layout"
//hooks
import { usePostReasignacionExamenes, useReasignacionExamenes } from "./hooks/use-reasignacion-examenes";
//types
import type { ReasignacionExamenes as reasignacioType } from "./types/reasignacion-examenes.type";
import { ReasingacionPacientes } from "./components/ReasingacionPacientes";
import { toast } from "sonner";


export const ReasignacionExamenes = () => {
    const [activeTab, setActiveTab] = useState<string>("estudios");
    const [selectedEstudio, setSelectedEstudio] = useState<reasignacioType | null>(null);
    const { estudios, isLoading } = useReasignacionExamenes();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const mutation = usePostReasignacionExamenes();
    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };
    const handleSubmit = ({ estudio_id, paciente_id }: { estudio_id: string, paciente_id: string }) => {
        const data = { estudio_id, paciente_id };
        mutation.createMutation.mutate(data, {
            onSuccess: (data) => {
                toast.success(data.message || 'Estudio reasignado exitosamente');
                setSelectedEstudio(null);
                setActiveTab("estudios");
                setPage(1);

            },
            onError: () => {
                toast.error("Error al reasignar estudio");
            },
        });
    }
    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Header con Tabs integrados */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-brand-purple p-2.5 rounded-lg">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-brand-purple">Reasignacion de Examenes</h1>
                    </div>

                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-auto bg-purple-50/50 p-1 rounded-xl gap-2">
                            <TabsTrigger
                                value="estudios"
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <ClipboardList className="w-4 h-4" />

                                <span className="font-semibold">1. Estudios: <span className="text-md">{selectedEstudio?.study_description} </span></span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="pacientes"
                                disabled={!selectedEstudio}
                                className="bg-purple-100 data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                            >
                                <User className="w-4 h-4" />

                                <span className="font-semibold">2. Pacientes</span>
                            </TabsTrigger>

                        </TabsList>

                        {/* Tab Content - Paciente */}
                        <TabsContent value="estudios" className="mt-6 space-y-4">
                            {/* Tabla de pacientes */}
                            <div className="bg-white rounded-lg border border-purple-100 p-4">
                                <div className="w-full flex justify-between">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                                        Seleccione un estudio
                                    </h2>
                                </div>

                                {isLoading ? (
                                    <div className='flex justify-center items-center h-40'>
                                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                                    </div>
                                ) : (
                                    <TablaDynamic<reasignacioType>
                                        data={(estudios?.data || [])}
                                        columns={reasignacionColumns}
                                        showIndex
                                        selectedRow={selectedEstudio}
                                        rowIdKey="guid"
                                        onRowDoubleClick={(estudio) => {
                                            setSelectedEstudio(estudio);
                                            setActiveTab("pacientes");
                                        }}
                                        emptyMessage="Seleccione un estudio para pasar a los pacientes."

                                        pagination={{
                                            page,
                                            pageSize,
                                            serverSide: false,
                                            total: Array.isArray(estudios?.data) ? estudios.data.length : 0,
                                        }}
                                        onPaginationChange={handlePaginationChange}
                                    />
                                )}
                            </div>
                        </TabsContent>

                        {/* Tab Content - Examen */}
                        <TabsContent value="pacientes" className="mt-6">
                            <ReasingacionPacientes selectedEstudio={selectedEstudio} handleSubmit={handleSubmit} />
                        </TabsContent>

                    </Tabs>
                </div>


            </div>
        </MainLayout>
    )
}
