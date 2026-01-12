import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";

interface ModalidadFormProps {
    onSubmit: (data: { description: string, externalcode: string }) => void;
    onCancel: () => void;
    initialData?: { description: string, externalcode: string };
    isLoading?: boolean;
}

export const ModalidadForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: ModalidadFormProps) => {
    const [description, setDescription] = useState(initialData?.description || "");
    const [codigo, setCodigo] = useState(initialData?.externalcode || "");

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.description);
            setCodigo(initialData.externalcode);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ description, externalcode: codigo });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ingrese la descripción de la modalidad"
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="externalcode">Código</Label>
                <Input
                    id="externalcode"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ingrese el código de la modalidad"
                    required
                />
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
