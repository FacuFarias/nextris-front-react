import { User, ClipboardList, Monitor } from "lucide-react"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente"
import { useMedicosPorLocacion, useObrasSocialesPorLocacion, useRadsPorLocacion } from "@/hooks/use-global";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useCrearOrdenParaPaciente } from "../hooks/use-paciente-direccion";


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

    const [selectedMedicoSolicitante, setSelectedMedicoSolicitante] = useState<string>("");
    const [selectedMedicoReferente, setSelectedMedicoReferente] = useState<string>("");
    const [selectedObrasSociales, setSelectedObrasSociales] = useState<string>("");
    const [selectedPrioridad, setSelectedPrioridad] = useState<string>("");
    const { data: medicosSolicitantes } = useMedicosPorLocacion(selectedDireccion || "");
    const { data: medicosReferentes } = useRadsPorLocacion(selectedDireccion || "");
    const { data: obrasSociales } = useObrasSocialesPorLocacion(selectedDireccion || "");
    const mutationCrearOrden = useCrearOrdenParaPaciente(() => {
        // Resetear formulario local
        setSelectedMedicoSolicitante("");
        setSelectedMedicoReferente("");
        setSelectedObrasSociales("");
        setSelectedPrioridad("");
        // Llamar callback del padre para resetear todo
        onResetForm?.();
    });

    const handleSubmit = () => {
        const isUnassignedEquipment = selectedEquipo?.guid === "UNASSIGNED" || Boolean(selectedEquipo?.isUnassigned);
        mutationCrearOrden.mutate({
            patient_id: selectedPatient?.guid,
            location_id: selectedDireccion,
            exam: {
                study_type_id: selectedEstudio?.guid,
                equipment_id: isUnassignedEquipment ? undefined : selectedEquipo?.guid,
                unassigned_equipment: isUnassignedEquipment,
                physician_id: selectedMedicoSolicitante || undefined,
                referring_physician_id: selectedMedicoReferente || undefined,
                insurance_id: selectedObrasSociales || undefined,
                severity: selectedPrioridad || "normal",
            }
        });
    }
    return (
        <div className="space-y-6 pb-4">
            {/* Sección de acciones o formulario adicional */}
            <div className="bg-transparent rounded-lg border border-purple-200/60 dark:border-purple-500/30 shadow-sm p-6">
                <div className="w-full flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Información Adicional</h3>

                    <div className="">
                        <PrimaryButton onClick={handleSubmit} >
                            Crear orden
                        </PrimaryButton>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-blue-700 mb-2 dark:text-blue-300">
                                Médico Solicitante
                            </label>
                            <Select
                                onValueChange={setSelectedMedicoSolicitante}
                                value={selectedMedicoSolicitante}
                                required={true}
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-[#0f1628] border-2 border-blue-200 dark:border-blue-500/40 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60 dark:focus:ring-blue-500/30">
                                    <SelectValue placeholder="Seleccione un médico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {medicosSolicitantes?.map((medico: any) => (
                                        <SelectItem key={medico.guid} value={medico.guid}>
                                            {medico.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full">
                            <label className="block text-sm font-medium text-blue-700 mb-2 dark:text-blue-300">
                                Médico Referente (Radiólogo)
                            </label>
                            <Select
                                onValueChange={setSelectedMedicoReferente}
                                value={selectedMedicoReferente}
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-[#0f1628] border-2 border-blue-200 dark:border-blue-500/40 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60 dark:focus:ring-blue-500/30">
                                    <SelectValue placeholder="Seleccione un radiólogo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {medicosReferentes?.map((medico: any) => (
                                        <SelectItem key={medico.guid} value={medico.guid}>
                                            {medico.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full">
                            <label className="block text-sm font-medium text-blue-700 mb-2 dark:text-blue-300">
                                Obras Sociales Solicitante
                            </label>
                            <Select
                                onValueChange={setSelectedObrasSociales}
                                value={selectedObrasSociales}
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-[#0f1628] border-2 border-blue-200 dark:border-blue-500/40 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60 dark:focus:ring-blue-500/30">
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

                        <div className="w-full">
                            <label className="block text-sm font-medium text-blue-700 mb-2 dark:text-blue-300">
                                Prioridad
                            </label>
                            <Select
                                onValueChange={setSelectedPrioridad}
                                value={selectedPrioridad}
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-[#0f1628] border-2 border-blue-200 dark:border-blue-500/40 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60 dark:focus:ring-blue-500/30">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 pb-2">
                    {/* Card Paciente */}
                    <div className="bg-transparent rounded-lg border border-purple-200/60 dark:border-purple-500/30 shadow-sm">
                        <div className="bg-brand-purple p-4 flex items-center gap-2 rounded-t-lg">
                            <User className="w-5 h-5 text-white" />
                            <h3 className="font-semibold text-white uppercase text-sm tracking-wider">Paciente</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre Completo</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                                    {selectedPatient?.name} {selectedPatient?.surname}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">DNI</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedPatient?.nationalcode}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Fecha de Nacimiento</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedPatient?.birthdate}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Género</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedPatient?.gender}</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Estudio */}
                    <div className="bg-transparent rounded-lg border border-purple-200/60 dark:border-purple-500/30 shadow-sm">
                        <div className="bg-brand-purple p-4 flex items-center gap-2 rounded-t-lg">
                            <ClipboardList className="w-5 h-5 text-white" />
                            <h3 className="font-semibold text-white uppercase text-sm tracking-wider">Estudio</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Código</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{selectedEstudio?.externalcode}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Descripción</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedEstudio?.description}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Modalidad</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedEstudio?.modality}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Parte del Cuerpo</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedEstudio?.bodypart}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Grupo de Estudio</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedEstudio?.studygroup}</p>
                            </div>
                        </div>
                    </div>

                    {/* Card Equipo */}
                    <div className="bg-transparent rounded-lg border border-purple-200/60 dark:border-purple-500/30 shadow-sm">
                        <div className="bg-brand-purple p-4 flex items-center gap-2 rounded-t-lg">
                            <Monitor className="w-5 h-5 text-white" />
                            <h3 className="font-semibold text-white uppercase text-sm tracking-wider">Equipo</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                                    {selectedEquipo?.description || selectedEquipo?.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-1">Modalidad</p>
                                <p className="text-sm text-gray-800 dark:text-gray-100">{selectedEquipo?.modality}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



        </div>
    )
}
