import { MainLayout } from '@/layouts/layout';
import { Eye, FileText, HelpCircle, MoveHorizontal, AlertCircle, Camera, ClipboardList, Play, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDetalleEjecucion, useDetalleEjecucionPost } from './hooks/use-detalle-ejecucion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { PrimaryButton } from '@/components';
import type { DetalleEjecucionRequest } from './types/detalle-ejecucion.type';
import { Button } from '@/components/ui/button';

export const DetalleEjecucion = () => {
    const { guid } = useParams<{ guid: string }>();
    const navigate = useNavigate();
    const { detalleData, isLoading } = useDetalleEjecucion(guid!);
    const [historiaClinica, setHistoriaClinica] = useState(detalleData?.data?.history || '');
    const [preguntaClinica, setPreguntaClinica] = useState(detalleData?.data?.clinical_question || '');
    const [lateralidad, setLateralidad] = useState(detalleData?.data?.laterality || '');
    const [stat, setStat] = useState(detalleData?.data?.stat ? 'Si' : 'No');
    const [numeroVistas, setNumeroVistas] = useState(detalleData?.data?.number_of_views?.toString() || '');
    const [otrosDetalles, setOtrosDetalles] = useState(detalleData?.data?.other_details || '');

    const isRX = detalleData?.data?.study_type?.toUpperCase().startsWith('RX');
    const { postDetalleEjecucion } = useDetalleEjecucionPost(guid!, () => {
        navigate('/ejecucion');
    });
    const handleEjecutarOrden = () => {
        const data: DetalleEjecucionRequest = {
            history: historiaClinica,
            clinical_question: preguntaClinica,
            laterality: lateralidad,
            stat: stat === 'Si',
            number_of_views: Number(numeroVistas),
            other_details: otrosDetalles,
        };

        postDetalleEjecucion(data);
    };

    return (
        <MainLayout>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-6 shadow-sm z-10">
                {/* Botón volver */}
                <Button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-transparent text-gray-600  mb-4 hover:bg-transparent"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Volver</span>
                </Button>

                {/* Header con botón de ejecutar */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-purple p-2 rounded-full">
                            <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-purple">
                                Detalles de la Orden: {detalleData?.data?.patient_name}
                            </h1>
                        </div>
                    </div>
                    <PrimaryButton
                        onClick={handleEjecutarOrden}
                    >
                        <Play className="w-5 h-5" />
                        Ejecutar Orden
                    </PrimaryButton>
                </div>

                {isLoading ? (
                    <div className='flex justify-center items-center h-40'>
                        <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Fila 1: Historia Clínica y Pregunta Clínica */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Historia Clínica */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-brand-purple font-semibold text-base">
                                    <FileText className="w-5 h-5" />
                                    Historia Clínica
                                </Label>
                                <textarea
                                    value={historiaClinica}
                                    onChange={(e) => setHistoriaClinica(e.target.value)}
                                    placeholder="Ingrese la historia clínica del paciente"
                                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all duration-200 resize-none"
                                />
                            </div>

                            {/* Pregunta Clínica */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-brand-purple font-semibold text-base">
                                    <HelpCircle className="w-5 h-5" />
                                    Pregunta Clínica
                                </Label>
                                <textarea
                                    value={preguntaClinica}
                                    onChange={(e) => setPreguntaClinica(e.target.value)}
                                    placeholder="¿Qué se busca diagnosticar?"
                                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all duration-200 resize-none"
                                />
                            </div>
                        </div>

                        {/* Fila 2: Lateralidad, STAT y Número de Vistas */}
                        <div className={`grid grid-cols-1 gap-6 ${isRX ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                            {/* Lateralidad */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-brand-purple font-semibold text-base">
                                    <MoveHorizontal className="w-5 h-5" />
                                    Lateralidad
                                </Label>
                                <Select value={lateralidad} onValueChange={setLateralidad}>
                                    <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-brand-purple">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Izquierda">Izquierda</SelectItem>
                                        <SelectItem value="Derecha">Derecha</SelectItem>
                                        <SelectItem value="Bilateral">Bilateral</SelectItem>
                                        <SelectItem value="No aplica">No aplica</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* STAT (Urgente) */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-red-600 font-semibold text-base">
                                    <AlertCircle className="w-5 h-5" />
                                    STAT (Urgente)
                                </Label>
                                <Select value={stat} onValueChange={setStat}>
                                    <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-red-500">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Si">Sí</SelectItem>
                                        <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Número de Vistas - Solo para estudios RX */}
                            {isRX && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-teal-600 font-semibold text-base">
                                        <Camera className="w-5 h-5" />
                                        Número de Vistas
                                    </Label>
                                    <Select value={numeroVistas} onValueChange={setNumeroVistas}>
                                        <SelectTrigger className="w-full border-gray-300 focus:ring-2 focus:ring-teal-500">
                                            <SelectValue placeholder="Ej: 2" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="4">4</SelectItem>
                                            <SelectItem value="5">5</SelectItem>
                                            <SelectItem value="6">6</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {/* Fila 3: Otros Detalles Técnicos */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-brand-purple font-semibold text-base">
                                <ClipboardList className="w-5 h-5" />
                                Otros Detalles Técnicos
                            </Label>
                            <textarea
                                value={otrosDetalles}
                                onChange={(e) => setOtrosDetalles(e.target.value)}
                                placeholder="Observaciones adicionales, preparación del paciente, etc."
                                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-all duration-200 resize-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
