import { useState } from "react";
import TablaDynamic from "@/components/TableDynamic";
import { getUserColumns, getUserActions } from "./components/columns";
import { useUsers } from "./hooks/useUsers";
import { UserModal } from "./components/UserModal";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import type { User, UserFormData, UserMedicalSubmitData } from "./types/users.types";
import { toast } from "sonner";

export const GestionUsuarios = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const {
        users,
        isLoading,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        setUserLocations,
        saveUserMedicalData,
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
    const handleSubmit = (data: UserFormData, locationIds?: string[], medicalData?: UserMedicalSubmitData) => {
        if (selectedUser) {
            // Actualizar
            updateUser(
                { id: selectedUser.guid, data },
                {
                    onSuccess: () => {
                        const saveMedicalIfNeeded = () => {
                            if (!medicalData) {
                                toast.success("Usuario actualizado exitosamente");
                                handleCloseModal();
                                return;
                            }

                            saveUserMedicalData(
                                { userId: selectedUser.guid, medicalData },
                                {
                                    onSuccess: () => {
                                        toast.success("Usuario actualizado exitosamente");
                                        handleCloseModal();
                                    },
                                    onError: (error: any) => {
                                        const message = error?.response?.data?.message || "Error al guardar los datos médicos";
                                        toast.error(message);
                                    },
                                }
                            );
                        };

                        if (locationIds) {
                            setUserLocations(
                                { userId: selectedUser.guid, locationIds },
                                {
                                    onSuccess: () => {
                                        saveMedicalIfNeeded();
                                    },
                                    onError: (error: any) => {
                                        const message = error?.response?.data?.message || "Error al actualizar las ubicaciones del usuario";
                                        const missingIds = error?.response?.data?.missing_location_ids;

                                        if (Array.isArray(missingIds) && missingIds.length > 0) {
                                            toast.error(`${message}: ${missingIds.join(", ")}`);
                                            return;
                                        }

                                        toast.error(message);
                                    },
                                }
                            );
                            return;
                        }

                        saveMedicalIfNeeded();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el usuario");
                    },
                }
            );
        } else {
            // Crear
            createUser(data, {
                onSuccess: (response: any) => {
                    const createdUserId = response?.data?.user_id;

                    const saveMedicalIfNeeded = () => {
                        if (!(medicalData && createdUserId)) {
                            toast.success("Usuario creado exitosamente");
                            handleCloseModal();
                            return;
                        }

                        saveUserMedicalData(
                            { userId: createdUserId, medicalData },
                            {
                                onSuccess: () => {
                                    toast.success("Usuario médico creado exitosamente");
                                    handleCloseModal();
                                },
                                onError: (error: any) => {
                                    const message = error?.response?.data?.message || "Usuario creado, pero falló el guardado de datos médicos";
                                    toast.error(message);
                                },
                            }
                        );
                    };

                    if (createdUserId && locationIds) {
                        setUserLocations(
                            { userId: createdUserId, locationIds },
                            {
                                onSuccess: () => {
                                    saveMedicalIfNeeded();
                                },
                                onError: (error: any) => {
                                    const message = error?.response?.data?.message || "Usuario creado, pero falló la asociación de ubicaciones";
                                    const missingIds = error?.response?.data?.missing_location_ids;

                                    if (Array.isArray(missingIds) && missingIds.length > 0) {
                                        toast.error(`${message}: ${missingIds.join(", ")}`);
                                        return;
                                    }

                                    toast.error(message);
                                },
                            }
                        );
                        return;
                    }

                    saveMedicalIfNeeded();
                },
                onError: () => {
                    toast.error("Error al crear el usuario");
                },
            });
        }
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
        handleDelete
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">Administración de usuarios del sistema</p>
                </div>
                <button
                    className="px-4 py-2 bg-brand-purple text-white rounded-md hover:bg-brand-purple/90"
                    onClick={() => handleOpenModal()}
                >
                    Nuevo Usuario
                </button>
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
                isLoading={false}
            />

            <ResetPasswordModal
                isOpen={isResetPasswordModalOpen}
                onClose={handleCloseResetPasswordModal}
                onSubmit={handleResetPassword}
                userName={selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : ""}
                isLoading={false}
            />
        </div>
    )
}

