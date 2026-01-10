import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";
import { AlertCircle } from "lucide-react";

interface SendReportFormProps {
    onSubmit: (email: string) => void;
    onCancel: () => void;
    initialEmail?: string;
    examName?: string;
    patientName?: string;
    isLoading?: boolean;
}

export const SendReportForm = ({
    onSubmit,
    onCancel,
    initialEmail = "",
    examName = "",
    patientName = "",
    isLoading = false,
}: SendReportFormProps) => {
    const [email, setEmail] = useState(initialEmail);

    useEffect(() => {
        setEmail(initialEmail);
    }, [initialEmail]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(email);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Información del Informe:</p>
                        <p><strong>Paciente:</strong> {patientName}</p>
                        <p><strong>Examen:</strong> {examName}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email Destino *</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@email.com"
                    required
                />
                <p className="text-xs text-gray-500">
                    El informe en PDF será enviado a este correo electrónico
                </p>
            </div>

            <div className="flex gap-2 justify-end">
                <SecondaryButton type="button" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isLoading}>
                    {isLoading ? "Enviando..." : "Enviar Informe"}
                </PrimaryButton>
            </div>
        </form>
    );
};
