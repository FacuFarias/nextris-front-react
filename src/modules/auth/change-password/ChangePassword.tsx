import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const ChangePassword = () => {
    const navigate = useNavigate();
    const { authData, markPasswordChanged, logout } = useAuth();

    const isPatient = authData?.user.user_type === "patient";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (isPatient && !currentPassword) {
            toast.error("Ingrese su contraseña actual");
            return;
        }

        if (newPassword.length < (isPatient ? 4 : 6)) {
            toast.error(`La contraseña debe tener al menos ${isPatient ? 4 : 6} caracteres`);
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        try {
            setIsSaving(true);
            if (isPatient) {
                await api.post("/patient-portal/change-password", {
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                });
            } else {
                await api.post("/auth/change-password", { new_password: newPassword });
            }
            markPasswordChanged();
            toast.success("Contraseña actualizada correctamente");
            navigate(isPatient ? "/mis-datos" : "/inicio");
        } catch (error: any) {
            const message = error?.response?.data?.message || "No se pudo actualizar la contraseña";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-xl font-semibold text-brand-purple mb-1">Cambio de contraseña</h1>
                <p className="text-sm text-muted-foreground mb-5">
                    {isPatient
                        ? "Ingrese su contraseña actual y defina una nueva contraseña."
                        : "Por seguridad, antes de continuar debe cambiar su contraseña temporal."}
                </p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {isPatient && (
                        <div className="space-y-1.5">
                            <Label htmlFor="current_password">Contraseña actual</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Ingrese su contraseña actual"
                                required
                            />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <Label htmlFor="new_password">Nueva contraseña</Label>
                        <Input
                            id="new_password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={`Mínimo ${isPatient ? 4 : 6} caracteres`}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirm_password">Confirmar contraseña</Label>
                        <Input
                            id="confirm_password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita la contraseña"
                            required
                        />
                    </div>

                    <div className="pt-2 flex items-center gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={logout}
                            disabled={isSaving}
                        >
                            Cerrar sesión
                        </Button>
                        <Button
                            type="submit"
                            className="bg-brand-purple hover:bg-brand-purple/90 text-white"
                            disabled={isSaving}
                        >
                            {isSaving ? "Guardando..." : "Actualizar contraseña"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
