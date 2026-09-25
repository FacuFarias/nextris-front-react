import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

export interface ImpersonationTarget {
    guid: string;
    username: string;
    name: string;
    surname: string;
    role?: string;
}

export const ImpersonationDialog = ({ target, onClose }: {
    target: ImpersonationTarget | null;
    onClose: () => void;
}) => {
    const { authData, replaceSession } = useAuth();
    const [isSwitching, setIsSwitching] = useState(false);

    const handleSwitch = async () => {
        if (!target || !authData?.refresh_token || isSwitching) return;
        setIsSwitching(true);
        try {
            const response = await api.post('/auth/impersonate', {
                target_user_id: target.guid,
                refresh_token: authData.refresh_token,
            });
            const nextSession = response.data?.data;
            if (!response.data?.success || !nextSession?.access_token || !nextSession?.refresh_token || !nextSession?.user) {
                throw new Error('No se pudo iniciar la sesión del usuario');
            }
            replaceSession(nextSession);
            const role = String(nextSession.user.user_type || '').toLowerCase();
            window.location.replace(role === 'medico' || role === 'médico' || role === 'tecnico'
                ? '/worklist'
                : role === 'administrativo' ? '/administrative_view' : '/inicio');
        } catch (error: unknown) {
            const requestError = error as { response?: { data?: { message?: string } }; message?: string };
            toast.error(requestError.response?.data?.message || requestError.message || 'No se pudo cambiar de usuario');
            setIsSwitching(false);
        }
    };

    return (
        <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open && !isSwitching) onClose(); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><LogIn className="h-5 w-5" />Conectarse como usuario</DialogTitle>
                    <DialogDescription>
                        Entrarás como {target?.name} {target?.surname} ({target?.username}) con sus permisos y listas de trabajo.
                        Tu sesión actual se cerrará y necesitarás iniciar sesión de nuevo para volver a tu cuenta.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSwitching}>Cancelar</Button>
                    <Button type="button" onClick={() => void handleSwitch()} disabled={isSwitching}>
                        {isSwitching && <Loader2 className="h-4 w-4 animate-spin" />}
                        Conectarme como este usuario
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
