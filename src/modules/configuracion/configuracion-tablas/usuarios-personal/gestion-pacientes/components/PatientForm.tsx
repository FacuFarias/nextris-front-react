import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { PatientFormData } from "../types/patients.types";
import { Switch } from "@/components/ui/switch";

interface PatientFormProps {
    onSubmit: (data: PatientFormData) => void;
    onCancel: () => void;
    initialData?: Partial<PatientFormData>;
    isLoading?: boolean;
    isEditing?: boolean;
}

export const PatientForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
    isEditing = false,
}: PatientFormProps) => {
    const [formData, setFormData] = useState<PatientFormData>({
        name: initialData?.name || "",
        surname: initialData?.surname || "",
        national_number: initialData?.national_number || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        birth_date: initialData?.birth_date || "",
        gender: initialData?.gender || undefined,
        address: initialData?.address || "",
        is_active: initialData?.is_active ?? true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                surname: initialData.surname || "",
                national_number: initialData.national_number || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                birth_date: initialData.birth_date || "",
                gender: initialData.gender || undefined,
                address: initialData.address || "",
                is_active: initialData.is_active ?? true,
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof PatientFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Ej: Ana"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="surname">
                        Apellido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="surname"
                        value={formData.surname}
                        onChange={(e) => handleChange("surname", e.target.value)}
                        placeholder="Ej: Gómez"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="national_number">DNI/CI</Label>
                    <Input
                        id="national_number"
                        value={formData.national_number}
                        onChange={(e) => handleChange("national_number", e.target.value)}
                        placeholder="Ej: 87654321"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Ej: +0987654321"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Ej: agomez@email.com"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                    <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date}
                        onChange={(e) => handleChange("birth_date", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gender">Género</Label>
                    <Select
                        value={formData.gender}
                        onValueChange={(value) => handleChange("gender", value as 'M' | 'F' | 'O')}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione género" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Femenino</SelectItem>
                            <SelectItem value="O">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="Ej: Calle 456"
                    />
                </div>

                {isEditing && (
                    <div className="col-span-2 space-y-2">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active" className="text-base">
                                    Estado del Paciente
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {formData.is_active ? 'Paciente activo en el sistema' : 'Paciente inactivo en el sistema'}
                                </p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked: boolean) => handleChange("is_active", checked)}
                            />
                        </div>
                    </div>
                )}
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
