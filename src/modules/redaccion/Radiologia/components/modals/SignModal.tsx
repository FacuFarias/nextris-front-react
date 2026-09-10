import { Modal } from "@/components/Modal";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components";
import { AlertCircle, Lock, Signature, X } from "lucide-react";

interface SignModalProps {
    isOpen: boolean;
    onClose: () => void;
    isSigned: boolean;
    password: string;
    setPassword: (password: string) => void;
    isSigning: boolean;
    onVerifyCredentials: () => void;
    requirePassword?: boolean;
}

export const SignModal = ({
    isOpen,
    onClose,
    isSigned,
    password,
    setPassword,
    isSigning,
    onVerifyCredentials,
    requirePassword = true
}: SignModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isSigned ? "Quitar Firma del Informe" : "Firmar Informe"}
            size="md"
        >
            <div className="space-y-6">
                {/* Alerta informativa */}
                <div className={`bg-linear-to-r ${isSigned ? 'from-red-50 to-orange-50 border-red-200' : 'from-blue-50 to-cyan-50 border-blue-200'} border rounded-xl p-4 flex items-start gap-3`}>
                    <AlertCircle className={`h-5 w-5 ${isSigned ? 'text-red-600' : 'text-blue-600'} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isSigned ? 'text-red-900' : 'text-blue-900'}`}>
                            Atención:
                        </p>
                        <p className={`text-sm ${isSigned ? 'text-red-700' : 'text-blue-700'} mt-1`}>
                            {isSigned
                                ? 'Esta acción removerá la firma del informe y permitirá editarlo nuevamente.'
                                : requirePassword
                                    ? 'Esta acción requiere verificación de su identidad mediante contraseña.'
                                    : 'Esta acción firmará el informe sin verificación de contraseña.'}
                        </p>
                    </div>
                </div>

                {/* Compatibilidad del modal: el campo solo existe si un flujo
                    externo vuelve a habilitar explícitamente la verificación. */}
                {requirePassword && (
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Lock className="h-4 w-4 text-gray-500" />
                            Contraseña <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Input
                                type="password"
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12 text-base border-gray-300 focus:border-brand-purple focus:ring-brand-purple"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && password.trim() && !isSigning) {
                                        onVerifyCredentials();
                                    }
                                }}
                                autoFocus
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-2 justify-end">
                    <SecondaryButton onClick={onClose}>
                        <X className="h-5 w-5 mr-2" />
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                        onClick={onVerifyCredentials}
                        disabled={(requirePassword && !password.trim()) || isSigning}
                    >
                        <Signature className="h-5 w-5 mr-2" />
                        {isSigning ? (isSigned ? 'Quitando firma...' : 'Firmando...') : (isSigned ? 'Confirmar y Quitar Firma' : 'Confirmar y Firmar')}
                    </PrimaryButton>
                </div>
            </div>
        </Modal>
    );
};
