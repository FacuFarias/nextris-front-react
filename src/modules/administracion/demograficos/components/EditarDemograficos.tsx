import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Examinacion, UpdateDemograficosPayload } from "../types/demograficos.type";
import { DateInput } from "@/components/ui/date-input";

interface EditarDemograficosProps {
    examinacion: Examinacion | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (guid: string, payload: UpdateDemograficosPayload) => void;
    isSaving: boolean;
}

export const EditarDemograficos = ({ examinacion, isOpen, onClose, onSave, isSaving }: EditarDemograficosProps) => {
    const [form, setForm] = useState<UpdateDemograficosPayload>({});

    useEffect(() => {
        if (examinacion) {
            setForm({
                name: examinacion.name,
                surname: examinacion.surname,
                nationalcode: examinacion.nationalcode,
                sexcode: examinacion.sexcode,
                birthdate: examinacion.birthdate,
                localacc: examinacion.localacc,
                admisionnumber: examinacion.admisionnumber,
                status: examinacion.status,
                patientid: examinacion.patientid,
            });
        }
    }, [examinacion]);

    if (!examinacion) return null;

    const handleChange = (field: keyof UpdateDemograficosPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Datos del Estudio"
            description={`Estudio: ${examinacion.study_type} — ${examinacion.localacc}`}
            size="xxl"
        >
            <div className="space-y-6">
                {/* Datos del paciente */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos del Paciente</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="patientid">ID Paciente</Label>
                            <Input
                                id="patientid"
                                value={form.patientid ?? ''}
                                onChange={handleChange('patientid')}
                                placeholder="Ej: NR001"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" value={form.name ?? ''} onChange={handleChange('name')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="surname">Apellido</Label>
                            <Input id="surname" value={form.surname ?? ''} onChange={handleChange('surname')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="nationalcode">DNI</Label>
                            <Input id="nationalcode" value={form.nationalcode ?? ''} onChange={handleChange('nationalcode')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="sexcode">Sexo</Label>
                            <Input id="sexcode" value={form.sexcode ?? ''} onChange={handleChange('sexcode')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="birthdate">Fecha de Nacimiento</Label>
                            <DateInput id="birthdate" value={form.birthdate ?? ''} onChange={(value) => setForm(prev => ({ ...prev, birthdate: value }))} />
                        </div>
                    </div>
                </div>

                {/* Datos del estudio */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos del Estudio</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="localacc">Accession Number</Label>
                            <Input id="localacc" value={form.localacc ?? ''} onChange={handleChange('localacc')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="admisionnumber">Número de Admisión</Label>
                            <Input id="admisionnumber" value={form.admisionnumber ?? ''} onChange={handleChange('admisionnumber')} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="status">Estado</Label>
                            <Input id="status" value={form.status ?? ''} onChange={handleChange('status')} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-400">Tipo de Estudio</Label>
                            <Input value={examinacion.study_type} disabled className="bg-gray-50 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => onSave(examinacion.exam_guid, form)}
                        disabled={isSaving}
                        className="bg-brand-purple hover:bg-brand-purple/90 text-white"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            "Guardar cambios"
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
