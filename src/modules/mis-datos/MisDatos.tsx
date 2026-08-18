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
    IdCard,
    Users,
    Pencil,
    Loader2,
    UserCircle,
    Home,
    MapPin,
    Check,
    X,
    Building2,
    Hash,
} from "lucide-react";
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
            "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 sm:px-4",
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
                    <div className="mt-1 flex min-w-0 items-center gap-1.5">
                        <Input
                            type={type}
                            value={editingValue}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="h-11 min-w-0 px-2 text-base sm:h-7 sm:text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onSave(field);
                                if (e.key === "Escape") onCancel();
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-11 w-11 shrink-0 bg-green-500 hover:bg-green-600 sm:h-7 sm:w-7"
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
                            className="h-11 w-11 shrink-0 sm:h-7 sm:w-7"
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
                            className="min-h-11 min-w-11 shrink-0 rounded-lg p-1.5 text-gray-400 transition-opacity hover:bg-purple-100 hover:text-purple-600 sm:min-h-0 sm:min-w-0 sm:opacity-0 sm:group-hover:opacity-100"
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
            <div className="page-dark-gradient rounded-lg p-3 sm:p-6 shadow-sm border border-border flex flex-col flex-1">
                <DynamicBreadcrumb />

                {/* ── Header ── */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="bg-brand-purple dark:bg-gradient-to-br dark:from-purple-600 dark:to-purple-900 p-2 sm:p-3 rounded-lg dark:shadow-[0_0_16px_rgba(139,92,246,0.5),0_2px_8px_rgba(0,0,0,0.4)]">
                        <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-brand-purple dark:text-purple-400 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]">Mis Datos</h1>
                </div>

                {/* ── Cards grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Datos Personales */}
                    <Card className="bg-transparent">
                        <CardContent className="p-5">
                            <SectionHeader
                                icon={<UserCircle className="w-5 h-5 text-white" />}
                                title="Datos Personales"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                <ReadOnlyField
                                    label="Nombre completo"
                                    value={profile?.full_name || ""}
                                    icon={<User className="w-4 h-4" />}
                                />
                                <ReadOnlyField
                                    label="Fecha de nacimiento"
                                    value={
                                        profile?.birthdate
                                            ? new Date(profile.birthdate + "T00:00:00").toLocaleDateString("es-AR")
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
                    <Card className="bg-transparent">
                        <CardContent className="p-5">
                            <SectionHeader
                                icon={<Mail className="w-5 h-5 text-white" />}
                                title="Contacto"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
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
                </div>
            </div>
        </MainLayout>
    );
};
