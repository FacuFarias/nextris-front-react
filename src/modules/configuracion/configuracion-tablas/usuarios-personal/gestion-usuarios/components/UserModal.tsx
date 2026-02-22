import { Modal } from "@/components";
import { UserForm } from "./UserForm";
import type { UserFormData, UserMedicalSubmitData } from "../types/users.types";

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData, locationIds?: string[], medicalData?: UserMedicalSubmitData, permissionCodes?: string[]) => void;
    initialData?: Partial<UserFormData>;
    userId?: string;
    isLoading?: boolean;
}

export const UserModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    userId,
    isLoading = false,
}: UserModalProps) => {
    const isEditing = !!initialData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Usuario" : "Nuevo Usuario"}
            size="full"
            className="sm:max-w-[70vw]"
        >
            <UserForm
                onSubmit={onSubmit}
                onCancel={onClose}
                initialData={initialData}
                userId={userId}
                isLoading={isLoading}
                isEditing={isEditing}
            />
        </Modal>
    );
};
