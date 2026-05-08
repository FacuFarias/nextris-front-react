import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { toast } from "sonner";

type InstitutionMode = "new" | "existing";

interface SignupFormState {
    institution_mode: InstitutionMode;
    institution: {
        name: string;
        email: string;
        address: string;
        city: string;
        country: string;
        phone: string;
    };
    user: {
        username: string;
        password: string;
        email: string;
        name: string;
        surname: string;
        national_number: string;
        aclaracion_firma: string;
        matricula_nacional: string;
    };
}

const DEFAULT_FORM: SignupFormState = {
    institution_mode: "new",
    institution: {
        name: "",
        email: "",
        address: "",
        city: "",
        country: "",
        phone: "",
    },
    user: {
        username: "",
        password: "",
        email: "",
        name: "",
        surname: "",
        national_number: "",
        aclaracion_firma: "",
        matricula_nacional: "",
    },
};

export const FreeSignup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState("institution-type");
    const [isCreatingInstitution, setIsCreatingInstitution] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<SignupFormState>(DEFAULT_FORM);
    const [institutionCreated, setInstitutionCreated] = useState(false);
    const [createdFacilityId, setCreatedFacilityId] = useState<string | null>(null);
    const [createdLocationId, setCreatedLocationId] = useState<string | null>(null);
    const [createdFacilityCode, setCreatedFacilityCode] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);

    const onChangeInstitution = (key: keyof SignupFormState["institution"], value: string) => {
        setForm((prev) => ({
            ...prev,
            institution: {
                ...prev.institution,
                [key]: value,
            },
        }));
    };

    const onChangeUser = (key: keyof SignupFormState["user"], value: string) => {
        setForm((prev) => ({
            ...prev,
            user: {
                ...prev.user,
                [key]: value,
            },
        }));
    };

    const validateImageFile = (file: File, maxBytes: number) => {
        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            return "Formato inválido. Use PNG o JPG/JPEG";
        }
        if (file.size > maxBytes) {
            return `El archivo supera el máximo permitido (${Math.floor(maxBytes / (1024 * 1024))}MB)`;
        }
        return null;
    };

    const goNextFromType = () => {
        if (form.institution_mode === "existing") {
            return;
        }
        setStep("institution-data");
    };

    const goNextFromInstitution = () => {
        const required = [
            form.institution.name,
            form.institution.email,
            form.institution.address,
            form.institution.phone,
        ];

        if (!required.every((value) => value.trim().length > 0)) {
            toast.error("Complete los datos requeridos de la institución");
            return;
        }

        if (!institutionCreated) {
            toast.error("Primero debe crear la institución para continuar");
            return;
        }

        setStep("user-data");
    };

    const createInstitution = async () => {
        const required = [
            form.institution.name,
            form.institution.email,
            form.institution.address,
            form.institution.phone,
        ];

        if (!required.every((value) => value.trim().length > 0)) {
            toast.error("Complete los datos requeridos de la institución");
            return;
        }

        if (logoFile) {
            const logoError = validateImageFile(logoFile, 2 * 1024 * 1024);
            if (logoError) {
                toast.error(`Logo: ${logoError}`);
                return;
            }
        }

        setIsCreatingInstitution(true);
        try {
            const payload = new FormData();
            payload.append("institution_mode", "new");
            payload.append("name", form.institution.name);
            payload.append("email", form.institution.email);
            payload.append("address", form.institution.address);
            payload.append("city", form.institution.city);
            payload.append("country", form.institution.country);
            payload.append("phone", form.institution.phone);
            if (logoFile) {
                payload.append("logo", logoFile);
            }

            const response = await api.post("/auth/free-signup/institution", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data?.success) {
                setCreatedFacilityId(response.data?.data?.facility_id || null);
                setCreatedLocationId(response.data?.data?.location_id || null);
                setCreatedFacilityCode(response.data?.data?.facility_code || null);
                setInstitutionCreated(true);
                setStep("user-data");
                toast.success("Institución creada correctamente. Ya puede crear el usuario médico.");
                return;
            }

            toast.error(response.data?.message || "No se pudo crear la institución");
        } catch (error: any) {
            const message = error?.response?.data?.message || "No se pudo crear la institución";
            toast.error(message);
        } finally {
            setIsCreatingInstitution(false);
        }
    };

    const submitFreeSignup = async () => {
        if (!institutionCreated || !createdFacilityId || !createdLocationId) {
            toast.error("Primero debe crear la institución");
            return;
        }

        const requiredUser = [
            form.user.username,
            form.user.password,
            form.user.email,
            form.user.name,
            form.user.surname,
            form.user.aclaracion_firma,
            form.user.matricula_nacional,
        ];

        if (!requiredUser.every((value) => value.trim().length > 0)) {
            toast.error("Complete los datos requeridos del usuario médico");
            return;
        }

        if (form.user.password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        if (signatureFile) {
            const signatureError = validateImageFile(signatureFile, 1 * 1024 * 1024);
            if (signatureError) {
                toast.error(`Firma: ${signatureError}`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append("facility_id", createdFacilityId);
            payload.append("location_id", createdLocationId);
            payload.append("username", form.user.username);
            payload.append("password", form.user.password);
            payload.append("email", form.user.email);
            payload.append("name", form.user.name);
            payload.append("surname", form.user.surname);
            payload.append("national_number", form.user.national_number);
            payload.append("aclaracion_firma", form.user.aclaracion_firma);
            payload.append("matricula_nacional", form.user.matricula_nacional);
            if (signatureFile) {
                payload.append("signature", signatureFile);
            }

            const response = await api.post("/auth/free-signup/medical-user", payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (response.data?.success) {
                toast.success("Registro gratuito completado. Ya puede iniciar sesión.");
                navigate("/login");
                return;
            }
            toast.error(response.data?.message || "No se pudo completar el registro gratuito");
        } catch (error: any) {
            const message = error?.response?.data?.message || "No se pudo completar el registro gratuito";
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn("min-h-screen flex items-center justify-center p-4 transition-theme relative theme-staff")}>
            <BackgroundEffects isPatient={false} />

            <div className="relative z-10 w-full max-w-5xl inicio-container module-panel rounded-2xl p-6 space-y-5 border border-border/70">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-purple">Crear Usuario Gratuito</h1>
                        <p className="text-sm text-muted-foreground">Alta guiada para nuevas instituciones en NextRIS</p>
                    </div>
                    <Link to="/login" className="text-sm text-primary hover:underline">
                        Volver al login
                    </Link>
                </div>

                <Tabs value={step} onValueChange={setStep} className="w-full">
                    <TabsList className="grid grid-cols-3 w-full h-10 module-panel border border-border/70">
                        <TabsTrigger
                            value="institution-type"
                            className="menu-card rounded-md border-transparent data-[state=active]:border-purple-400/50 data-[state=active]:bg-[linear-gradient(145deg,rgba(124,58,237,0.2),rgba(91,33,182,0.2))] data-[state=active]:text-foreground"
                        >
                            Tipo de Institución
                        </TabsTrigger>
                        <TabsTrigger
                            value="institution-data"
                            disabled={form.institution_mode === "existing"}
                            className="menu-card rounded-md border-transparent data-[state=active]:border-purple-400/50 data-[state=active]:bg-[linear-gradient(145deg,rgba(124,58,237,0.2),rgba(91,33,182,0.2))] data-[state=active]:text-foreground"
                        >
                            Institución / Ubicación
                        </TabsTrigger>
                        <TabsTrigger
                            value="user-data"
                            disabled={form.institution_mode === "existing" || !institutionCreated}
                            className="menu-card rounded-md border-transparent data-[state=active]:border-purple-400/50 data-[state=active]:bg-[linear-gradient(145deg,rgba(124,58,237,0.2),rgba(91,33,182,0.2))] data-[state=active]:text-foreground"
                        >
                            Usuario Médico
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="institution-type" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                className={cn(
                                    "menu-card rounded-xl border p-4 text-left transition-all duration-300",
                                    form.institution_mode === "new"
                                        ? "border-purple-400/50 bg-[linear-gradient(145deg,rgba(124,58,237,0.24),rgba(91,33,182,0.2))] shadow-[0_8px_24px_rgba(124,58,237,0.25)]"
                                        : "border-border/70"
                                )}
                                onClick={() => {
                                    setForm((prev) => ({ ...prev, institution_mode: "new" }));
                                    setStep("institution-data");
                                }}
                            >
                                <h3 className="font-semibold">Nueva institución</h3>
                                <p className="text-sm text-muted-foreground mt-1">Crear una institución nueva en NextRIS (plan gratuito).</p>
                            </button>

                            <button
                                type="button"
                                className={cn(
                                    "menu-card rounded-xl border p-4 text-left transition-all duration-300",
                                    form.institution_mode === "existing"
                                        ? "border-purple-400/50 bg-[linear-gradient(145deg,rgba(124,58,237,0.24),rgba(91,33,182,0.2))] shadow-[0_8px_24px_rgba(124,58,237,0.25)]"
                                        : "border-border/70"
                                )}
                                onClick={() => setForm((prev) => ({ ...prev, institution_mode: "existing" }))}
                            >
                                <h3 className="font-semibold">Institución existente</h3>
                                <p className="text-sm text-muted-foreground mt-1">Solicitar alta a su administrador local.</p>
                            </button>
                        </div>

                        {form.institution_mode === "existing" && (
                            <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm">
                                Consulte la creacion de usuarios con el administrador de sistemas de su institución.
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="button" onClick={goNextFromType}>
                                {form.institution_mode === "existing" ? "Entendido" : "Continuar"}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="institution-data" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Nombre de institución *" value={form.institution.name} onChange={(e) => onChangeInstitution("name", e.target.value)} />
                            <Input placeholder="Email institución *" value={form.institution.email} onChange={(e) => onChangeInstitution("email", e.target.value)} />
                            <Input placeholder="Dirección *" value={form.institution.address} onChange={(e) => onChangeInstitution("address", e.target.value)} />
                            <Input placeholder="Teléfono *" value={form.institution.phone} onChange={(e) => onChangeInstitution("phone", e.target.value)} />
                            <Input placeholder="Ciudad" value={form.institution.city} onChange={(e) => onChangeInstitution("city", e.target.value)} />
                            <Input placeholder="País" value={form.institution.country} onChange={(e) => onChangeInstitution("country", e.target.value)} />
                            <div className="md:col-span-2">
                                <label className="text-sm text-muted-foreground">Logo de institución (PNG/JPG, máximo 2MB)</label>
                                <Input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        <div className="module-panel rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                            En plan gratuito, la ubicación se crea automáticamente con el mismo nombre de la institución.
                        </div>

                        <div className="module-panel rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                            El código institucional se genera automáticamente (ejemplo: DI-001).
                            {createdFacilityCode ? ` Código generado: ${createdFacilityCode}` : ""}
                        </div>

                        <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep("institution-type")}>Atrás</Button>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" onClick={createInstitution} disabled={isCreatingInstitution || institutionCreated}>
                                    {institutionCreated ? "Institución creada" : isCreatingInstitution ? "Creando institución..." : "Crear institución"}
                                </Button>
                                <Button type="button" onClick={goNextFromInstitution} disabled={!institutionCreated}>Continuar</Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="user-data" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Usuario *" value={form.user.username} onChange={(e) => onChangeUser("username", e.target.value)} />
                            <Input type="password" placeholder="Contraseña *" value={form.user.password} onChange={(e) => onChangeUser("password", e.target.value)} />
                            <Input placeholder="Email *" value={form.user.email} onChange={(e) => onChangeUser("email", e.target.value)} />
                            <Input placeholder="Nombre *" value={form.user.name} onChange={(e) => onChangeUser("name", e.target.value)} />
                            <Input placeholder="Apellido *" value={form.user.surname} onChange={(e) => onChangeUser("surname", e.target.value)} />
                            <Input placeholder="Documento" value={form.user.national_number} onChange={(e) => onChangeUser("national_number", e.target.value)} />
                            <Input placeholder="Aclaración de firma *" value={form.user.aclaracion_firma} onChange={(e) => onChangeUser("aclaracion_firma", e.target.value)} />
                            <Input placeholder="Matrícula nacional *" value={form.user.matricula_nacional} onChange={(e) => onChangeUser("matricula_nacional", e.target.value)} />
                            <div className="md:col-span-2">
                                <label className="text-sm text-muted-foreground">Firma médica (PNG/JPG, máximo 1MB)</label>
                                <Input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <Button type="button" variant="outline" onClick={() => setStep("institution-data")}>Atrás</Button>
                            <Button type="button" onClick={submitFreeSignup} disabled={isSubmitting}>
                                {isSubmitting ? "Creando..." : "Crear usuario gratuito"}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
