//react hook form and zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
//components
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
//schema
import { createPatientSchema, type CreatePatientFormValues } from "../schemas/create-patient.schema";
//hooks
import { usePatientsDomains } from "@/hooks/use-patients-domains";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useObraSocial } from "@/modules/configuracion/configuracion-tablas/examenes/obra-social/hooks/use-obra-social";
import { Autocomplete, type AutocompleteOption } from "@/components/autocomplete";

interface CreatePatientFormProps {
    onSubmit: (data: CreatePatientFormValues) => void;
    isLoading?: boolean;
    initialData?: Partial<CreatePatientFormValues>;
}

export const CreatePatientForm = ({ onSubmit, isLoading, initialData }: CreatePatientFormProps) => {
    const { authData } = useAuth();
    const { data: patientsDomains, isLoading: isLoadingDomains } = usePatientsDomains();
    const { obraSocial, isLoading: isLoadingObraSocial } = useObraSocial();

    const form = useForm<CreatePatientFormValues>({
        resolver: zodResolver(createPatientSchema),
        defaultValues: {
            name: initialData?.name || "",
            surname: initialData?.surname || "",
            documentnumber: initialData?.documentnumber || "",
            birthdate: initialData?.birthdate || "",
            gender: initialData?.gender || undefined,
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            address: initialData?.address || "",
            city: initialData?.city || "",
            province: initialData?.province || "",
            country: initialData?.country || "",
            healthinsurance: initialData?.healthinsurance || "",
            patientdomain_id: initialData?.patientdomain_id || "",
        },

    });
    const isAdmin = authData?.user?.name === "Administrador";
    const domains = patientsDomains?.data || [];
    const shouldShowSelect = isAdmin || domains.length > 1;

    // Si no es admin y solo hay un dominio, seleccionarlo automáticamente
    useEffect(() => {
        if (!isAdmin && domains.length === 1 && !form.getValues("patientdomain_id")) {
            form.setValue("patientdomain_id", domains[0].patientdomain_id);
        }
    }, [isAdmin, domains, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {shouldShowSelect ? (
                    <FormField
                        control={form.control}
                        name="patientdomain_id"
                        render={({ field }) => (
                            <FormItem className="w-full cursor-pointer">
                                <FormLabel>Seleccione dominio *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading || isLoadingDomains}
                                >
                                    <FormControl className="w-full cursor-pointer">
                                        <SelectTrigger>
                                            <SelectValue placeholder={isLoadingDomains ? "Cargando..." : "Seleccione dominio"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="cursor-pointer">
                                        {domains.length > 0 && domains.map((domain: any) => (
                                            <SelectItem key={domain.patientdomain_id} value={domain.patientdomain_id}>
                                                {domain.patientdomain_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : domains.length === 1 && (
                    <div className="w-full">
                        <p className="text-sm font-medium mb-2">Dominio:</p>
                        <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">
                            {domains[0].patientdomain_name}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Juan" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="surname"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Apellido *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Pérez" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="documentnumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Documento *</FormLabel>
                                <FormControl>
                                    <Input placeholder="12345678" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="ejemplo@mail.com"
                                        {...field}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Género *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl className="w-full">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione género" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="M">Masculino</SelectItem>
                                        <SelectItem value="F">Femenino</SelectItem>
                                        <SelectItem value="Otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="birthdate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha de Nacimiento *</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="1234567890" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dirección</FormLabel>
                                <FormControl>
                                    <Input placeholder="Av. Ejemplo 123" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ciudad</FormLabel>
                                <FormControl>
                                    <Input placeholder="Buenos Aires" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="province"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Provincia</FormLabel>
                                <FormControl>
                                    <Input placeholder="Buenos Aires" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl>
                                    <Input placeholder="Argentina" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="healthinsurance"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Seleccione obra social *</FormLabel>
                                <FormControl>
                                    <Autocomplete
                                        options={
                                            obraSocial?.data?.map((obraSocialItem: any): AutocompleteOption => ({
                                                value: obraSocialItem.guid,
                                                label: obraSocialItem.description,
                                            })) || []
                                        }
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Seleccione obra social"
                                        searchPlaceholder="Buscar obra social..."
                                        emptyMessage="No se encontró ninguna obra social"
                                        disabled={isLoading}
                                        isLoading={isLoadingObraSocial}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <PrimaryButton
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Guardando..." : initialData ? "Actualizar Paciente" : "Guardar Paciente"}
                    </PrimaryButton>
                </div>
            </form>
        </Form>
    );
};
