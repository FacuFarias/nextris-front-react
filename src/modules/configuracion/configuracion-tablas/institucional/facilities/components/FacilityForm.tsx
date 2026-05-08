import { useForm } from "react-hook-form";
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
import { PrimaryButton, SecondaryButton } from "@/components";
import { facilityFormSchema } from "../schemas/facility.schema";
import type { FacilityFormData } from "../types/facilities.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Database, MessageSquare } from "lucide-react";
import { useDominioPacientes } from "../../dominio-pacientes/hooks/use-dominio-pacientes";
import type { FacilityPlan, FacilityPlanChangeLog, FacilityUsageMonthly } from "../types/facilities.types";

interface FacilityFormProps {
    onSubmit: (data: FacilityFormData) => void;
    onCancel: () => void;
    initialData?: Partial<FacilityFormData>;
    isLoading?: boolean;
    plans?: FacilityPlan[];
    usageHistory?: FacilityUsageMonthly[];
    planChangeLogs?: FacilityPlanChangeLog[];
}

export const FacilityForm = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false,
    plans = [],
    usageHistory = [],
    planChangeLogs = [],
}: FacilityFormProps) => {
    const { dominioPacientes, isLoading: isLoadingDomains } = useDominioPacientes();

    const form = useForm<any>({
        resolver: zodResolver(facilityFormSchema),
        defaultValues: {
            description: initialData?.description || "",
            id_patientdomain: initialData?.id_patientdomain || "",
            plan_code: initialData?.plan_code || "free",

            // SMTP
            smtp_server: initialData?.smtp_server || "",
            smtp_port: initialData?.smtp_port || 587,
            smtp_user: initialData?.smtp_user || "",
            smtp_password: initialData?.smtp_password || "",
            smtp_from: initialData?.smtp_from || "",
            smtp_from_name: initialData?.smtp_from_name || "",
            smtp_use_tls: initialData?.smtp_use_tls ?? true,

            // Backend
            backend_db_user: initialData?.backend_db_user || "",
            backend_db_password: initialData?.backend_db_password || "",
            backend_db_host: initialData?.backend_db_host || "",
            backend_db_port: initialData?.backend_db_port || 5432,
            backend_db_name: initialData?.backend_db_name || "",
            backend_base_folder: initialData?.backend_base_folder || "",
            backend_ipserver: initialData?.backend_ipserver || "",

            // WhatsApp
            whatsapp_api_url: initialData?.whatsapp_api_url || "",
            whatsapp_token: initialData?.whatsapp_token || "",
            whatsapp_phone_number_id: initialData?.whatsapp_phone_number_id || "",
            whatsapp_business_account_id: initialData?.whatsapp_business_account_id || "",
            whatsapp_webhook_verify_token: initialData?.whatsapp_webhook_verify_token || "",
            whatsapp_is_active: initialData?.whatsapp_is_active ?? false,
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => onSubmit(data as FacilityFormData))} className="space-y-4">
                {/* Descripción - Campo Principal */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Descripción <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ej: Hospital Central"
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
                    name="id_patientdomain"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dominio de pacientes</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading || isLoadingDomains}
                            >
                                <FormControl className="w-full">
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={
                                                isLoadingDomains
                                                    ? "Cargando dominios..."
                                                    : "Seleccione un dominio"
                                            }
                                        />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {dominioPacientes?.data?.map((domain) => (
                                        <SelectItem key={domain.guid} value={domain.guid}>
                                            {domain.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="plan_code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Plan</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || "free"}
                                disabled={isLoading}
                            >
                                <FormControl className="w-full">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un plan" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {plans.length > 0 ? (
                                        plans.map((plan) => (
                                            <SelectItem key={plan.guid} value={plan.code.toLowerCase()}>
                                                {plan.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {usageHistory.length > 0 && (
                    <div className="rounded-md border p-3">
                        <h3 className="text-sm font-semibold mb-2">Histórico mensual de uso</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-left border-b">
                                        <th className="py-1 pr-2">Mes</th>
                                        <th className="py-1 pr-2">Recibidos</th>
                                        <th className="py-1 pr-2">Leídos</th>
                                        <th className="py-1 pr-2">Distribuidos</th>
                                        <th className="py-1 pr-2">Usuarios</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usageHistory.map((item) => (
                                        <tr key={`${item.usage_year}-${item.usage_month}`} className="border-b last:border-b-0">
                                            <td className="py-1 pr-2">{`${item.usage_year}-${String(item.usage_month).padStart(2, "0")}`}</td>
                                            <td className="py-1 pr-2">{item.received_count}</td>
                                            <td className="py-1 pr-2">{item.read_count}</td>
                                            <td className="py-1 pr-2">{item.distributed_count}</td>
                                            <td className="py-1 pr-2">{item.users_count_snapshot}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {planChangeLogs.length > 0 && (
                    <div className="rounded-md border p-3">
                        <h3 className="text-sm font-semibold mb-2">Auditoría de cambios de plan</h3>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {planChangeLogs.map((log) => (
                                <div key={log.guid} className="text-xs border rounded px-2 py-1">
                                    <div className="font-medium">
                                        {(log.previous_plan_code || "sin plan").toUpperCase()} -&gt; {(log.new_plan_code || "sin plan").toUpperCase()} ({log.action})
                                    </div>
                                    <div className="text-muted-foreground">
                                        {log.changed_at ? new Date(log.changed_at).toLocaleString("es-AR") : "-"}
                                        {log.reason ? ` | ${log.reason}` : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs para las configuraciones */}
                <Tabs defaultValue="smtp" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="smtp">
                            <Mail className="w-4 h-4 mr-2" />
                            SMTP
                        </TabsTrigger>
                        <TabsTrigger value="backend">
                            <Database className="w-4 h-4 mr-2" />
                            Backend
                        </TabsTrigger>
                        <TabsTrigger value="whatsapp">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            WhatsApp
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab SMTP */}
                    <TabsContent value="smtp" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="smtp_server"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Servidor SMTP</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="smtp.gmail.com"
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
                                name="smtp_port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Puerto SMTP</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="587"
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
                                name="smtp_user"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Usuario SMTP</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="user@example.com"
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
                                name="smtp_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña SMTP</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
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
                                name="smtp_from"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Remitente</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="noreply@hospital.com"
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
                                name="smtp_from_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Remitente</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Hospital Central"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="smtp_use_tls"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            disabled={isLoading}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        Usar TLS
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    {/* Tab Backend */}
                    <TabsContent value="backend" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="backend_db_host"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Host Base de Datos</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="localhost"
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
                                name="backend_db_port"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Puerto Base de Datos</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="5432"
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
                                name="backend_db_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Base de Datos</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="pacsdb"
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
                                name="backend_db_user"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Usuario Base de Datos</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="dbuser"
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
                                name="backend_db_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña Base de Datos</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
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
                                name="backend_ipserver"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IP Servidor</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="192.168.1.100"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="backend_base_folder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Carpeta Base</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="/var/www"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    {/* Tab WhatsApp */}
                    <TabsContent value="whatsapp" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="whatsapp_api_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>API URL</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="https://api.whatsapp.com"
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
                                name="whatsapp_token"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Token</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
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
                                name="whatsapp_phone_number_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123456"
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
                                name="whatsapp_business_account_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Business Account ID</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="account_id"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="whatsapp_webhook_verify_token"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Webhook Verify Token</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="verify_token"
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
                            name="whatsapp_is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            disabled={isLoading}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        WhatsApp Activo
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
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
