import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrimaryButton, SecondaryButton } from "@/components";
import { locationFormSchema, type LocationFormValues } from "../schemas/location.schema";
import type { LocationFormData } from "../types/locations.types";
import { useFacilities } from "../../facilities/hooks/useFacilities";

interface LocationFormProps {
    onSubmit: (data: LocationFormData) => void;
    onCancel: () => void;
    initialData?: Partial<LocationFormData>;
    isLoading?: boolean;
}

export const LocationForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
}: LocationFormProps) => {
    const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
    const { facilities, isLoading: isLoadingFacilities } = useFacilities();
    const form = useForm<LocationFormValues>({
        resolver: zodResolver(locationFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            code: initialData?.code || "",
            facility_id: initialData?.facility_id || "",
            status: initialData?.status || undefined,
            address: initialData?.address || "",
            city: initialData?.city || "",
            state: initialData?.state || "",
            zip_code: initialData?.zip_code || "",
            country: initialData?.country || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            timezone: initialData?.timezone || "",
            gateway_aet: initialData?.gateway_aet || "",
            gateway_ip: initialData?.gateway_ip || "",
            transmission_type: initialData?.transmission_type || "Manual",
            retention_days: initialData?.retention_days ?? undefined,
        },
    });

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((data) => onSubmit({ ...(data as LocationFormData), logo: logoFile }))}
                className="space-y-4"
            >
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="mb-4 w-full">
                        <TabsTrigger value="general" className="flex-1">Información general</TabsTrigger>
                        <TabsTrigger value="transmision" className="flex-1">Transmisión</TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Información general ── */}
                    <TabsContent value="general" className="space-y-4">
                        {/* Descripción, Código y Facility */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Descripción <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: Ubicación Principal"
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
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: CCF"
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
                                name="facility_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Facility <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading || isLoadingFacilities}
                                        >
                                            <FormControl className="w-full">
                                                <SelectTrigger>
                                                    <SelectValue placeholder={isLoadingFacilities ? "Cargando..." : "Seleccione una facility"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {facilities?.data?.map((facility) => (
                                                    <SelectItem key={facility.guid} value={facility.guid}>
                                                        {facility.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Status y Timezone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl className="w-full">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Active">Activo</SelectItem>
                                                <SelectItem value="Inactive">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="timezone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Zona Horaria</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="America/Mexico_City"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Dirección */}
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Calle 123"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Ciudad, Estado y Código Postal */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ciudad</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ciudad"
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
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado/Provincia</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Estado"
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
                                name="zip_code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código Postal</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="12345"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* País, Teléfono y Email */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>País</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="México"
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
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="+1234567890"
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
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="contact@hospital.com"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <FormLabel>Logo institucional</FormLabel>
                            <Input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp"
                                disabled={isLoading}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    setLogoFile(file);
                                }}
                            />
                            {initialData?.logo_path && !logoFile && (
                                <p className="text-xs text-muted-foreground">
                                    Logo actual: {initialData.logo_path}
                                </p>
                            )}
                            {logoFile && (
                                <p className="text-xs text-muted-foreground">
                                    Nuevo archivo: {logoFile.name}
                                </p>
                            )}
                        </div>
                    </TabsContent>

                    {/* ── Tab 2: Transmisión ── */}
                    <TabsContent value="transmision" className="space-y-4">
                        {/* Gateway AET y Gateway IP */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gateway_aet"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gateway AET</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: GATEWAY_AET"
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
                                name="gateway_ip"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gateway IP</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ej: 192.168.1.100"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Tipo de transmisión y Días de retención */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="transmission_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de transmisión</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={isLoading}
                                        >
                                            <FormControl className="w-full">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Manual">Manual</SelectItem>
                                                <SelectItem value="Automatic">Automatic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="retention_days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Días de retención</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="Ej: 30"
                                                value={field.value ?? ""}
                                                onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <SecondaryButton
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                                Guardando...
                            </>
                        ) : (
                            "Guardar"
                        )}
                    </PrimaryButton>
                </div>
            </form>
        </Form>
    );
};
