import { User, ClipboardList, Monitor } from "lucide-react"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente"
import { useMedicosPorLocacion, useObrasSocialesPorLocacion } from "@/hooks/use-global";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useCrearOrdenParaPaciente } from "../hooks/use-paciente-direccion";
import { toast } from "sonner";

interface PrestacionProps {
    selectedPatient: Patient | null;
    selectedEstudio: any;
    selectedEquipo: any;
    selectedDireccion?: string;
    onResetForm?: () => void;
}

export const Prestacion = ({
    selectedPatient,
    selectedEstudio,
    selectedEquipo,
    selectedDireccion,
    onResetForm,
}: PrestacionProps) => {

    const [selectedMedico, setSelectedMedico] = useState<string>("");
    const [selectedObrasSociales, setSelectedObrasSociales] = useState<string>("");
    const [selectedPrioridad, setSelectedPrioridad] = useState<string>("");
    const { data: medicos } = useMedicosPorLocacion(selectedDireccion || "");
    const { data: obrasSociales } = useObrasSocialesPorLocacion(selectedDireccion || "");
    const mutationCrearOrden = useCrearOrdenParaPaciente(() => {
        // Resetear formulario local
        setSelectedMedico("");
        setSelectedObrasSociales("");
        setSelectedPrioridad("");
        // Llamar callback del padre para resetear todo
        onResetForm?.();
    });

    const handleSubmit = () => {

        if (!selectedMedico || !selectedObrasSociales) {
            toast.error("Por favor, complete todos los campos obligatorios.", {
                position: "top-right",
            });
            return;
        }
        mutationCrearOrden.mutate({
            patient_id: selectedPatient?.guid,
            location_id: selectedDireccion,
            exam: {
                study_type_id: selectedEstudio?.guid,
                equipment_id: selectedEquipo?.guid,
                physician_id: selectedMedico || undefined,
                insurance_id: selectedObrasSociales || undefined,
                severity: selectedPrioridad || "normal",
            }
        });
    }
    return (
        <div className="space-y-6">
            {/* Sección de acciones o formulario adicional */}
            <div className="bg-white rounded-lg border border-purple-100 shadow-sm p-6">
                <div className="w-full flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 ">Información Adicional</h3>

                    <div className="">
                        <PrimaryButton onClick={handleSubmit} >
                            Crear orden
                        </PrimaryButton>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="w-full flex gap-3">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Médico Solicitante
                            </label>
                            <Select
                                onValueChange={setSelectedMedico}
                                value={selectedMedico}
                                required={true}
                            >
                                <SelectTrigger className="w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                                    <SelectValue placeholder="Seleccione un médico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {medicos?.map((medico: any) => (
                                        <SelectItem key={medico.guid} value={medico.guid}>
                                            {medico.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Obras Sociales Solicitante
                            </label>
                            <Select
                                onValueChange={setSelectedObrasSociales}
                                value={selectedObrasSociales}
                            >
                                <SelectTrigger className="w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                                    <SelectValue placeholder="Seleccione una obra social" />
                                </SelectTrigger>
                                <SelectContent>
                                    {obrasSociales?.map((obraSocial: any) => (
                                        <SelectItem key={obraSocial.guid} value={obraSocial.guid}>
                                            {obraSocial.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prioridad
                        </label>
                        <Select
                            onValueChange={setSelectedPrioridad}
                            value={selectedPrioridad}
                        >
                            <SelectTrigger className="w-full border-purple-300 focus:border-purple-500 focus:ring-purple-500">
                                <SelectValue placeholder="Seleccione la prioridad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Card Paciente */}
                <div className="bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className="bg-brand-purple p-4 flex items-center gap-2 rounded-t-lg">
                        <User className="w-5 h-5 text-white" />
                        <h3 className="font-semibold text-white uppercase text-sm tracking-wider">Paciente</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</p>
                            <p className="text-sm text-gray-800 font-medium">
                                {selectedPatient?.name} {selectedPatient?.surname}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">DNI</p>
                            <p className="text-sm text-gray-800">{selectedPatient?.nationalcode}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha de Nacimiento</p>
                            <p className="text-sm text-gray-800">{selectedPatient?.birthdate}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Género</p>
                            <p className="text-sm text-gray-800">{selectedPatient?.gender}</p>
                        </div>
                    </div>
                </div>

                {/* Card Estudio */}
                <div className="bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className="bg-brand-purple p-4 flex items-center gap-2 rounded-t-lg">
                        <ClipboardList className="w-5 h-5 text-white" />
                        <h3 className="font-semibold text-white uppercase text-sm tracking-wider">Estudio</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Código</p>
                            <p className="text-sm text-gray-800 font-medium">{selectedEstudio?.externalcode}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descripción</p>
                            <p className="text-sm text-gray-800">{selectedEstudio?.description}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Modalidad</p>
                            <p className="text-sm text-gray-800">{selectedEstudio?.modality}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Parte del Cuerpo</p>
                            <p className="text-sm text-gray-800">{selectedEstudio?.bodypart}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grupo de Estudio</p>
                            <p className="text-sm text-gray-800">{selectedEstudio?.studygroup}</p>
                        </div>
                    </div>
                </div>

                {/* Card Equipo */}
                <div className="bg-white rounded-lg border border-purple-100 shadow-sm">
                    <div className="bg-brand-purple p-4 flex items-center gap-2 rounded-t-lg">
                        <Monitor className="w-5 h-5 text-white" />
                        <h3 className="font-semibold text-white uppercase text-sm tracking-wider">Equipo</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nombre</p>
                            <p className="text-sm text-gray-800 font-medium">
                                {selectedEquipo?.description || selectedEquipo?.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Modalidad</p>
                            <p className="text-sm text-gray-800">{selectedEquipo?.modality}</p>
                        </div>
                    </div>
                </div>
            </div>



        </div>
    )
}
