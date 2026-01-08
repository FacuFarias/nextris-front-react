import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, MapPin, Phone, Mail, Upload, Save, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface InformacionBasicaForm {
    nombreInstitucion: string;
    direccion: string;
    telefono: string;
    email: string;
    logo?: FileList;
}

export const InformacionBasica = () => {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isDirty } } = useForm<InformacionBasicaForm>({
        defaultValues: {
            nombreInstitucion: 'Centro Médico NextRIS Updated',
            direccion: 'Nueva Dirección 789',
            telefono: '+54 11 9999-8888',
            email: 'info@nextris.com',
        }
    });

    const onSubmit = (data: InformacionBasicaForm) => {
        console.log('Datos a guardar:', data);
        // Aquí irá la lógica para guardar los datos
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Building2 className="h-8 w-8 text-primary" />
                    Información Básica
                </h2>
                <p className="text-muted-foreground">
                    Gestiona la información general de tu institución
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-7xl">
                {/* Card Principal */}
                <Card className=" border-2 shadow-sm hover:shadow-md transition-shadow py-0">
                    <CardHeader className="bg-brand-purple text-white border-b rounded-t-sm">
                        <CardTitle className="text-xl mt-2">Datos de la Institución</CardTitle>
                        <CardDescription className='text-white'>
                            Información de contacto y datos principales
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 pb-8 space-y-6">
                        {/* Nombre de la Institución */}
                        <div className="space-y-2">
                            <Label htmlFor="nombreInstitucion" className="flex items-center gap-2 text-base">
                                <Building2 className="h-4 w-4 text-primary" />
                                Nombre de la Institución
                            </Label>
                            <Input
                                id="nombreInstitucion"
                                {...register('nombreInstitucion', {
                                    required: 'El nombre es requerido'
                                })}
                                className="text-base h-11 focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Ingresa el nombre de la institución"
                            />
                            {errors.nombreInstitucion && (
                                <p className="text-sm text-red-500">{errors.nombreInstitucion.message}</p>
                            )}
                        </div>

                        {/* Dirección */}
                        <div className="space-y-2">
                            <Label htmlFor="direccion" className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-primary" />
                                Dirección
                            </Label>
                            <Input
                                id="direccion"
                                {...register('direccion', {
                                    required: 'La dirección es requerida'
                                })}
                                className="text-base h-11 focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="Calle, número, ciudad"
                            />
                            {errors.direccion && (
                                <p className="text-sm text-red-500">{errors.direccion.message}</p>
                            )}
                        </div>

                        {/* Grid para Teléfono y Email */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Teléfono */}
                            <div className="space-y-2">
                                <Label htmlFor="telefono" className="flex items-center gap-2 text-base">
                                    <Phone className="h-4 w-4 text-primary" />
                                    Teléfono de Contacto
                                </Label>
                                <Input
                                    id="telefono"
                                    {...register('telefono', {
                                        required: 'El teléfono es requerido'
                                    })}
                                    className="text-base h-11 focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="+54 11 1234-5678"
                                />
                                {errors.telefono && (
                                    <p className="text-sm text-red-500">{errors.telefono.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2 text-base">
                                    <Mail className="h-4 w-4 text-primary" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email', {
                                        required: 'El email es requerido',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email inválido'
                                        }
                                    })}
                                    className="text-base h-11 focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="contacto@ejemplo.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card del Logo */}
                <Card className="border-2 shadow-sm hover:shadow-md transition-shadow py-0">
                    <CardHeader className="bg-brand-purple text-white border-b rounded-t-sm">
                        <CardTitle className="text-xl flex items-center gap-2 mt-2">
                            <ImageIcon className="h-5 w-5" />
                            Logo Institucional
                        </CardTitle>
                        <CardDescription className="text-white">
                            Sube el logo de tu institución (PNG, JPG - Máx. 2MB)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Vista previa del logo */}
                            <div className="shrink-0">
                                <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Vista previa del logo"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Sin logo</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selector de archivo */}
                            <div className="flex-1 space-y-4">
                                <div className="relative">
                                    <Input
                                        id="logo"
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        {...register('logo')}
                                        onChange={(e) => {
                                            register('logo').onChange(e);
                                            handleLogoChange(e);
                                        }}
                                        className="hidden"
                                    />
                                    <Label
                                        htmlFor="logo"
                                        className="flex items-center justify-center gap-2 w-full h-11 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                                    >
                                        <Upload className="h-5 w-5" />
                                        <span>Seleccionar archivo</span>
                                    </Label>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => document.getElementById('logo')?.click()}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Cambiar Logo
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Botón Guardar */}
                <div className="flex justify-end gap-3 pt-6 pb-8">
                    <Button
                        type="submit"
                        size="lg"
                        className="px-8 shadow-md hover:shadow-lg transition-all"
                        disabled={!isDirty}
                    >
                        <Save className="h-5 w-5 mr-2" />
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </div>
    );
};
