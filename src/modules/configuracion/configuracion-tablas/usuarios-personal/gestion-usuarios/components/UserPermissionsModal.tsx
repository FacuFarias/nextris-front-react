import { useEffect, useMemo, useState } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { PermissionItem, User } from "../types/users.types";

interface UserPermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    catalog: PermissionItem[];
    selectedCodes: Set<string>;
    isLoading: boolean;
    isSaving: boolean;
    onToggleCode: (code: string, checked: boolean) => void;
    onSave: () => void;
}

export const UserPermissionsModal = ({
    isOpen,
    onClose,
    user,
    catalog,
    selectedCodes,
    isLoading,
    isSaving,
    onToggleCode,
    onSave,
}: UserPermissionsModalProps) => {
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    const permissionsByModule = useMemo(() => {
        const map = new Map<string, PermissionItem[]>();

        for (const permission of catalog) {
            const existing = map.get(permission.module) || [];
            existing.push(permission);
            map.set(permission.module, existing);
        }

        return Array.from(map.entries()).sort(([moduleA], [moduleB]) => moduleA.localeCompare(moduleB));
    }, [catalog]);

    useEffect(() => {
        setExpandedModules((prev) => {
            const next: Record<string, boolean> = {};
            for (const [moduleName] of permissionsByModule) {
                next[moduleName] = prev[moduleName] ?? true;
            }
            return next;
        });
    }, [permissionsByModule]);

    const toggleModuleExpanded = (moduleName: string) => {
        setExpandedModules((prev) => ({
            ...prev,
            [moduleName]: !(prev[moduleName] ?? true),
        }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Permisos de ${user?.username || "usuario"}`}
            size="xxl"
            className="sm:max-w-[56rem]"
        >
            {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Cargando permisos...</div>
            ) : (
                <div className="space-y-4">
                    {permissionsByModule.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay permisos disponibles.</p>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                            {permissionsByModule.map(([moduleName, modulePermissions]) => {
                                const checkedCount = modulePermissions.reduce(
                                    (count, permission) => count + (selectedCodes.has(permission.code) ? 1 : 0),
                                    0,
                                );
                                const allChecked = modulePermissions.length > 0 && checkedCount === modulePermissions.length;
                                const someChecked = checkedCount > 0 && checkedCount < modulePermissions.length;
                                const isExpanded = expandedModules[moduleName] ?? true;
                                const moduleCheckboxId = `perm-module-${moduleName.replace(/\s+/g, "-").toLowerCase()}`;

                                return (
                                    <div key={moduleName} className="border rounded-md p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Checkbox
                                                    id={moduleCheckboxId}
                                                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                                                    onCheckedChange={(checked) => {
                                                        const shouldCheckAll = Boolean(checked);
                                                        modulePermissions.forEach((permission) => {
                                                            onToggleCode(permission.code, shouldCheckAll);
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {modulePermissions.map((permission) => {
                                                    const isChecked = selectedCodes.has(permission.code);
                                                    const checkboxId = `perm-${permission.code}`;

                                                    return (
                                                        <div key={permission.code} className="flex items-start gap-2 rounded-md p-2 hover:bg-muted/40">
                                                            <Checkbox
                                                                id={checkboxId}
                                                                checked={isChecked}
                                                                onCheckedChange={(checked) => onToggleCode(permission.code, Boolean(checked))}
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

                    <div className="flex gap-2 justify-end pt-2 border-t">
                        <SecondaryButton type="button" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="button" onClick={onSave} disabled={isSaving || isLoading}>
                            {isSaving ? "Guardando..." : "Guardar permisos"}
                        </PrimaryButton>
                    </div>
                </div>
            )}
        </Modal>
    );
};
