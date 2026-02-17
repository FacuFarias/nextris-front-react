import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { UserFormData, UserMedicalSubmitData } from "../types/users.types";
import { useRoles, useUserLocations, useUserMedicalData } from "../hooks/useUsers";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocations } from "../../../institucional/locations/hooks/useLocations";
import { Loader2, MapPin, Search } from "lucide-react";

interface UserFormProps {
    onSubmit: (data: UserFormData, locationIds?: string[], medicalData?: UserMedicalSubmitData) => void;
    onCancel: () => void;
    initialData?: Partial<UserFormData>;
    userId?: string;
    isLoading?: boolean;
    isEditing?: boolean;
}

export const UserForm = ({
    onSubmit,
    onCancel,
    initialData,
    userId,
    isLoading = false,
    isEditing = false,
}: UserFormProps) => {
    const emptyFormData: UserFormData = {
        username: "",
        role_id: "",
        name: "",
        surname: "",
        national_number: "",
        email: "",
        phone: "",
        is_active: true,
    };

    const [formData, setFormData] = useState<UserFormData>({
        username: initialData?.username || "",
        role_id: initialData?.role_id || "",
        name: initialData?.name || "",
        surname: initialData?.surname || "",
        national_number: initialData?.national_number || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        is_active: initialData?.is_active ?? true,
    });

    const { roles } = useRoles();
    const { locations, isLoading: isLoadingLocations } = useLocations();
    const { assignedLocations, isLoading: isLoadingAssignedLocations } = useUserLocations(isEditing ? userId || null : null);
    const { medicalData: fetchedMedicalData, isLoading: isLoadingMedicalData } = useUserMedicalData(isEditing ? userId || null : null);
    const [locationSearch, setLocationSearch] = useState("");
    const [selectedLocationIds, setSelectedLocationIds] = useState<Set<string>>(new Set());
    const [medicalFormData, setMedicalFormData] = useState({
        matricula_nacional: "",
        aclaracion_firma: "",
        firma_digital: undefined as File | undefined,
    });

    const allLocations = Array.isArray(locations?.data) ? locations.data : [];
    const isLoadingUserLocations = isLoadingLocations || isLoadingAssignedLocations;

    const filteredLocations = allLocations.filter((location) =>
        location.name?.toLowerCase().includes(locationSearch.toLowerCase()) ||
        location.description?.toLowerCase().includes(locationSearch.toLowerCase())
    );

    const selectedRole = roles?.data?.find((role) => role.guid === formData.role_id);
    const normalizedRoleDescription = (selectedRole?.description || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    const isMedicalRole = normalizedRoleDescription === "medico";

    useEffect(() => {
        setFormData((prev) => {
            const next = initialData
                ? {
                    username: initialData.username || "",
                    role_id: initialData.role_id || "",
                    name: initialData.name || "",
                    surname: initialData.surname || "",
                    national_number: initialData.national_number || "",
                    email: initialData.email || "",
                    phone: initialData.phone || "",
                    is_active: initialData.is_active ?? true,
                }
                : emptyFormData;

            if (
                prev.username === next.username &&
                prev.role_id === next.role_id &&
                prev.name === next.name &&
                prev.surname === next.surname &&
                prev.national_number === next.national_number &&
                prev.email === next.email &&
                prev.phone === next.phone &&
                prev.is_active === next.is_active
            ) {
                return prev;
            }

            return next;
        });
    }, [initialData]);

    useEffect(() => {
        if (assignedLocations?.data) {
            const nextIds = new Set(assignedLocations.data.map((location) => location.location_id));

            setSelectedLocationIds((prev) => {
                if (prev.size === nextIds.size) {
                    let hasDiff = false;
                    for (const id of nextIds) {
                        if (!prev.has(id)) {
                            hasDiff = true;
                            break;
                        }
                    }
                    if (!hasDiff) {
                        return prev;
                    }
                }

                return nextIds;
            });
        }
    }, [assignedLocations]);

    useEffect(() => {
        setLocationSearch("");

        if (!isEditing) {
            setSelectedLocationIds(new Set());
            setMedicalFormData({
                matricula_nacional: "",
                aclaracion_firma: "",
                firma_digital: undefined,
            });
        }
    }, [isEditing, userId]);

    useEffect(() => {
        if (fetchedMedicalData?.data) {
            setMedicalFormData((prev) => {
                const nextMatricula = fetchedMedicalData.data.matricula_nacional || "";
                const nextAclaracion = fetchedMedicalData.data.aclaracion_firma || "";

                if (
                    prev.matricula_nacional === nextMatricula &&
                    prev.aclaracion_firma === nextAclaracion
                ) {
                    return prev;
                }

                return {
                    ...prev,
                    matricula_nacional: nextMatricula,
                    aclaracion_firma: nextAclaracion,
                };
            });
        }
    }, [fetchedMedicalData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const dataToSubmit = { ...formData };

        const medicalData = isMedicalRole
            ? {
                matricula_nacional: medicalFormData.matricula_nacional,
                aclaracion_firma: medicalFormData.aclaracion_firma,
                firma_digital: medicalFormData.firma_digital,
            }
            : undefined;

        onSubmit(dataToSubmit, Array.from(selectedLocationIds), medicalData);
    };

    const handleChange = (field: keyof UserFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationCheckedChange = (locationId: string, checked: boolean) => {
        setSelectedLocationIds((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(locationId);
            } else {
                next.delete(locationId);
            }
            return next;
        });
    };

    const handleSelectAllLocations = (checked: boolean) => {
        if (checked) {
            setSelectedLocationIds(new Set(allLocations.map((location) => location.guid)));
            return;
        }

        setSelectedLocationIds(new Set());
    };

    const handleMedicalChange = (field: "matricula_nacional" | "aclaracion_firma", value: string) => {
        setMedicalFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-2 border rounded-lg p-2.5">
                    <div>
                        <h3 className="text-base font-semibold">Datos del usuario</h3>
                        <p className="text-sm text-muted-foreground">Información principal</p>
                    </div>

                    {isEditing && (
                        <div className="flex items-center justify-between border rounded-md px-3 py-2">
                            <Label htmlFor="is_active" className="text-sm font-medium">Activo</Label>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked: boolean) => handleChange("is_active", checked)}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1.5">
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

                        {!isEditing && (
                            <div className="sm:col-span-1 flex items-end">
                                <p className="text-xs text-muted-foreground leading-tight">
                                    La contraseña se genera automáticamente y se envía al email ingresado.
                                </p>
                            </div>
                        )}

                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
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

                        <div className="sm:col-span-2 space-y-1.5">
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

                        <div className="space-y-1.5">
                            <Label htmlFor="national_number">DNI/CI</Label>
                            <Input
                                id="national_number"
                                value={formData.national_number}
                                onChange={(e) => handleChange("national_number", e.target.value)}
                                placeholder="Ej: 12345678"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                placeholder="Ej: +1234567890"
                            />
                        </div>

                        <div className="sm:col-span-2 space-y-1.5">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="Ej: jperez@hospital.com"
                                required
                            />
                        </div>
                    </div>

                    {isMedicalRole && (
                        <div className="space-y-1.5 border rounded-lg p-2">
                            <div>
                                <h4 className="text-sm font-semibold">Datos médicos</h4>
                                <p className="text-xs text-muted-foreground">
                                    Complete matrícula, aclaración y firma digital
                                </p>
                            </div>

                            {isLoadingMedicalData && isEditing ? (
                                <div className="flex justify-center items-center h-20">
                                    <Loader2 className="h-5 w-5 animate-spin text-brand-purple" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="matricula_nacional">
                                            Matrícula <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="matricula_nacional"
                                            value={medicalFormData.matricula_nacional}
                                            onChange={(e) => handleMedicalChange("matricula_nacional", e.target.value)}
                                            placeholder="Ej: MN12345"
                                            required={isMedicalRole}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="aclaracion_firma">
                                            Aclaración de firma <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="aclaracion_firma"
                                            value={medicalFormData.aclaracion_firma}
                                            onChange={(e) => handleMedicalChange("aclaracion_firma", e.target.value)}
                                            placeholder="Ej: Dr. Juan Pérez"
                                            required={isMedicalRole}
                                        />
                                    </div>

                                    <div className="sm:col-span-2 space-y-1.5">
                                        <Label htmlFor="firma_digital">Imagen de firma</Label>
                                        <Input
                                            id="firma_digital"
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                setMedicalFormData((prev) => ({
                                                    ...prev,
                                                    firma_digital: file,
                                                }));
                                            }}
                                        />
                                        {fetchedMedicalData?.data?.firma_digital && !medicalFormData.firma_digital && (
                                            <p className="text-xs text-muted-foreground">
                                                Firma actual: {fetchedMedicalData.data.firma_digital}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 border rounded-lg p-2.5">
                    <div>
                        <h3 className="text-base font-semibold">Ubicaciones</h3>
                        <p className="text-sm text-muted-foreground">
                            {isEditing
                                ? "Seleccione las locations donde el usuario puede operar"
                                : "Las ubicaciones se asignan al editar el usuario"}
                        </p>
                    </div>

                    <>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar ubicación..."
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {!isLoadingUserLocations && allLocations.length > 0 && (
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Checkbox
                                    id="select-all-user-locations"
                                    checked={selectedLocationIds.size === allLocations.length}
                                    onCheckedChange={(checked) => handleSelectAllLocations(Boolean(checked))}
                                />
                                <Label htmlFor="select-all-user-locations" className="text-sm font-medium cursor-pointer">
                                    Seleccionar todas ({selectedLocationIds.size}/{allLocations.length})
                                </Label>
                            </div>
                        )}

                        <div className="max-h-[290px] overflow-y-auto overflow-x-hidden space-y-0.5 pr-1">
                            {isLoadingUserLocations ? (
                                <div className="flex justify-center items-center h-20">
                                    <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                                </div>
                            ) : filteredLocations.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    {locationSearch ? "No se encontraron ubicaciones" : "No hay ubicaciones disponibles"}
                                </p>
                            ) : (
                                filteredLocations.map((location) => (
                                    (() => {
                                        const isSelected = selectedLocationIds.has(location.guid);

                                        return (
                                    <div
                                        key={location.guid}
                                        className={`flex w-full items-center gap-3 p-2 rounded-md border transition-colors duration-200 ease-out ${
                                            isSelected
                                                ? "bg-brand-purple/5 border-brand-purple/40"
                                                : "border-transparent hover:bg-gray-50"
                                        }`}
                                    >
                                        <Checkbox
                                            id={`location-${location.guid}`}
                                            checked={isSelected}
                                            onCheckedChange={(checked) =>
                                                handleLocationCheckedChange(location.guid, Boolean(checked))
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-3 min-w-0 flex-1 text-left"
                                            onClick={() =>
                                                handleLocationCheckedChange(
                                                    location.guid,
                                                    !isSelected
                                                )
                                            }
                                        >
                                            <MapPin
                                                className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                                                    isSelected ? "text-brand-purple" : "text-gray-400"
                                                }`}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{location.name}</p>
                                                {location.address && (
                                                    <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                        );
                                    })()
                                ))
                            )}
                        </div>
                    </>
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
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
