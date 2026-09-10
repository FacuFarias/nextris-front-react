import { useState } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PatientChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PatientChangePasswordModal = ({
    isOpen,
    onClose,
}: PatientChangePasswordModalProps) => {
    const { markPasswordChanged, logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleClose = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!currentPassword) {
            toast.error("Ingrese su contraseña actual");
            return;
        }

        if (newPassword.length < 4) {
            toast.error("La contraseña debe tener al menos 4 caracteres");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        try {
            setIsSaving(true);
            await api.post("/patient-portal/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });
            markPasswordChanged();
            toast.success("Contraseña actualizada correctamente");
            handleClose();
        } catch (error: unknown) {
            const response = (error as { response?: { data?: { message?: unknown } } }).response;
            const message = typeof response?.data?.message === "string"
                ? response.data.message
                : "No se pudo actualizar la contraseña";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Cambio de contraseña"
            description="Ingrese su contraseña actual y defina una nueva contraseña."
            size="md"
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                    <Label htmlFor="patient-current-password">Contraseña actual</Label>
                    <Input
                        id="patient-current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Ingrese su contraseña actual"
                        autoComplete="current-password"
                        disabled={isSaving}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="patient-new-password">Nueva contraseña</Label>
                    <Input
                        id="patient-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        autoComplete="new-password"
                        disabled={isSaving}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="patient-confirm-password">Confirmar contraseña</Label>
                    <Input
                        id="patient-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Repita la contraseña"
                        autoComplete="new-password"
                        disabled={isSaving}
                        required
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <SecondaryButton type="button" onClick={logout} disabled={isSaving}>
                        Cerrar sesión
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Actualizar contraseña"}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};
