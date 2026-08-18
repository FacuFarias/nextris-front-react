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
    const [perPage, setPerPage] = useState(10);
    const mutation = usePostReasignacionExamenes();
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
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm border border-border dark:border-[rgba(255,255,255,0.06)] dark:shadow-[0_8px_48px_rgba(0,0,0,0.5),0_0_0_1px_rgba(139,92,246,0.08)] z-10 h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-brand-purple dark:bg-gradient-to-br dark:from-purple-600 dark:to-purple-900 p-2 rounded-lg dark:shadow-[0_0_16px_rgba(139,92,246,0.5),0_2px_8px_rgba(0,0,0,0.4)]">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]">Reasignación de Exámenes</h1>
                </div>

                    {/* Tabs modernos */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-h-0 flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-2 h-auto bg-purple-50/50 dark:bg-purple-950/50 p-1 rounded-xl gap-2">
                            <TabsTrigger
                                value="estudios"
                                className="bg-purple-100 dark:bg-purple-900/40 text-gray-700 dark:text-gray-300 data-[state=active]:bg-brand-purple dark:data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <ClipboardList className="w-4 h-4" />

                                <span className="font-semibold">1. Estudios: <span className="text-md">{selectedEstudio?.study_description} </span></span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="pacientes"
                                disabled={!selectedEstudio}
                                className="bg-purple-100 dark:bg-purple-900/40 text-gray-700 dark:text-gray-300 data-[state=active]:bg-brand-purple dark:data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed enabled:cursor-pointer"
                            >
                                <User className="w-4 h-4" />

                                <span className="font-semibold">2. Pacientes</span>
                            </TabsTrigger>

                        </TabsList>

                        {/* Tab Content - Estudios */}
                        <TabsContent value="estudios" className="mt-6 space-y-4 min-h-0 flex-1 flex flex-col">
                            <TablaDynamic<reasignacioType>
                                data={(estudios?.data || [])}
                                columns={reasignacionColumns}
                                showIndex
                                loading={isLoading}
                                selectedRow={selectedEstudio}
                                rowIdKey="guid"
                                onRowClick={(estudio) => {
                                    setSelectedEstudio(estudio);
                                }}
                                onRowDoubleClick={(estudio) => {
                                    setSelectedEstudio(estudio);
                                    setActiveTab("pacientes");
                                }}
                                emptyMessage="Seleccione un estudio para pasar a los pacientes."

                                pagination={{
                                    page,
                                    pageSize: perPage,
                                    serverSide: false,
                                    total: Array.isArray(estudios?.data) ? estudios.data.length : 0,
                                }}
                                onPaginationChange={(newPage) => {
                                    setPage(newPage);
                                }}
                                perPageValue={perPage}
                                onPerPageChange={(value) => {
                                    setPerPage(value);
                                    setPage(1);
                                }}
                                perPageOptions={[10, 20, 50, 100]}
                            />
                        </TabsContent>

                        {/* Tab Content - Pacientes */}
                        <TabsContent value="pacientes" className="mt-6 min-h-0 flex-1 flex flex-col">
                            <ReasingacionPacientes selectedEstudio={selectedEstudio} handleSubmit={handleSubmit} />
                        </TabsContent>

                    </Tabs>


            </div>
        </MainLayout>
    )
}
