import { MainLayout } from "@/layouts/layout";
import { DynamicBreadcrumb } from "@/components";
import { useState } from "react";
import { useMisDatos } from "./hooks/use-mis-datos";
import { useUpdateProfile } from "./hooks/use-update-profile";
import type { UpdateProfilePayload } from "./types";
import { toast } from "sonner";
import {
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    IdCard,
    Users,
    Pencil,
    Loader2,
    UserCircle,
    Home,
    MapPin,
    CheckCircle2,
    Clock,
    Check,
    X,
    Building2,
    Hash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Inline editable field ──────────────────────────────────────────────────

interface EditableFieldProps {
    label: string;
    value: string;
    field: string;
    icon: React.ReactNode;
    placeholder?: string;
    type?: string;
    editingField: string | null;
    editingValue: string;
    isPending: boolean;
    onEdit: (field: string, value: string) => void;
    onSave: (field: string) => void;
    onCancel: () => void;
    onChange: (value: string) => void;
}

const EditableField = ({
    label, value, field, icon, placeholder, type = "text",
    editingField, editingValue, isPending,
    onEdit, onSave, onCancel, onChange,
}: EditableFieldProps) => {
    const isEditing = editingField === field;

    return (
        <div className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
            isEditing
                ? "bg-purple-50 ring-1 ring-purple-200"
                : "hover:bg-gray-50 cursor-default"
        )}>
            <div className={cn("shrink-0 transition-colors", isEditing ? "text-brand-purple" : "text-gray-400 group-hover:text-purple-400")}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                        <Input
                            type={type}
                            value={editingValue}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="h-7 text-sm px-2"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onSave(field);
                                if (e.key === "Escape") onCancel();
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-7 w-7 bg-green-500 hover:bg-green-600 shrink-0"
                            onClick={() => onSave(field)}
                            disabled={isPending}
                        >
                            {isPending
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Check className="w-3 h-3" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={onCancel}
                            disabled={isPending}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                            "text-sm font-semibold truncate",
                            value ? "text-gray-900" : "text-gray-400 italic font-normal"
                        )}>
                            {value || "No registrado"}
                        </span>
                        <button
                            onClick={() => onEdit(field, value)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-purple-100 text-gray-400 hover:text-purple-600 shrink-0"
                            title="Editar"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Read-only field ─────────────────────────────────────────────────────────

const ReadOnlyField = ({
    label, value, icon,
}: { label: string; value: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
        <div className="shrink-0 text-gray-400">{icon}</div>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{value || "-"}</p>
        </div>
    </div>
);

// ─── Card section header ─────────────────────────────────────────────────────

const SectionHeader = ({
    icon, title, color = "bg-brand-purple",
}: { icon: React.ReactNode; title: string; color?: string }) => (
    <div className="flex items-center gap-3 mb-4 px-1">
        <div className={cn("p-2 rounded-lg shadow-sm", color)}>
            {icon}
        </div>
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const MisDatos = () => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const { profile, isLoading, refetch } = useMisDatos();
    const updateProfileMutation = useUpdateProfile();

    const handleEdit = (field: string, value: string) => {
        setEditingField(field);
        setEditingValue(value || "");
    };

    const handleSave = async (field: string) => {
        const payload: UpdateProfilePayload = {
            phone: profile?.phone || "",
            email: profile?.email || "",
            address: profile?.address || "",
            city: profile?.city || "",
            state: profile?.state || "",
            zip_code: profile?.zip_code || "",
            [field]: editingValue,
        };
        try {
            await updateProfileMutation.mutateAsync(payload);
            toast.success("Campo actualizado correctamente");
            setEditingField(null);
            refetch();
        } catch {
            toast.error("Error al actualizar");
        }
    };

    const handleCancel = () => {
        setEditingField(null);
        setEditingValue("");
    };

    const editProps = {
        editingField,
        editingValue,
        isPending: updateProfileMutation.isPending,
        onEdit: handleEdit,
        onSave: handleSave,
        onCancel: handleCancel,
        onChange: setEditingValue,
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex justify-center items-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6 p-6">
                <DynamicBreadcrumb />

                {/* ── Header ── */}
                <div className="bg-gradient-to-br from-brand-purple via-purple-600 to-purple-800 rounded-2xl p-7 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-full bg-white/15 border-4 border-white/30 flex items-center justify-center shadow-xl">
                                <User className="w-9 h-9 text-white" />
                            </div>
                            {profile?.account_status === "Active" && (
                                <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full p-1 border-2 border-white shadow">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-white min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold leading-tight truncate">
                                {profile?.full_name || "Usuario"}
                            </h1>
                            <p className="text-white/60 text-sm mt-0.5">
                                @{profile?.username || "-"}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge className="bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-medium">
                                    <IdCard className="w-3 h-3 mr-1.5" />
                                    DNI: {profile?.national_code || "-"}
                                </Badge>
                                <Badge className="bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-medium">
                                    <Users className="w-3 h-3 mr-1.5" />
                                    {profile?.sex || "-"}
                                </Badge>
                                {profile?.age && (
                                    <Badge className="bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-medium">
                                        {profile.age} años
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Cards grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Datos Personales */}
                    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <SectionHeader
                                icon={<UserCircle className="w-5 h-5 text-white" />}
                                title="Datos Personales"
                            />
                            <div className="space-y-1 divide-y divide-gray-50">
                                <ReadOnlyField
                                    label="Nombre completo"
                                    value={profile?.full_name || ""}
                                    icon={<User className="w-4 h-4" />}
                                />
                                <ReadOnlyField
                                    label="Fecha de nacimiento"
                                    value={
                                        profile?.birthdate
                                            ? new Date(profile.birthdate).toLocaleDateString("es-AR")
                                            : ""
                                    }
                                    icon={<Calendar className="w-4 h-4" />}
                                />
                                <ReadOnlyField
                                    label="Documento"
                                    value={profile?.national_code ? `DNI: ${profile.national_code}` : ""}
                                    icon={<IdCard className="w-4 h-4" />}
                                />
                                <ReadOnlyField
                                    label="Género"
                                    value={profile?.sex || ""}
                                    icon={<Users className="w-4 h-4" />}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacto — campos editables */}
                    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <SectionHeader
                                icon={<Mail className="w-5 h-5 text-white" />}
                                title="Contacto"
                            />
                            <div className="space-y-1 divide-y divide-gray-50">
                                <EditableField
                                    label="Teléfono"
                                    value={profile?.phone || ""}
                                    field="phone"
                                    icon={<Phone className="w-4 h-4" />}
                                    placeholder="+54 11 1234-5678"
                                    {...editProps}
                                />
                                <EditableField
                                    label="Email"
                                    value={profile?.email || ""}
                                    field="email"
                                    type="email"
                                    icon={<Mail className="w-4 h-4" />}
                                    placeholder="ejemplo@email.com"
                                    {...editProps}
                                />
                                <EditableField
                                    label="Dirección"
                                    value={profile?.address || ""}
                                    field="address"
                                    icon={<Home className="w-4 h-4" />}
                                    placeholder="Calle 123"
                                    {...editProps}
                                />
                                <EditableField
                                    label="Ciudad"
                                    value={profile?.city || ""}
                                    field="city"
                                    icon={<Building2 className="w-4 h-4" />}
                                    placeholder="Buenos Aires"
                                    {...editProps}
                                />
                                <EditableField
                                    label="Provincia"
                                    value={profile?.state || ""}
                                    field="state"
                                    icon={<MapPin className="w-4 h-4" />}
                                    placeholder="CABA"
                                    {...editProps}
                                />
                                <EditableField
                                    label="Código postal"
                                    value={profile?.zip_code || ""}
                                    field="zip_code"
                                    icon={<Hash className="w-4 h-4" />}
                                    placeholder="1000"
                                    {...editProps}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Obra Social */}
                    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <SectionHeader
                                icon={<CreditCard className="w-5 h-5 text-white" />}
                                title="Obra Social"
                            />
                            <div className="space-y-1 divide-y divide-gray-50">
                                <ReadOnlyField
                                    label="N° Afiliado"
                                    value={profile?.health_card || "No registrado"}
                                    icon={<CreditCard className="w-4 h-4" />}
                                />
                                <ReadOnlyField
                                    label="CUIL"
                                    value={profile?.patient_id_number || ""}
                                    icon={<IdCard className="w-4 h-4" />}
                                />
                            </div>

                            {/* Estado de cuenta */}
                            <div className="mt-5 pt-4 border-t border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                                    Estado de cuenta
                                </p>
                                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className={cn(
                                            "w-4 h-4",
                                            profile?.account_status === "Active" ? "text-green-500" : "text-gray-400"
                                        )} />
                                        <span className="text-sm font-medium text-gray-700">Estado</span>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "text-xs font-semibold",
                                            profile?.account_status === "Active"
                                                ? "bg-green-100 text-green-700 hover:bg-green-100"
                                                : "bg-red-100 text-red-700 hover:bg-red-100"
                                        )}
                                    >
                                        {profile?.account_status === "Active" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-3 px-4 text-gray-400">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
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
