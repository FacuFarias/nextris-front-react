import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, MapPin, Phone, Mail, Upload, Save, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { informacionBasicaService } from './services/informacion-basica.service';
import type { InformacionBasicaFormData } from './types/informacion-basica.types';

const emptyValues: InformacionBasicaFormData = { name: '', address: '', phone: '', mail: '' };

export const InformacionBasica = () => {
    const [locationId, setLocationId] = useState('');
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { errors, isDirty } } = useForm<InformacionBasicaFormData>({ defaultValues: emptyValues });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await informacionBasicaService.get();
                if (data) {
                    setLocationId(data.guid);
                    setLogoPath(data.logo_path ?? null);
                    reset({ name: data.name ?? '', address: data.address ?? '', phone: data.phone ?? '', mail: data.mail ?? '' });
                }
            } catch { toast.error('No se pudieron cargar los datos institucionales'); }
            finally { setIsLoading(false); }
        };
        void load();
    }, [reset]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('El logo no puede superar los 2 MB'); return; }
        setValue('logo', file, { shouldDirty: true });
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: InformacionBasicaFormData) => {
        if (!locationId) { toast.error('No hay una ubicación institucional configurada'); return; }
        setIsSaving(true);
        try {
            const response = await informacionBasicaService.update(locationId, data);
            setLogoPath(response?.logo_path ?? logoPath);
            reset({ name: data.name, address: data.address, phone: data.phone, mail: data.mail });
            toast.success('Datos institucionales guardados correctamente');
        } catch { toast.error('No se pudieron guardar los datos institucionales'); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-brand-purple" />
                        Datos Institucionales
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">Información que aparecerá en el encabezado de los reportes médicos.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1.5 text-xs text-brand-purple dark:text-purple-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Configuración activa
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="overflow-hidden border border-border/70 bg-card/70 shadow-sm py-0">
                    <CardHeader className="border-b border-border/70 bg-muted/20 px-6 py-4">
                        <CardTitle className="text-base font-semibold">Identidad y contacto</CardTitle>
                        <CardDescription className="text-xs">Estos datos serán utilizados por el encabezado institucional.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="institution-name" className="text-sm font-medium">Nombre de la institución</Label>
                                <div className="relative"><Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="institution-name" {...register('name', { required: 'El nombre es requerido' })} className="h-10 pl-9" placeholder="Clínica Parque" disabled={isLoading} /></div>
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="institution-address" className="text-sm font-medium">Dirección</Label>
                                <div className="relative"><MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="institution-address" {...register('address', { required: 'La dirección es requerida' })} className="h-10 pl-9" placeholder="Calle, número, ciudad" disabled={isLoading} /></div>
                                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2"><Label htmlFor="institution-phone" className="text-sm font-medium">Teléfono</Label><div className="relative"><Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="institution-phone" {...register('phone')} className="h-10 pl-9" placeholder="+54 11 1234-5678" disabled={isLoading} /></div></div>
                                <div className="space-y-2"><Label htmlFor="institution-mail" className="text-sm font-medium">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="institution-mail" type="email" {...register('mail')} className="h-10 pl-9" placeholder="contacto@institucion.com" disabled={isLoading} /></div></div>
                            </div>
                        </div>

                        <div className="border-t border-border/70 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                            <div className="mb-3"><h3 className="text-sm font-semibold">Logo institucional</h3><p className="mt-1 text-xs text-muted-foreground">PNG o JPG · máximo 2 MB</p></div>
                            <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">
                                {logoPreview ? <img src={logoPreview} alt="Vista previa del logo" className="h-full w-full object-contain p-4" /> : logoPath ? <div className="text-center"><ImageIcon className="mx-auto mb-2 h-8 w-8 text-brand-purple" /><p className="text-xs text-muted-foreground">Logo configurado</p></div> : <div className="text-center"><ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" /><p className="text-xs text-muted-foreground">Sin logo cargado</p></div>}
                            </div>
                            <Input id="institution-logo" type="file" accept="image/png,image/jpeg,image/jpg" {...register('logo')} onChange={handleLogoChange} className="hidden" disabled={isLoading} />
                            <Label htmlFor="institution-logo" className="mt-3 flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background text-xs font-medium transition-colors hover:border-brand-purple hover:text-brand-purple"><Upload className="h-4 w-4" />Cambiar logo</Label>
                        </div>
                    </CardContent>
                    <div className="flex items-center justify-between border-t border-border/70 bg-muted/10 px-6 py-4">
                        <p className="text-xs text-muted-foreground">Los cambios se aplican a los nuevos reportes.</p>
                        <Button type="submit" size="sm" className="px-5" disabled={isLoading || isSaving || !isDirty}><Save className="mr-2 h-4 w-4" />{isSaving ? 'Guardando...' : 'Guardar cambios'}</Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};
