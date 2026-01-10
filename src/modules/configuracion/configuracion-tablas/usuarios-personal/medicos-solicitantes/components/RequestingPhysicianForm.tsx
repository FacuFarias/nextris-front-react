import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { RequestingPhysicianFormData } from "../types/requesting-physicians.types";
import { useLocations } from "../../../institucional/locations";

interface RequestingPhysicianFormProps {
    onSubmit: (data: RequestingPhysicianFormData) => void;
    onCancel: () => void;
    initialData?: Partial<RequestingPhysicianFormData>;
    isLoading?: boolean;
}

export const RequestingPhysicianForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: RequestingPhysicianFormProps) => {
    const { locations } = useLocations();

    const [formData, setFormData] = useState<RequestingPhysicianFormData>({
        description: initialData?.description || "",
        phone: initialData?.phone || "",
        mail: initialData?.mail || "",
        note: initialData?.note || "",
        location_id: initialData?.location_id || "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                description: initialData.description || "",
                phone: initialData.phone || "",
                mail: initialData.mail || "",
                note: initialData.note || "",
                location_id: initialData.location_id || "",
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof RequestingPhysicianFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="description">
                        Nombre del Médico <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Ej: Dr. Carlos Ramírez"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Ej: +1234567890"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mail">Email</Label>
                    <Input
                        id="mail"
                        type="email"
                        value={formData.mail}
                        onChange={(e) => handleChange("mail", e.target.value)}
                        placeholder="Ej: cramirez@hospital.com"
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="note">Especialidad/Nota</Label>
                    <Input
                        id="note"
                        value={formData.note}
                        onChange={(e) => handleChange("note", e.target.value)}
                        placeholder="Ej: Cardiología"
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="location_id">Localización</Label>
                    <Select
                        value={formData.location_id}
                        onValueChange={(value) => handleChange("location_id", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione localización" />
                        </SelectTrigger>
                        <SelectContent>
                            {locations?.data?.map((location) => (
                                <SelectItem key={location.guid} value={location.guid}>
                                    {location.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
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
