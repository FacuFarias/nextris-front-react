import { MainLayout } from "@/layouts/layout";
import { DynamicBreadcrumb } from "@/components";
import { useState } from "react";
import { useMisDatos } from "./hooks/use-mis-datos";
import { useUpdateProfile } from "./hooks/use-update-profile";
import type { UpdateProfilePayload } from "./types";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    IdCard,
    Users,
    Edit,
    Loader2,
    UserCircle,
    Home,
    MapPin,
    CheckCircle2,
    Clock,
    Save,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const MisDatos = () => {
    const [isEditing, setIsEditing] = useState(false);
    const { profile, isLoading, refetch } = useMisDatos();
    const updateProfileMutation = useUpdateProfile();

    const {
        register,
        handleSubmit,
        reset,
    } = useForm<UpdateProfilePayload>({
        values: {
            phone: profile?.phone || "",
            email: profile?.email || "",
            address: profile?.address || "",
            city: profile?.city || "",
            state: profile?.state || "",
            zip_code: profile?.zip_code || "",
        },
    });

    const handleUpdateProfile = async (data: UpdateProfilePayload) => {
        try {
            await updateProfileMutation.mutateAsync(data);
            toast.success("Perfil actualizado correctamente");
            setIsEditing(false);
            refetch();
        } catch (error) {
            toast.error("Error al actualizar el perfil");
            console.error(error);
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8 pb-8">
                <DynamicBreadcrumb />

                {/* Header con Avatar */}
                <div className="relative">
                    <div className="bg-brand-purple rounded-2xl p-8 shadow-xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-2xl">
                                    <User className="w-12 h-12 text-white" />
                                </div>
                                {profile?.account_status === "Active" && (
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-white shadow-lg">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-white">
                                <h1 className="text-4xl font-bold mb-2">
                                    {profile?.full_name || "Usuario"}
                                </h1>
                                <p className="text-white/80 text-lg mb-3">
                                    @{profile?.username || "-"}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white">
                                        <IdCard className="w-3 h-3 mr-1" />
                                        DNI: {profile?.national_code || "-"}
                                    </Badge>

                                    <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white">
                                        <Users className="w-3 h-3 mr-1" />
                                        {profile?.sex || "-"}
                                    </Badge>
                                </div>
                            </div>

                            {/* Button */}
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    size="lg"
                                    className="bg-white text-brand-purple hover:bg-white/90 shadow-lg"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Perfil
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleCancel}
                                        size="lg"
                                        variant="outline"
                                        className="bg-white/90 border-white text-gray-700 hover:bg-white shadow-lg"
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSubmit(handleUpdateProfile)}
                                        size="lg"
                                        className="bg-white text-brand-purple hover:bg-white/90 shadow-lg"
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        {updateProfileMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Guardar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Información Personal */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-brand-purple rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                    <UserCircle className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Datos Personales</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                                    <User className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 font-medium uppercase">Nombre Completo</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {profile?.full_name || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                                    <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase">Fecha de Nacimiento</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {profile?.birthdate
                                                ? new Date(profile.birthdate).toLocaleDateString("es-AR")
                                                : "-"}
                                        </p>

                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                                    <IdCard className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase">Documento</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            DNI: {profile?.national_code || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                                    <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase">Género</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {profile?.sex || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacto */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-brand-purple rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Contacto</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                                    <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <Label htmlFor="phone" className="text-xs text-gray-500 font-medium uppercase">
                                            Teléfono
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                id="phone"
                                                {...register("phone")}
                                                placeholder="+54 11 1234-5678"
                                                className="mt-1"
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-gray-900">
                                                {profile?.phone || "No registrado"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <Label htmlFor="email" className="text-xs text-gray-500 font-medium uppercase">
                                            Email
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                id="email"
                                                type="email"
                                                {...register("email")}
                                                placeholder="ejemplo@email.com"
                                                className="mt-1"
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-gray-900 break-all">
                                                {profile?.email || "No registrado"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                                    <Home className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <Label htmlFor="address" className="text-xs text-gray-500 font-medium uppercase">
                                            Dirección
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                id="address"
                                                {...register("address")}
                                                placeholder="Calle 123"
                                                className="mt-1"
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-gray-900">
                                                {profile?.address || "No registrada"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-2">Ubicación</p>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label htmlFor="city" className="text-xs">Ciudad</Label>
                                                        <Input
                                                            id="city"
                                                            {...register("city")}
                                                            placeholder="Buenos Aires"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="state" className="text-xs">Provincia</Label>
                                                        <Input
                                                            id="state"
                                                            {...register("state")}
                                                            placeholder="CABA"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="zip_code" className="text-xs">Código Postal</Label>
                                                    <Input
                                                        id="zip_code"
                                                        {...register("zip_code")}
                                                        placeholder="1000"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {profile?.city || "-"}, {profile?.state || "-"}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    CP: {profile?.zip_code || "-"}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Obra Social y Sistema */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-indigo-300">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-brand-purple rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Obra Social</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                    <CreditCard className="w-5 h-5 text-indigo-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase">N° Afiliado</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {profile?.health_card || "No registrado"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                                    <IdCard className="w-5 h-5 text-indigo-600 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase">CUIL</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {profile?.patient_id_number || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 font-medium uppercase mb-3">Estado de Cuenta</p>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-medium">Estado</span>
                                    </div>
                                    <Badge
                                        variant={profile?.account_status === "Active" ? "default" : "destructive"}
                                        className={profile?.account_status === "Active" ? "bg-green-500" : ""}
                                    >
                                        {profile?.account_status === "Active" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs">
                                        Último acceso:{" "}
                                        {profile?.last_login
                                            ? new Date(profile.last_login).toLocaleString("es-AR")
                                            : "-"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};
