import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrimaryButton, SecondaryButton } from "@/components";

interface UpdateEmailFormProps {
    onSubmit: (email: string) => void;
    onCancel: () => void;
    initialEmail?: string;
    isLoading?: boolean;
}

export const UpdateEmailForm = ({
    onSubmit,
    onCancel,
    initialEmail = "",
    isLoading = false,
}: UpdateEmailFormProps) => {
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
            <div className="space-y-2">
                <Label htmlFor="email">Email del Paciente *</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@email.com"
                    required
                />
            </div>

            <div className="flex gap-2 justify-end">
                <SecondaryButton type="button" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isLoading}>
                    {isLoading ? "Actualizando..." : "Actualizar"}
                </PrimaryButton>
            </div>
        </form>
    );
};
