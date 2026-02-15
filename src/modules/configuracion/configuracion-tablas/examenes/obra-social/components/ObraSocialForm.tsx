import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { ObraSocialFormData } from "../types/obra-social.types";

interface ObraSocialFormProps {
    onSubmit: (data: ObraSocialFormData) => void;
    onCancel: () => void;
    initialData?: Partial<ObraSocialFormData> | null;
    isLoading?: boolean;
}

export const ObraSocialForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: ObraSocialFormProps) => {
    const [formData, setFormData] = useState<ObraSocialFormData
    >({
        description: initialData?.description || "",
        externalcode: initialData?.externalcode || "",
        headerdescription: initialData?.headerdescription || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                description: initialData.description || "",
                externalcode: initialData.externalcode || "",
                headerdescription: initialData.headerdescription || "",
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
                    <Label htmlFor="description">Descripción *</Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Obra Social XYZ"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="externalcode">Código Externo *</Label>
                    <Input
                        id="externalcode"
                        value={formData.externalcode}
                        onChange={(e) => setFormData({ ...formData, externalcode: e.target.value })}
                        placeholder="RX-001"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="headerdescription">Descripción para Encabezados *</Label>
                    <Input
                        id="headerdescription"
                        value={formData.headerdescription}
                        onChange={(e) => setFormData({ ...formData, headerdescription: e.target.value })}
                        placeholder="Obra Social XYZ - Encabezado"
                        required
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
