import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Settings {
    name: string; email?: string; address?: string; city?: string; country?: string; phone?: string;
    smtp_server?: string; smtp_port?: number; smtp_user?: string; smtp_from?: string; smtp_from_name?: string;
    use_tls?: boolean; hl7_enable_orm?: boolean; hl7_enable_report_sending?: boolean;
}

export function InstitutionSettings() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['institution-settings'],
        queryFn: async () => (await api.get<{ data: Settings }>('/app-config/settings')).data.data,
    });
    const [form, setForm] = useState<Settings>({ name: '' });
    const [smtpPassword, setSmtpPassword] = useState('');
    const [hl7Token, setHl7Token] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => { if (data) setForm(data); }, [data]);
    const fields: Array<[keyof Settings, string]> = [
        ['name', 'Nombre de la institución'], ['email', 'Email'], ['address', 'Dirección'],
        ['city', 'Ciudad'], ['country', 'País'], ['phone', 'Teléfono'],
        ['smtp_server', 'Servidor SMTP'], ['smtp_port', 'Puerto SMTP'], ['smtp_user', 'Usuario SMTP'],
        ['smtp_from', 'Remitente SMTP'], ['smtp_from_name', 'Nombre del remitente'],
    ];
    const save = async (event: React.FormEvent) => {
        event.preventDefault(); setSaving(true);
        try {
            await api.put('/app-config', { ...form,
                ...(smtpPassword ? { smtp_password: smtpPassword } : {}),
                ...(hl7Token ? { hl7_bearer_token_orm: hl7Token } : {}),
            });
            setSmtpPassword(''); setHl7Token('');
            await queryClient.invalidateQueries({ queryKey: ['institution-settings'] });
            toast.success('Configuración institucional guardada');
        } catch { toast.error('No se pudo guardar la configuración institucional'); }
        finally { setSaving(false); }
    };
    if (isLoading) return <p role="status">Cargando configuración…</p>;
    if (isError) return <p role="alert">No se pudo cargar la configuración institucional.</p>;
    return <form onSubmit={save} className="space-y-5 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Institución, correo e integración HL7</h2>
        <div className="grid gap-4 md:grid-cols-2">{fields.map(([key, label]) => <div key={key} className="space-y-2">
            <Label htmlFor={`institution-${key}`}>{label}</Label>
            <Input id={`institution-${key}`} required={key === 'name'} type={key === 'smtp_port' ? 'number' : 'text'}
                min={key === 'smtp_port' ? 1 : undefined} max={key === 'smtp_port' ? 65535 : undefined}
                value={String(form[key] ?? '')}
                onChange={event => setForm(current => ({ ...current, [key]: key === 'smtp_port' ? Number(event.target.value) : event.target.value }))} />
        </div>)}</div>
        <div className="space-y-2"><Label htmlFor="smtp-password">Nueva contraseña SMTP</Label>
            <Input id="smtp-password" type="password" autoComplete="new-password" value={smtpPassword} onChange={event => setSmtpPassword(event.target.value)} />
            <p className="text-sm text-muted-foreground">Dejar vacío conserva la contraseña guardada.</p></div>
        <div className="space-y-2"><Label htmlFor="hl7-token">Nuevo token para recibir órdenes HL7</Label>
            <Input id="hl7-token" type="password" autoComplete="new-password" value={hl7Token} onChange={event => setHl7Token(event.target.value)} />
            <p className="text-sm text-muted-foreground">Dejar vacío conserva el token guardado.</p></div>
        {([['use_tls', 'Usar TLS para SMTP'], ['hl7_enable_orm', 'Recibir órdenes HL7'],
            ['hl7_enable_report_sending', 'Enviar ejecución e informes por HL7']] as const).map(([key, label]) =>
            <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form[key])}
                onChange={event => setForm(current => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}
        <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar configuración'}</Button>
    </form>;
}
