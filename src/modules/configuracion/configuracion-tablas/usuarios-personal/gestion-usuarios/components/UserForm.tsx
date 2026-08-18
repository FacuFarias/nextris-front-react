import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton, SecondaryButton } from "@/components";
import type { PermissionItem, UserFormData, UserMedicalSubmitData } from "../types/users.types";
import { useRoles, useUserLocations, useUserMedicalData } from "../hooks/useUsers";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocations } from "../../../institucional/locations/hooks/useLocations";
import { Loader2, MapPin, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { userService } from "../services/users.service";

const ROLE_PERMISSION_SUGGESTIONS: Record<string, string[]> = {
    sysadmin: [
        "tabs.patients.view",
        "patients.view",
        "patients.manage",
        "tabs.appointments.view",
        "appointments.view",
        "appointments.create",
        "tabs.admissions.view",
        "admissions.view",
        "admissions.admit_appointments",
        "admissions.create_spontaneous",
        "tabs.execution.view",
        "execution.view_pending",
        "execution.execute",
        "tabs.reports.view",
        "reports.view_writing",
        "reports.view_reports",
        "reports.sign",
        "reports.unsign",
        "tabs.images.view",
        "images.view",
        "images.share_link",
        "tabs.distribution.view",
        "distribution.view",
        "distribution.perform",
        "distribution.send_report",
        "distribution.send_report_whatsapp",
        "distribution.update_email",
        "tabs.config.view",
        "users.manage",
        "users.permissions.manage",
        "tabs.gestion.view",
        // "tabs.structured_reports.view", — deshabilitado temporalmente
        // "tabs.nexi.view", — deshabilitado temporalmente
    ],
    tecnico: [
        "tabs.patients.view",
        "patients.view",
        "tabs.execution.view",
        "execution.view_pending",
        "execution.execute",
        "tabs.images.view",
        "images.view",
    ],
    medico: [
        "tabs.patients.view",
        "patients.view",
        "tabs.reports.view",
        "reports.view_writing",
        "reports.view_reports",
        "reports.sign",
        "tabs.images.view",
        "images.view",
        "images.share_link",
        "tabs.distribution.view",
        "distribution.view",
    ],
    administrativo: [
        "tabs.patients.view",
        "patients.view",
        "tabs.appointments.view",
        "appointments.view",
        "appointments.create",
        "tabs.admissions.view",
        "admissions.view",
        "admissions.admit_appointments",
        "admissions.create_spontaneous",
        "tabs.distribution.view",
        "distribution.view",
        "distribution.perform",
    ],
};

const normalizeRoleName = (value?: string) => (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

interface UserFormProps {
    onSubmit: (data: UserFormData, locationIds?: string[], medicalData?: UserMedicalSubmitData, permissionCodes?: string[]) => void;
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
    const [activeRightTab, setActiveRightTab] = useState<"locations" | "permissions">("locations");
    const [permissionCatalog, setPermissionCatalog] = useState<PermissionItem[]>([]);
    const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<Set<string>>(new Set());
    const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const allLocations = Array.isArray(locations?.data) ? locations.data : [];
    const isLoadingUserLocations = isLoadingLocations || isLoadingAssignedLocations;

    const filteredLocations = allLocations.filter((location) =>
        location.name?.toLowerCase().includes(locationSearch.toLowerCase()) ||
        location.description?.toLowerCase().includes(locationSearch.toLowerCase())
    );

    const permissionsByModule = useMemo(() => {
        const map = new Map<string, PermissionItem[]>();

        for (const permission of permissionCatalog) {
            const existing = map.get(permission.module) || [];
            existing.push(permission);
            map.set(permission.module, existing);
        }

        return Array.from(map.entries()).sort(([moduleA], [moduleB]) => moduleA.localeCompare(moduleB));
    }, [permissionCatalog]);

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
        setActiveRightTab("locations");

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
        let isCancelled = false;

        const loadPermissions = async () => {
            setIsPermissionsLoading(true);
            try {
                const [catalogResponse, userPermissionsResponse] = await Promise.all([
                    userService.getPermissionsCatalog(),
                    isEditing && userId ? userService.getUserPermissions(userId) : Promise.resolve(null),
                ]);

                if (isCancelled) {
                    return;
                }

                const catalogData = Array.isArray(catalogResponse?.data) ? catalogResponse.data : [];
                setPermissionCatalog(catalogData);

                const customCodes = Array.isArray(userPermissionsResponse?.data?.custom_permissions)
                    ? userPermissionsResponse.data.custom_permissions
                    : [];

                const validCodes = new Set(catalogData.map((permission) => permission.code));
                const normalizedCustomCodes = customCodes.map((code) =>
                    code === "tabs.preferences.view" ? "tabs.gestion.view" : code
                );
                const filteredCodes = normalizedCustomCodes.filter((code) => validCodes.has(code));

                setSelectedPermissionCodes(new Set(filteredCodes));
            } catch {
                if (!isCancelled) {
                    setPermissionCatalog([]);
                    setSelectedPermissionCodes(new Set());
                }
            } finally {
                if (!isCancelled) {
                    setIsPermissionsLoading(false);
                }
            }
        };

        loadPermissions();

        return () => {
            isCancelled = true;
        };
    }, [isEditing, userId]);

    useEffect(() => {
        setExpandedModules((prev) => {
            const next: Record<string, boolean> = {};
            for (const [moduleName] of permissionsByModule) {
                next[moduleName] = prev[moduleName] ?? true;
            }
            return next;
        });
    }, [permissionsByModule]);

    useEffect(() => {
        if (isEditing) {
            return;
        }

        if (!formData.role_id || permissionCatalog.length === 0 || selectedPermissionCodes.size > 0) {
            return;
        }

        const role = roles?.data?.find((item) => item.guid === formData.role_id);
        const normalizedRole = normalizeRoleName(role?.description);
        const suggestedCodes = ROLE_PERMISSION_SUGGESTIONS[normalizedRole] || [];
        const validCodes = new Set(permissionCatalog.map((permission) => permission.code));
        const filteredSuggestedCodes = suggestedCodes.filter((code) => validCodes.has(code));

        setSelectedPermissionCodes(new Set(filteredSuggestedCodes));
    }, [formData.role_id, isEditing, permissionCatalog, roles?.data, selectedPermissionCodes.size]);

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

        onSubmit(dataToSubmit, Array.from(selectedLocationIds), medicalData, Array.from(selectedPermissionCodes));
    };

    const getSuggestedPermissionsForRole = (roleId: string) => {
        const role = roles?.data?.find((item) => item.guid === roleId);
        const normalizedRole = normalizeRoleName(role?.description);
        const suggestedCodes = ROLE_PERMISSION_SUGGESTIONS[normalizedRole] || [];
        const validCodes = new Set(permissionCatalog.map((permission) => permission.code));
        return suggestedCodes.filter((code) => validCodes.has(code));
    };

    const handleChange = (field: keyof UserFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === "role_id") {
            const suggestedPermissions = getSuggestedPermissionsForRole(String(value));
            setSelectedPermissionCodes(new Set(suggestedPermissions));
        }
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

    const handleTogglePermissionCode = (code: string, checked: boolean) => {
        setSelectedPermissionCodes((prev) => {
            const next = new Set(prev);

            if (checked) {
                next.add(code);
            } else {
                next.delete(code);
            }

            return next;
        });
    };

    const toggleModuleExpanded = (moduleName: string) => {
        setExpandedModules((prev) => ({
            ...prev,
            [moduleName]: !(prev[moduleName] ?? true),
        }));
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
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                placeholder="Ej: jperez@hospital.com"
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
                    <Tabs value={activeRightTab} onValueChange={(value) => setActiveRightTab(value as "locations" | "permissions") }>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
                            <TabsTrigger value="permissions">Permisos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="locations" className="space-y-2 mt-3">
                            <div>
                                <h3 className="text-base font-semibold">Ubicaciones</h3>
                                <p className="text-sm text-muted-foreground">
                                    {isEditing
                                        ? "Seleccione las locations donde el usuario puede operar"
                                        : "Asigne las ubicaciones del usuario"}
                                </p>
                            </div>

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
                                    filteredLocations.map((location) => {
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
                                                    onClick={() => handleLocationCheckedChange(location.guid, !isSelected)}
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
                                    })
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="permissions" className="space-y-2 mt-3">
                            <div>
                                <h3 className="text-base font-semibold">Permisos</h3>
                                <p className="text-sm text-muted-foreground">Defina permisos personalizados del usuario</p>
                            </div>

                            {isPermissionsLoading ? (
                                <div className="flex justify-center items-center h-24">
                                    <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
                                </div>
                            ) : permissionsByModule.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay permisos disponibles.</p>
                            ) : (
                                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                                    {permissionsByModule.map(([moduleName, modulePermissions]) => {
                                        const checkedCount = modulePermissions.reduce(
                                            (count, permission) => count + (selectedPermissionCodes.has(permission.code) ? 1 : 0),
                                            0,
                                        );
                                        const allChecked = modulePermissions.length > 0 && checkedCount === modulePermissions.length;
                                        const someChecked = checkedCount > 0 && checkedCount < modulePermissions.length;
                                        const isExpanded = expandedModules[moduleName] ?? true;
                                        const moduleCheckboxId = `perm-module-${moduleName.replace(/\s+/g, "-").toLowerCase()}`;

                                        return (
                                            <div key={moduleName} className="border rounded-md p-3 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Checkbox
                                                            id={moduleCheckboxId}
                                                            checked={allChecked ? true : someChecked ? "indeterminate" : false}
                                                            onCheckedChange={(checked) => {
                                                                const shouldCheckAll = Boolean(checked);
                                                                modulePermissions.forEach((permission) => {
                                                                    handleTogglePermissionCode(permission.code, shouldCheckAll);
                                                                });
                                                            }}
                                                        />
                                                        <Label htmlFor={moduleCheckboxId} className="cursor-pointer text-sm font-semibold capitalize truncate">
                                                            {moduleName}
                                                        </Label>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="text-xs text-muted-foreground hover:text-foreground"
                                                        onClick={() => toggleModuleExpanded(moduleName)}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        {isExpanded ? "Ocultar" : "Mostrar"}
                                                    </button>
                                                </div>

                                                {isExpanded && (
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {modulePermissions.map((permission) => {
                                                            const isChecked = selectedPermissionCodes.has(permission.code);
                                                            const checkboxId = `perm-${permission.code}`;

                                                            return (
                                                                <div key={permission.code} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/40">
                                                                    <Checkbox
                                                                        id={checkboxId}
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) =>
                                                                            handleTogglePermissionCode(permission.code, Boolean(checked))
                                                                        }
                                                                    />
                                                                    <Label htmlFor={checkboxId} className="cursor-pointer leading-snug">
                                                                        <span className="block text-sm font-medium">{permission.description}</span>
                                                                        <span className="block text-xs text-muted-foreground">{permission.code}</span>
                                                                    </Label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
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
