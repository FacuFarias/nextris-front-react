//react hook form and zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
/* import { useEffect } from "react"; */
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
//hooks
/* import { useAuth } from "@/context/AuthContext"; */
import { PrimaryButton } from "@/components/PrimaryButton";
import { createPatientFastSchema, type CreatePatientFormFast } from "../schemas/create-patient-fast.schema";
import { DateInput } from "@/components/ui/date-input";

interface CreatePatientFormProps {
    onSubmit: (data: CreatePatientFormFast) => void;
    isLoading?: boolean;
}

export const AgregarPacienteRapido = ({ onSubmit, isLoading }: CreatePatientFormProps) => {
    /* const { authData } = useAuth(); */
    const form = useForm<CreatePatientFormFast>({
        resolver: zodResolver(createPatientFastSchema),
        defaultValues: {
            nombre: "",
            apellido: "",
            dni: "",
            fecha_nac: "",
            sexo: undefined,
        },

    });
    /* const isAdmin = authData?.user?.name === "Administrador"; */

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="nombre"
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
                        name="apellido"
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
                        name="dni"
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
                        name="sexo"
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
                        name="fecha_nac"
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

                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <PrimaryButton
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Guardando..." : "Guardar Paciente"}
                    </PrimaryButton>
                </div>
            </form>
        </Form>
    );
};
