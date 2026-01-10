import { useState } from "react";
import { Modal } from "@/components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (newPassword: string) => void;
    patientName: string;
    isLoading?: boolean;
}

export const ResetPasswordModal = ({
    isOpen,
    onClose,
    onSubmit,
    patientName,
    isLoading = false,
}: ResetPasswordModalProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 4) {
            setError("La contraseña debe tener al menos 4 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setError("");
        onSubmit(password);
        setPassword("");
        setConfirmPassword("");
    };

    const handleClose = () => {
        setPassword("");
        setConfirmPassword("");
        setError("");
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Resetear Contraseña"
            description={`Ingrese la nueva contraseña para ${patientName}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new-password">
                        Nueva Contraseña <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingrese nueva contraseña"
                        required
                        minLength={4}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                        Confirmar Contraseña <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme la contraseña"
                        required
                        minLength={4}
                    />
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                <div className="flex gap-2 justify-end pt-4 border-t">
                    <SecondaryButton type="button" onClick={handleClose} disabled={isLoading}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isLoading}>
                        {isLoading ? "Reseteando..." : "Resetear Contraseña"}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};
