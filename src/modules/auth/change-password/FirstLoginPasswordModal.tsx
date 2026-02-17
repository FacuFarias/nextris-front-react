import { useState } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface FirstLoginPasswordModalProps {
    isOpen: boolean;
}

export const FirstLoginPasswordModal = ({ isOpen }: FirstLoginPasswordModalProps) => {
    const { markPasswordChanged, logout } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (newPassword.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        try {
            setIsSaving(true);
            await api.post("/auth/change-password", { new_password: newPassword });
            markPasswordChanged();
            toast.success("Contraseña actualizada correctamente");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            const message = error?.response?.data?.message || "No se pudo actualizar la contraseña";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {}}
            title="Cambio obligatorio de contraseña"
            description="Es su primer ingreso. Debe cambiar la contraseña temporal para continuar."
            size="md"
            showCloseButton={false}
            closeOnOutsideClick={false}
        >
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="first-login-new-password">Nueva contraseña</Label>
                    <Input
                        id="first-login-new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        disabled={isSaving}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="first-login-confirm-password">Confirmar contraseña</Label>
                    <Input
                        id="first-login-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita la contraseña"
                        disabled={isSaving}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <SecondaryButton type="button" onClick={logout} disabled={isSaving}>
                        Cerrar sesión
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Actualizar contraseña"}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
