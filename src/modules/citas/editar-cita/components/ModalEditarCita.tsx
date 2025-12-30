import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useEstudiosPorModalidad, useMedicosAll, useMedicosPorLocacion } from "@/hooks/use-global";
import type { Cita } from "../types/cita.type";

interface ModalEditarCitaContentProps {
    cita: Cita;
    onGuardar: (citaActualizada: Cita) => void;
    onCancelar: () => void;
}

export const ModalEditarCitaContent = ({ cita, onGuardar, onCancelar }: ModalEditarCitaContentProps) => {
    const [citaEditada, setCitaEditada] = useState<Cita>(cita);
    const [busquedaEstudio, setBusquedaEstudio] = useState("");
    const { data: estudiosData } = useEstudiosPorModalidad();
    const { data: doctorsData } = useMedicosAll();
    const { data: medicosPorLocacionData } = useMedicosPorLocacion(cita.location_id);
    // Actualizar citaEditada cuando cambia la cita prop    
    useEffect(() => {
        setCitaEditada(cita);
        setBusquedaEstudio("");
    }, [cita]);

    // Filtrar estudios por búsqueda
    const estudiosFiltrados = useMemo(() => {
        if (!estudiosData) return [];
        if (!busquedaEstudio.trim()) return estudiosData;

        const searchLower = busquedaEstudio.toLowerCase();
        return estudiosData.filter((estudio: any) =>
            estudio.description?.toLowerCase().includes(searchLower) ||
            estudio.externalcode?.toLowerCase().includes(searchLower)
        );
    }, [estudiosData, busquedaEstudio]);

    const handleGuardar = () => {
        onGuardar(citaEditada);
    };
    return (
        <div className="space-y-4">
            {/* Selects de medicos - Grid de 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select de medico referente */}
                <div className="space-y-2">
                    <Label>Médico Referente</Label>
                    <Select
                        value={citaEditada.doctor}
                        onValueChange={(value) => setCitaEditada({ ...citaEditada, doctor: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione un médico" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctorsData && doctorsData.length > 0 ? (
                                doctorsData.map((doctor: any) => (
                                    <SelectItem key={doctor.guid} value={doctor.name}>
                                        {doctor.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-doctors" disabled>
                                    No hay médicos disponibles
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Select de medico solicitante */}
                <div className="space-y-2">
                    <Label>Médico Solicitante</Label>
                    <Select
                        value={citaEditada.doctor_id || ""}
                        onValueChange={(value) => setCitaEditada({ ...citaEditada, doctor_id: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione un médico" />
                        </SelectTrigger>
                        <SelectContent>
                            {medicosPorLocacionData && medicosPorLocacionData.length > 0 ? (
                                medicosPorLocacionData.map((medico: any) => (
                                    <SelectItem key={medico.guid} value={medico.guid}>
                                        {medico.description}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-medicos" disabled>
                                    No hay médicos disponibles
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {/* Examen Actual */}
            <div className="space-y-2">
                <Label>Estudio asignado</Label>
                <Input
                    value={citaEditada.exam}
                    disabled
                    className="bg-gray-50 text-sm font-medium"
                />
            </div>

            {/* Seleccionar nuevo examen */}
            <div className="space-y-2">
                <Label>Seleccionar nuevo examen</Label>

                {/* Buscador */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por código o examen..."
                        value={busquedaEstudio}
                        onChange={(e) => setBusquedaEstudio(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Tabla de estudios */}
                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-brand-purple text-white sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold">CODIGO</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold">EXAMEN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estudiosFiltrados.length > 0 ? (
                                estudiosFiltrados.map((estudio: any, index: number) => (
                                    <tr
                                        key={estudio.guid}
                                        onClick={() => setCitaEditada({ ...citaEditada, exam: estudio.description })}
                                        className={`cursor-pointer hover:bg-brand-purple/20 transition-colors ${citaEditada.exam_id === estudio.guid
                                            ? 'bg-brand-purple/30'
                                            : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-4 py-2 text-sm">{estudio.externalcode}</td>
                                        <td className="px-4 py-2 text-sm">{estudio.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-4 py-8 text-center text-gray-500 text-sm">
                                        {busquedaEstudio ? 'No se encontraron resultados' : 'No hay estudios disponibles'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
                <Button
                    variant="outline"
                    onClick={onCancelar}
                    className="border-2 border-gray-300 hover:bg-gray-100"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleGuardar}
                    className="bg-brand-purple hover:bg-brand-purple/90"
                >
                    Guardar Cambios
                </Button>

            </div>
        </div>
    );
};
