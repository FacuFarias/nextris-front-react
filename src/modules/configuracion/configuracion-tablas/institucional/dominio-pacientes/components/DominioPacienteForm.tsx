import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { DominioPacienteFormData } from "../types/dominio-pacientes.types";

interface DominioPacienteFormProps {
    onSubmit: (data: DominioPacienteFormData) => void;
    onCancel: () => void;
    initialData?: Partial<DominioPacienteFormData> | null;
    isLoading?: boolean;
}

export const DominioPacienteForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: DominioPacienteFormProps) => {
    const [formData, setFormData] = useState<DominioPacienteFormData>({
        description: initialData?.description || "",
        externalcode: initialData?.externalcode || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                description: initialData.description || "",
                externalcode: initialData.externalcode || "",
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="description">Descripcion *</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Dominio de paciente"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="externalcode">Codigo Externo</Label>
                    <Input
                        id="externalcode"
                        value={formData.externalcode}
                        onChange={(e) => setFormData({ ...formData, externalcode: e.target.value })}
                        placeholder="DP-001"
                    />
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <SecondaryButton type="button" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                </PrimaryButton>
            </div>
        </form>
    );
};
