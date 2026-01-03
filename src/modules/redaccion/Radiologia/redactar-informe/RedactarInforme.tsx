import { useParams } from "react-router-dom"
import { useInformeDetalle } from "../hooks/use-informes";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LayoutSinSidebar } from "@/layouts/LayoutSinSidebar";

export const RedactarInforme = () => {

    const { informeGuid } = useParams<{ informeGuid: string | undefined }>();
    const { informeDetalle, isLoading } = useInformeDetalle(informeGuid);

    const [formData, setFormData] = useState({
        techniques: informeDetalle?.data?.techniques || '',
        findings: informeDetalle?.data?.findings || '',
        impressions: informeDetalle?.data?.impressions || '',
        conclusions: informeDetalle?.data?.conclusions || ''
    });

    // Estado para controlar qué secciones están abiertas/cerradas
    const [openSections, setOpenSections] = useState({
        datosExamen: true,
        datosTecnicos: true,
        informesPredefinidos: true,
        historiaClinicaSidebar: true,
        historiaClinica: true,
        tecnica: true,
        hallazgos: true,
        impresiones: true,
        conclusiones: true
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        console.log('Guardar:', formData);
    };

    const handleSign = () => {
        console.log('Firmar:', formData);
    };

    const handlePDF = () => {
        console.log('Generar PDF');
    };

    if (isLoading) {
        return <LayoutSinSidebar>Cargando...</LayoutSinSidebar>;
    }

    return (
        <LayoutSinSidebar>
            <div className="">
                {/* Header con botones de acción */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {informeDetalle?.data?.patient_name || 'Carlos Fernández'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            NR{informeDetalle?.data?.admission_number}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <PrimaryButton onClick={handlePDF}>PDF</PrimaryButton>
                        <PrimaryButton onClick={handleSign}>FIRMAR</PrimaryButton>
                        <PrimaryButton onClick={handleSave}>GUARDAR</PrimaryButton>
                    </div>
                </div>

                {/* Layout de dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-4 self-start sticky top-6">
                        {/* Datos del examen */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-4 py-3 flex justify-between items-center"
                                onClick={() => toggleSection('datosExamen')}
                            >
                                <h3 className="text-white font-semibold">Datos del examen</h3>
                                {openSections.datosExamen ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.datosExamen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Estudio</label>
                                        <p className="text-sm font-medium mt-1">ANGIOTOMOGRAFÍA PELVIANA O VASOS ILÍACOS</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-600 font-medium">Fecha</label>
                                            <p className="text-sm font-medium mt-1">13/12/2025</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 font-medium">Modalidad</label>
                                            <p className="text-sm font-medium mt-1">CT</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 font-medium">Médico Referente</label>
                                        <p className="text-sm font-medium mt-1">-</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Datos técnicos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('datosTecnicos')}
                            >
                                <h3 className="text-white font-semibold">Datos técnicos</h3>
                                {openSections.datosTecnicos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.datosTecnicos ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-6">
                                    <label className="text-xs text-gray-600 font-medium">Stat</label>
                                    <p className="text-sm font-medium mt-1">A</p>
                                </div>
                            </div>
                        </div>

                        {/* Informes predefinidos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('informesPredefinidos')}
                            >
                                <h3 className="text-white font-semibold">Informes predefinidos</h3>
                                {openSections.informesPredefinidos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.informesPredefinidos ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-6">
                                    <label className="text-xs text-gray-600 font-medium">Predef Seleccionado</label>
                                    <p className="text-sm font-medium mt-1 text-purple-400">
                                        ANGIOTOMOGRAFÍA PELVIANA O VASOS ILÍACOS
                                    </p>
                                    <button className="text-purple-600 text-sm mt-3 hover:underline">
                                        Cambiar plantilla
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Historia clínica */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('historiaClinicaSidebar')}
                            >
                                <h3 className="text-white font-semibold">Historia clínica</h3>
                                {openSections.historiaClinicaSidebar ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinicaSidebar ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-6">
                                    <Input value="sin info" disabled className="bg-gray-50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-4">
                        {/* Historia Clínica */}
                        <div className="bg-white rounded-xl shadow-sm border border-red-300 overflow-hidden relative">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('historiaClinica')}
                            >
                                <div className="flex items-center gap-3">
                                    <h3 className="text-white font-semibold">Historia Clínica</h3>
                                    <span className="text-xs bg-red-500 text-white px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                        🔒 Campo Bloqueado
                                    </span>
                                </div>
                                {openSections.historiaClinica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.historiaClinica ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2">
                                    <textarea
                                        className="w-full h-20 p-3 border-2 border-red-200 rounded-md bg-red-50 text-gray-500 resize-none cursor-not-allowed"
                                        placeholder="Historia clínica escrita por el técnico..."
                                        disabled
                                        value={informeDetalle?.data?.history}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Técnica de examen */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('tecnica')}
                            >
                                <h3 className="text-white font-semibold">Técnica de examen</h3>
                                {openSections.tecnica ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.tecnica ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2">
                                    <textarea
                                        className="w-full h-[150px] p-3 border rounded-md bg-white focus:ring-2 focus:ring-purple-300 focus:border-purple-400 "
                                        placeholder="Descripción de la técnica utilizada..."
                                        value={formData.techniques}
                                        onChange={(e) => handleChange('techniques', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hallazgos */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('hallazgos')}
                            >
                                <h3 className="text-white font-semibold">Hallazgos</h3>
                                {openSections.hallazgos ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.hallazgos ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2">
                                    <textarea
                                        className="w-full h-[150px] p-3 border rounded-md bg-white focus:ring-2 focus:ring-purple-300 focus:border-purple-400 "
                                        placeholder="Descripción de hallazgos..."
                                        value={formData.findings}
                                        onChange={(e) => handleChange('findings', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Impresiones */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('impresiones')}
                            >
                                <h3 className="text-white font-semibold">Impresiones</h3>
                                {openSections.impresiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.impresiones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2">
                                    <textarea
                                        className="w-full h-[150px] p-3 border rounded-md bg-white focus:ring-2 focus:ring-purple-300 focus:border-purple-400 "
                                        placeholder="Impresiones del estudio..."
                                        value={formData.impressions}
                                        onChange={(e) => handleChange('impressions', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Conclusiones */}
                        <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                            <div
                                className="cursor-pointer bg-brand-purple px-6 py-4 flex justify-between items-center"
                                onClick={() => toggleSection('conclusiones')}
                            >
                                <h3 className="text-white font-semibold">Conclusiones</h3>
                                {openSections.conclusiones ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openSections.conclusiones ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="p-2">
                                    <textarea
                                        className="w-full h-[150px] p-3 border rounded-md bg-white focus:ring-2 focus:ring-purple-300 focus:border-purple-400 "
                                        placeholder="Conclusiones del estudio..."
                                        value={formData.conclusions}
                                        onChange={(e) => handleChange('conclusions', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutSinSidebar>
    )
}
