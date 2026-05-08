import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export const EmailVerificationModal = () => {
    const { authData, logout, updateUser } = useAuth();
    const [code, setCode] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [initialAttemptDone, setInitialAttemptDone] = useState(false);

    const email = String(authData?.user?.email || "").trim();
    const facilityId = String(authData?.user?.facility_id || "").trim();
    const isOpen = Boolean(authData?.user?.email_verification_required);
    const autoSendStorageKey = `email-verification-auto-send:${facilityId}:${email}`;

    const sendCode = async (showToast = true) => {
        if (!facilityId || !email) {
            toast.error("No se pudo determinar la institución o email a verificar.");
            logout();
            return;
        }

        setIsSending(true);
        try {
            const payload = new FormData();
            payload.append("facility_id", facilityId);
            payload.append("email", email);
            const response = await api.post("/auth/free-signup/send-verification", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data?.success) {
                if (!showToast) {
                    sessionStorage.setItem(autoSendStorageKey, "1");
                }
                if (showToast) {
                    toast.success(response.data?.message || "Código enviado correctamente.");
                }
                return;
            }

            toast.error(response.data?.message || "No se pudo enviar el código.");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "No se pudo enviar el código.");
        } finally {
            setIsSending(false);
        }
    };

    const verifyCode = async () => {
        if (!facilityId || !email || code.trim().length !== 6) {
            toast.error("Ingrese un código válido de 6 dígitos.");
            return;
        }

        setIsVerifying(true);
        try {
            const payload = new FormData();
            payload.append("facility_id", facilityId);
            payload.append("email", email);
            payload.append("code", code.trim());
            const response = await api.post("/auth/free-signup/verify-code", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data?.success) {
                updateUser({
                    ...authData!.user,
                    email_verification_required: false,
                    email_verified: true,
                });
                toast.success("Email verificado correctamente.");
                return;
            }

            toast.error(response.data?.message || "No se pudo verificar el código.");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "No se pudo verificar el código.");
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (sessionStorage.getItem(autoSendStorageKey) === "1") {
            setInitialAttemptDone(true);
            return;
        }

        if (!initialAttemptDone && !isSending) {
            setInitialAttemptDone(true);
            void sendCode(false);
        }
    }, [autoSendStorageKey, initialAttemptDone, isOpen, isSending]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={logout}
            title="Verifique su email"
            description="Antes de usar NextRIS debe validar el código enviado a su correo."
            size="md"
            showCloseButton={false}
            closeOnOutsideClick={false}
        >
            <div className="space-y-4">
                <div className="rounded-md border border-border/70 bg-muted/20 p-3 text-sm text-muted-foreground">
                    Se envió un código de 6 dígitos a <strong>{email}</strong>. Si no lo ingresa, debe cerrar sesión.
                </div>

                <Input
                    placeholder="Código de 6 dígitos"
                    value={code}
                    maxLength={6}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                />

                <div className="flex items-center justify-between gap-2">
                    <Button type="button" variant="outline" onClick={logout}>
                        Cerrar sesión
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" onClick={() => sendCode(true)} disabled={isSending}>
                            {isSending ? "Enviando..." : "Reenviar código"}
                        </Button>
                        <Button type="button" onClick={verifyCode} disabled={isVerifying || code.trim().length !== 6}>
                            {isVerifying ? "Verificando..." : "Verificar"}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
