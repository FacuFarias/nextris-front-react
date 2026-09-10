//react hook form and zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { PrimaryButton } from "@/components/PrimaryButton";
import { useObraSocial } from "@/modules/configuracion/configuracion-tablas/examenes/obra-social/hooks/use-obra-social";
import { Autocomplete, type AutocompleteOption } from "@/components/autocomplete";
import { DateInput } from "@/components/ui/date-input";

interface CreatePatientFormProps {
    onSubmit: (data: CreatePatientFormValues) => void;
    isLoading?: boolean;
    initialData?: Partial<CreatePatientFormValues>;
}

export const CreatePatientForm = ({ onSubmit, isLoading, initialData }: CreatePatientFormProps) => {
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
            patientid: initialData?.patientid || "",
        },

    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        name="patientid"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Patient ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="130266" {...field} disabled={isLoading} />
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
                                <FormLabel>Número de Documento</FormLabel>
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
                                <FormLabel>Email</FormLabel>
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
                                    <DateInput {...field} disabled={isLoading} />
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
