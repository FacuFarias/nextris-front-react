import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import type { PatientProfile, UpdateProfilePayload } from "../types";
import { Loader2 } from "lucide-react";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: UpdateProfilePayload) => void;
    profile: PatientProfile | undefined;
    isLoading: boolean;
}

export const EditProfileModal = ({
    isOpen,
    onClose,
    onSubmit,
    profile,
    isLoading,
}: EditProfileModalProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdateProfilePayload>({
        defaultValues: {
            phone: profile?.phone || "",
            email: profile?.email || "",
            address: profile?.address || "",
            city: profile?.city || "",
            state: profile?.state || "",
            zip_code: profile?.zip_code || "",
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Datos de Contacto</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            {...register("phone")}
                            placeholder="+54 11 1234-5678"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="ejemplo@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            {...register("address")}
                            placeholder="Calle 123"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Ciudad</Label>
                            <Input
                                id="city"
                                {...register("city")}
                                placeholder="Buenos Aires"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">Provincia</Label>
                            <Input
                                id="state"
                                {...register("state")}
                                placeholder="CABA"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zip_code">Código Postal</Label>
                        <Input
                            id="zip_code"
                            {...register("zip_code")}
                            placeholder="1000"
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
