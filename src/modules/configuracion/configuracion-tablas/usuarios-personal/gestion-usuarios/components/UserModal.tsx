import { Modal } from "@/components";
import { UserForm } from "./UserForm";
import type { UserFormData } from "../types/users.types";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => void;
    initialData?: Partial<UserFormData>;
    isLoading?: boolean;
}

export const UserModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isLoading = false,
}: UserModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            description={isEditing ? "Modifique los datos del usuario" : "Complete los datos del nuevo usuario"}
            size="lg"
        >
            <UserForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                isLoading={isLoading}
                isEditing={isEditing}
            />
        </Modal>
    );
};
