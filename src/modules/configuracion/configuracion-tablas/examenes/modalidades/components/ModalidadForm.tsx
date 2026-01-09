import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";

interface ModalidadFormProps {
    onSubmit: (data: { description: string }) => void;
    onCancel: () => void;
    initialData?: { description: string };
    isLoading?: boolean;
}

export const ModalidadForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: ModalidadFormProps) => {
    const [description, setDescription] = useState(initialData?.description || "");

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.description);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ description });
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
