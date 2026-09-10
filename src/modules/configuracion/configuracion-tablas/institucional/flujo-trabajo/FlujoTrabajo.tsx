import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Clock3, Info, Save, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flujoTrabajoService } from './services/flujo-trabajo.service';
import type { FlujoTrabajoConfig } from './types/flujo-trabajo.types';

const defaultValues: FlujoTrabajoConfig = { report_send_delay_minutes: 15 };

export const FlujoTrabajo = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FlujoTrabajoConfig>({ defaultValues });

    useEffect(() => {
        const load = async () => {
            try {
                const config = await flujoTrabajoService.get();
                reset({ report_send_delay_minutes: config?.report_send_delay_minutes ?? 15 });
            } catch {
                toast.error('No se pudo cargar la configuración del flujo de trabajo');
            } finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [reset]);

    const onSubmit = async (values: FlujoTrabajoConfig) => {
        setIsSaving(true);
        try {
            const config = await flujoTrabajoService.update({
                report_send_delay_minutes: Number(values.report_send_delay_minutes),
            });
            reset({ report_send_delay_minutes: config.report_send_delay_minutes });
            toast.success('Configuración de flujo guardada correctamente');
        } catch {
            toast.error('No se pudo guardar la configuración del flujo de trabajo');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Workflow className="h-6 w-6 text-brand-purple" />
                        Flujo de trabajo
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">Define qué ocurre después de firmar un reporte médico.</p>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1.5 text-xs text-brand-purple dark:text-purple-300 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Configuración activa
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="overflow-hidden border border-border/70 bg-card/70 shadow-sm py-0">
                    <CardHeader className="border-b border-border/70 bg-muted/20 px-6 py-4">
                        <CardTitle className="text-base font-semibold">Envío de reportes firmados</CardTitle>
                        <CardDescription className="text-xs">Configura el tiempo que debe transcurrir entre la firma y el envío a la API de Clínica Parque.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 p-6">
                        <div className="max-w-xl space-y-2">
                            <Label htmlFor="report-send-delay" className="text-sm font-medium">Retardo de envío (minutos)</Label>
                            <div className="relative max-w-sm">
                                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="report-send-delay"
                                    type="number"
                                    min={0}
                                    max={1440}
                                    step={1}
                                    className="h-10 pl-9"
                                    disabled={isLoading || isSaving}
                                    {...register('report_send_delay_minutes', {
                                        required: 'El retardo es requerido',
                                        valueAsNumber: true,
                                        min: { value: 0, message: 'El valor mínimo es 0 minutos' },
                                        max: { value: 1440, message: 'El valor máximo es 1440 minutos' },
                                        validate: (value) => Number.isInteger(value) || 'Ingrese un número entero',
                                    })}
                                />
                            </div>
                            {errors.report_send_delay_minutes && <p className="text-xs text-red-500">{errors.report_send_delay_minutes.message}</p>}
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>Valor estándar: 15 minutos. El reporte queda firmado y se envía automáticamente cuando finaliza este período. Puedes usar 0 para enviarlo inmediatamente.</p>
                            </div>
                        </div>
                    </CardContent>
                    <div className="flex items-center justify-between border-t border-border/70 bg-muted/10 px-6 py-4">
                        <p className="text-xs text-muted-foreground">Se aplica a los reportes firmados después de guardar este cambio.</p>
                        <Button type="submit" size="sm" className="px-5" disabled={isLoading || isSaving || !isDirty}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};
