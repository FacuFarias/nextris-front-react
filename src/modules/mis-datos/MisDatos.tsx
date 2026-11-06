import { ResponsibleProfile } from "@/modules/veterinary/ResponsiblePortal";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/layouts/layout";
import { DynamicBreadcrumb } from "@/components";
import { useEffect, useState } from "react";
import { misDatosService } from "./services/mis-datos.service";
import { useMisDatos } from "./hooks/use-mis-datos";
import { useUpdateProfile } from "./hooks/use-update-profile";
import { PatientChangePasswordModal } from "@/modules/auth/change-password/PatientChangePasswordModal";
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
    KeyRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/fechaYhora";

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
                ? "bg-purple-50 ring-1 ring-purple-200 dark:bg-purple-950 dark:ring-purple-700"
                : "hover:bg-muted cursor-default"
        )}>
            <div className={cn("shrink-0 transition-colors", isEditing ? "text-brand-purple" : "text-gray-400 group-hover:text-purple-400")}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                {isEditing ? (
                    <div className="mt-1 flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                        <Input
                            type={type}
                            value={editingValue}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            aria-label={label}
                            className="h-11 min-w-0 basis-full px-2 text-base sm:basis-auto sm:flex-1 lg:h-7 lg:text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") onSave(field);
                                if (e.key === "Escape") onCancel();
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-11 w-11 shrink-0 bg-green-500 hover:bg-green-600 lg:h-7 lg:w-7"
                            aria-label="Guardar"
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
                            className="h-11 w-11 shrink-0 lg:h-7 lg:w-7"
                            aria-label="Cancelar edición"
                            onClick={onCancel}
                            disabled={isPending}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                            "text-sm font-semibold [overflow-wrap:anywhere]",
                            value ? "text-foreground" : "text-gray-400 italic font-normal"
                        )}>
                            {value || "No registrado"}
                        </span>
                        <button
                            onClick={() => onEdit(field, value)}
                            className="min-h-11 min-w-11 shrink-0 rounded-lg p-1.5 text-gray-400 transition-opacity hover:bg-purple-100 hover:text-purple-600 lg:min-h-0 lg:min-w-0 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
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
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors">
        <div className="shrink-0 text-gray-400">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-foreground [overflow-wrap:anywhere]">{value || "-"}</p>
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
        <h3 className="text-base font-bold text-foreground">{title}</h3>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const HumanMisDatos = () => {
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const { profile, isLoading, isError, error, refetch } = useMisDatos();
    const updateProfileMutation = useUpdateProfile();
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [verificationBusy, setVerificationBusy] = useState(false);
    const [resendAt, setResendAt] = useState(0);
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!profile?.email_verification_enabled) return;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [profile?.email_verification_enabled]);
    useEffect(() => {
        const refresh = () => { void refetch(); };
        window.addEventListener("focus", refresh);
        return () => window.removeEventListener("focus", refresh);
    }, [refetch]);

    const handleVerification = async (confirm: boolean) => {
        setVerificationBusy(true);
        try {
            const result = confirm
                ? await misDatosService.confirmEmailVerification(verificationCode.trim())
                : await misDatosService.sendEmailVerification();
            if (confirm) {
                setVerificationSent(false);
                setVerificationCode("");
                await refetch();
            } else {
                setVerificationSent(true);
                setResendAt(Date.now() + 60000);
            }
            toast.success(result.message);
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
            toast.error(message || "No se pudo validar el email");
        } finally {
            setVerificationBusy(false);
        }
    };

    const handleEdit = (field: string, value: string) => {
        setEditingField(field);
        setEditingValue(value || "");
    };

    const handleSave = async (field: string) => {
        const payload: UpdateProfilePayload = { [field]: editingValue.trim() };
        try {
            await updateProfileMutation.mutateAsync(payload);
            await refetch();
            setEditingField(null);
            if (field === "email") {
                setVerificationSent(false);
                setVerificationCode("");
            }
            toast.success("Campo actualizado correctamente");
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

    if (isError) {
        return <MainLayout><div role="alert" className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p>No se pudieron cargar tus datos. {error?.message}</p>
            <Button variant="outline" onClick={() => { void refetch(); }}>Reintentar</Button>
        </div></MainLayout>;
    }

    return (
        <MainLayout>
            <div className="page-dark-gradient min-w-0 rounded-2xl p-3 sm:p-6 shadow-sm border border-border flex flex-col">
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
                        <CardContent className="min-w-0 p-3 sm:p-5">
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
                                        profile?.birthdate ? formatDate(profile.birthdate) : ""
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
                        <CardContent className="min-w-0 p-3 sm:p-5">
                            <SectionHeader
                                icon={<Mail className="w-5 h-5 text-white" />}
                                title="Contacto"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                <EditableField
                                    label="Teléfono"
                                    type="tel"
                                    value={profile?.phone || ""}
                                    field="phone"
                                    icon={<Phone className="w-4 h-4" />}
                                    placeholder="+54 11 1234-5678"
                                    {...editProps}
                                />
                                <div className="min-w-0">
                                    <EditableField
                                        label="Email"
                                        value={profile?.email || ""}
                                        field="email"
                                        type="email"
                                        icon={<Mail className="w-4 h-4" />}
                                        placeholder="ejemplo@email.com"
                                        {...editProps}
                                    />
                                    {profile?.email_verification_enabled && <div className="px-4 pb-3 space-y-2">
                                        {profile?.email_verified ? (
                                            <p className="flex items-center gap-1 text-sm text-green-700"><Check className="h-4 w-4" />Email validado</p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-muted-foreground">{profile?.email ? "Email pendiente de validación" : "Agregue y guarde su email para validarlo."}</p>
                                                <Button
                                                    type="button" variant="outline" size="sm"
                                                    disabled={!profile?.email || verificationBusy || editingField === "email" || updateProfileMutation.isPending || now < resendAt}
                                                    onClick={() => handleVerification(false)}
                                                >
                                                    {verificationBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {now < resendAt ? `Reenviar en ${Math.ceil((resendAt - now) / 1000)} s` : verificationSent ? "Reenviar código" : "Validar email"}
                                                </Button>
                                                <p className="text-xs text-muted-foreground">Ingrese el código enviado a su email. Vence en 30 minutos; revise también la carpeta de spam.</p>
                                                <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" onSubmit={(event) => { event.preventDefault(); void handleVerification(true); }}>
                                                    <Input
                                                        aria-label="Código de validación del email"
                                                        placeholder="Código de 6 dígitos"
                                                        inputMode="numeric" autoComplete="one-time-code"
                                                        maxLength={6} pattern="[0-9]{6}" required
                                                        value={verificationCode}
                                                        onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                                                        className="min-w-0 flex-1"
                                                        disabled={verificationBusy || editingField === "email"}
                                                    />
                                                    <Button type="submit" size="sm" disabled={verificationBusy || verificationCode.length !== 6 || editingField === "email" || updateProfileMutation.isPending}>Confirmar código</Button>
                                                </form>
                                            </>
                                        )}
                                    </div>}
                                </div>
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
                    <Card className="bg-transparent lg:col-span-2">
                        <CardContent className="min-w-0 p-3 sm:p-5">
                            <SectionHeader icon={<KeyRound className="h-5 w-5 text-white" />} title="Seguridad" />
                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full gap-2 border-brand-purple/30 text-brand-purple hover:bg-purple-50 hover:text-brand-purple sm:w-auto"
                                    onClick={() => setIsChangePasswordOpen(true)}
                                    disabled={!profile?.can_change_password || editingField === "email" || updateProfileMutation.isPending}
                                >
                                    <KeyRound className="h-4 w-4" />
                                    Cambiar contraseña
                                </Button>
                                {!profile?.can_change_password && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {profile?.email_verification_enabled
                                            ? "Complete y valide su email en Contacto para habilitar el cambio de contraseña."
                                            : "Agregue y guarde un email válido en Contacto para habilitar el cambio de contraseña."}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <PatientChangePasswordModal
                isOpen={isChangePasswordOpen && !!profile?.can_change_password && editingField !== "email"}
                onClose={() => setIsChangePasswordOpen(false)}
            />
        </MainLayout>
    );
};

export const MisDatos = () => { const { authData } = useAuth(); return authData?.user.portal_subject === "responsible" ? <ResponsibleProfile /> : <HumanMisDatos />; };
