import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { UserFormData } from "../types/users.types";
import { useRoles } from "../hooks/useUsers";
import { Switch } from "@/components/ui/switch";

interface UserFormProps {
    onSubmit: (data: UserFormData) => void;
    onCancel: () => void;
    initialData?: Partial<UserFormData>;
    isLoading?: boolean;
    isEditing?: boolean;
}

export const UserForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
    isEditing = false,
}: UserFormProps) => {
    const [formData, setFormData] = useState<UserFormData>({
        username: initialData?.username || "",
        password: initialData?.password || "",
        role_id: initialData?.role_id || "",
        name: initialData?.name || "",
        surname: initialData?.surname || "",
        national_number: initialData?.national_number || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        is_active: initialData?.is_active ?? true,
    });

    const { roles } = useRoles();

    useEffect(() => {
        if (initialData) {
            setFormData({
                username: initialData.username || "",
                password: initialData.password || "",
                role_id: initialData.role_id || "",
                name: initialData.name || "",
                surname: initialData.surname || "",
                national_number: initialData.national_number || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                is_active: initialData.is_active ?? true,
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Si estamos editando, no enviamos la contraseña a menos que se haya modificado
        const dataToSubmit = { ...formData };
        if (isEditing && !formData.password) {
            delete dataToSubmit.password;
        }

        onSubmit(dataToSubmit);
    };

    const handleChange = (field: keyof UserFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="username">
                        Usuario <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        placeholder="Ej: jperez"
                        required
                        disabled={isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">
                        Contraseña {!isEditing && <span className="text-red-500">*</span>}
                        {isEditing && <span className="text-xs text-muted-foreground">(dejar vacío para no cambiar)</span>}
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="********"
                        required={!isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">
                        Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Ej: Juan"
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
                        placeholder="Ej: Pérez"
                        required
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="role_id">
                        Rol <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.role_id}
                        onValueChange={(value) => handleChange("role_id", value)}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles?.data?.map((role) => (
                                <SelectItem key={role.guid} value={role.guid}>
                                    {role.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="national_number">DNI/CI</Label>
                    <Input
                        id="national_number"
                        value={formData.national_number}
                        onChange={(e) => handleChange("national_number", e.target.value)}
                        placeholder="Ej: 12345678"
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

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Ej: jperez@hospital.com"
                    />
                </div>

                {isEditing && (
                    <div className="col-span-2 space-y-2">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active" className="text-base">
                                    Estado del Usuario
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {formData.is_active ? 'Usuario activo en el sistema' : 'Usuario inactivo en el sistema'}
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
