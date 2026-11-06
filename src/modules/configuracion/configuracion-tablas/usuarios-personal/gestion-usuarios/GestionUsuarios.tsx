import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { UserPermissionsModal } from "./components/UserPermissionsModal";
import type { PermissionItem } from "./types/users.types";
import { useState, useRef } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { getUserColumns, getUserActions } from "./components/columns";
import { useUsers } from "./hooks/useUsers";
import { userService } from "./services/users.service";
import { UserModal } from "./components/UserModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import type { User, UserFormData, UserMedicalSubmitData } from "./types/users.types";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ImpersonationDialog } from "./components/ImpersonationDialog";

export const GestionUsuarios = () => {
    const { authData, refreshPermissions } = useAuth();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const permissionRequest = useRef(0);
    const [permissionUser, setPermissionUser] = useState<User | null>(null);
    const [permissionCatalog, setPermissionCatalog] = useState<PermissionItem[]>([]);
    const [permissionSelection, setPermissionSelection] = useState<Set<string>>(new Set());
    const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
    const [isPermissionsSaving, setIsPermissionsSaving] = useState(false);
    const canManagePermissions = Boolean(authData?.user?.permissions?.some((code) => code === '*' || code === 'users.permissions.manage'));
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [impersonationTarget, setImpersonationTarget] = useState<User | null>(null);
    const canManageUsers = Boolean(
        authData?.user?.permissions?.includes('*') || authData?.user?.permissions?.includes('users.manage'),
    );
    const canImpersonate = Boolean(
        (authData?.user?.permissions?.includes('*') || authData?.user?.permissions?.includes('users.impersonate'))
        && !authData?.user?.impersonation,
    );

    const {
        users,
        isLoading,
        deleteUser,
        resetPassword,
    } = useUsers();

    const handlePaginationChange = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const handleOpenModal = (userData?: User) => {
        setSelectedUser(userData || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleOpenResetPasswordModal = (user: User) => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const handleCloseResetPasswordModal = () => {
        setIsResetPasswordModalOpen(false);
        setSelectedUser(null);
    };

    const getApiErrorMessage = (error: unknown, fallback: string) => {
        const response = axios.isAxiosError<{ message?: string; error?: string }>(error) ? error.response : undefined;
        const backendMessage = response?.data?.message;
        const backendError = response?.data?.error;
        const status = response?.status;

        if (backendMessage && backendError && backendError !== backendMessage) {
            return `${backendMessage}. ${backendError}`;
        }

        if (backendMessage) {
            return backendMessage;
        }

        if (status === 400) {
            return `${fallback}. Verifique campos obligatorios o datos duplicados (usuario/email).`;
        }

        if (status === 404) {
            return `${fallback}. No se encontró un recurso requerido (por ejemplo, rol).`;
        }

        if (status && status >= 500) {
            return `${fallback}. Ocurrió un error interno del servidor.`;
        }

        return fallback;
    };

    const handleSubmit = async (data: UserFormData, locationIds?: string[], medicalData?: UserMedicalSubmitData, permissionCodes?: string[]) => {
        if (isSaving) return;
        setIsSaving(true);
        const payload = permissionCodes === undefined ? data : { ...data, permission_codes: permissionCodes };
        let accountSaved = false;
        try {
            let userId = selectedUser?.guid;
            let message = "Usuario actualizado exitosamente";
            let emailSent = true;
            if (userId) {
                await userService.update(userId, payload);
            } else {
                const response = await userService.create(payload);
                userId = response.data.user_id;
                message = response.message;
                emailSent = response.data.credentials_email_sent !== false;
            }
            accountSaved = true;
            if (userId === authData?.user?.id) await refreshPermissions();
            if (locationIds) await userService.setLocations(userId, locationIds);
            if (medicalData) await userService.saveMedicalData(userId, medicalData);
            if (emailSent) toast.success(message);
            else toast.error(message);
            handleCloseModal();
        } catch (error) {
            toast.error(getApiErrorMessage(error, accountSaved
                ? "Usuario y permisos guardados; no se pudieron completar los datos adicionales"
                : "No se pudo guardar el usuario"));
            // A completed account must never be created again when retrying metadata.
            if (accountSaved) handleCloseModal();
        } finally {
            setIsSaving(false);
            if (accountSaved) await queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    };

    const openPermissions = async (user: User) => {
        const requestId = ++permissionRequest.current;
        setPermissionUser(user);
        setIsPermissionsLoading(true);
        setPermissionSelection(new Set());
        try {
            const [catalog, saved] = await Promise.all([
                userService.getPermissionsCatalog(), userService.getUserPermissions(user.guid),
            ]);
            if (permissionRequest.current !== requestId) return;
            setPermissionCatalog(catalog.data);
            setPermissionSelection(new Set(saved.data.custom_permissions));
        } catch (error) {
            if (permissionRequest.current !== requestId) return;
            toast.error(getApiErrorMessage(error, "No se pudieron cargar los permisos. Reintente desde la acción Permisos."));
            setPermissionUser(null);
        } finally { if (permissionRequest.current === requestId) setIsPermissionsLoading(false); }
    };

    const savePermissions = async () => {
        if (!permissionUser || isPermissionsLoading || isPermissionsSaving) return;
        setIsPermissionsSaving(true);
        try {
            await userService.setUserPermissions(permissionUser.guid, Array.from(permissionSelection));
            if (permissionUser.guid === authData?.user?.id) await refreshPermissions();
            toast.success("Permisos guardados");
            setPermissionUser(null);
            await queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error) { toast.error(getApiErrorMessage(error, "No se pudieron guardar los permisos")); }
        finally { setIsPermissionsSaving(false); }
    };

    const handleResetPassword = (newPassword: string) => {
        if (selectedUser) {
            resetPassword(
                { id: selectedUser.guid, newPassword },
                {
                    onSuccess: () => {
                        toast.success("Contraseña reseteada exitosamente");
                        handleCloseResetPasswordModal();
                    },
                    onError: () => {
                        toast.error("Error al resetear la contraseña");
                    },
                }
            );
        }
    };

    const handleDelete = (user: User) => {
        if (confirm(`¿Está seguro de eliminar al usuario ${user.username}? Esta acción no se puede deshacer.`)) {
            deleteUser(user.guid, {
                onSuccess: () => {
                    toast.success("Usuario eliminado exitosamente");
                },
                onError: () => {
                    toast.error("Error al eliminar el usuario");
                },
            });
        }
    };

    const userColumns = getUserColumns();
    const userActions = getUserActions(
        handleOpenModal,
        handleOpenResetPasswordModal,
        handleDelete,
        canImpersonate ? (user) => {
            if (user.guid !== authData?.user?.id) setImpersonationTarget(user);
        } : undefined,
        authData?.user?.id,
        canManageUsers,
    );
    if (canManagePermissions) userActions.push({
        label: "Permisos", icon: <ShieldCheck className="h-4 w-4 text-purple-700" />,
        onClick: (user) => { void openPermissions(user); },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">Administración de usuarios del sistema</p>
                </div>
                {canManageUsers && canManagePermissions && (
                    <button
                        className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                        onClick={() => handleOpenModal()}
                    >
                        Nuevo Usuario
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className='flex justify-center items-center h-40'>
                    <span className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500'></span>
                </div>
            ) : (
                <TablaDynamic
                    data={Array.isArray(users?.data) ? users.data : []}
                    columns={userColumns}
                    showIndex
                    actions={userActions}
                    pagination={{
                        page,
                        pageSize,
                        serverSide: false,
                        total: Array.isArray(users?.data) ? users.data.length : 0,
                    }}
                    onPaginationChange={handlePaginationChange}
                />
            )}

            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                userId={selectedUser?.guid}
                initialData={selectedUser ? {
                    username: selectedUser.username,
                    role_id: selectedUser.role_id,
                    name: selectedUser.name,
                    surname: selectedUser.surname,
                    national_number: selectedUser.national_number || undefined,
                    email: selectedUser.email || undefined,
                    phone: selectedUser.phone || undefined,
                    is_active: selectedUser.is_active,
                } : undefined}
                isLoading={isSaving}
            />

            <ResetPasswordModal
                isOpen={isResetPasswordModalOpen}
                onClose={handleCloseResetPasswordModal}
                onSubmit={handleResetPassword}
                userName={selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : ""}
                isLoading={false}
            />

            <UserPermissionsModal
                isOpen={Boolean(permissionUser)} onClose={() => { if (!isPermissionsSaving) { permissionRequest.current++; setPermissionUser(null); } }}
                user={permissionUser} catalog={permissionCatalog} selectedCodes={permissionSelection}
                isLoading={isPermissionsLoading} isSaving={isPermissionsSaving}
                onToggleCode={(code, checked) => setPermissionSelection((previous) => {
                    const next = new Set(previous);
                    if (checked) next.add(code); else next.delete(code);
                    return next;
                })}
                onSave={() => { void savePermissions(); }}
            />

            <ImpersonationDialog target={impersonationTarget} onClose={() => setImpersonationTarget(null)} />

        </div>
    )
}
