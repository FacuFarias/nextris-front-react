import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useEstudiosPorModalidad } from "@/hooks/use-global";
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
    console.log(citaEditada)
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
            {/* Paciente - Solo lectura */}
            <div className="space-y-2">
                <Label htmlFor="patient_name">Paciente</Label>
                <Input
                    id="patient_name"
                    value={citaEditada.patient_name}
                    disabled
                    className="bg-gray-50"
                />
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

            {/* Doctor */}
            <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Input
                    id="doctor"
                    value={citaEditada.doctor}
                    onChange={(e) => setCitaEditada({ ...citaEditada, doctor: e.target.value })}
                />
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
