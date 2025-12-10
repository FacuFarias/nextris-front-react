import { User, ClipboardList, Monitor } from "lucide-react"
import type { Patient } from "@/modules/pacientes/buscar-paciente/types/BuscarPaciente"
import { useMedicosPorLocacion, useObrasSocialesPorLocacion } from "@/hooks/use-global";

interface PrestacionProps {
    selectedPatient: Patient | null;
    selectedEstudio: any;
    selectedEquipo: any;
    selectedDireccion?: string;
}

export const Prestacion = ({
    selectedPatient,
    selectedEstudio,
    selectedEquipo,
    selectedDireccion,
}: PrestacionProps) => {

    const { data: medicos } = useMedicosPorLocacion(selectedDireccion || "");
    const { data: obrasSociales } = useObrasSocialesPorLocacion(selectedDireccion || "");

    console.log(medicos)
    console.log(obrasSociales)
    return (
        <div className="space-y-6">
            {/* Header Card con resumen */}
            {/* <div className="bg-linear-to-r from-brand-purple to-purple-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <FileCheck className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">Prestación</h2>
                </div>
                <p className="text-purple-100">Revise la información seleccionada antes de continuar</p>
            </div> */}

            {/* Grid con la información */}


            {/* Sección de acciones o formulario adicional */}
            <div className="bg-white rounded-lg border border-purple-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Información Adicional</h3>
                <div className="text-center text-gray-500 py-8">
                    <p>Select de medicos y obras sociales por locacion</p>
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
