import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Heart, IdCard, Info, Layers, Loader2, Mail, PawPrint, Phone, Plus, Scale, UserRound, VenusAndMars, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { VeterinaryForm } from './VeterinaryPatients';
import { animalSchema, get, post } from './api';
import type { Animal, Choice, Responsible } from './api';

function RegistrationSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return <section aria-label={title} className="overflow-hidden rounded-xl border border-purple-200/80 bg-white/60 shadow-sm dark:border-purple-400/20 dark:bg-white/[0.025]">
    <h3 className="flex items-center gap-2.5 border-b border-purple-200/60 bg-gradient-to-r from-purple-100/90 to-purple-50/60 px-4 py-2.5 text-sm font-semibold text-purple-950 dark:border-purple-400/15 dark:from-purple-400/15 dark:to-purple-400/5 dark:text-purple-100">
      <Icon aria-hidden="true" className="size-4 text-purple-600 dark:text-purple-300" />{title}
    </h3>
    <div className="grid grid-cols-1 gap-x-5 gap-y-3.5 p-4 sm:grid-cols-2">{children}</div>
  </section>;
}

function RegistrationField({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <div className="relative min-w-0 [&_input]:h-11 [&_input]:rounded-lg [&_input]:border-purple-200 [&_input]:bg-white/70 [&_input]:pl-10 [&_input]:pr-3 [&_input]:text-base [&_input]:shadow-none [&_label]:font-medium [&_select]:h-11 [&_select]:min-w-0 [&_select]:rounded-lg [&_select]:border-purple-200 [&_select]:bg-white/70 [&_select]:pl-10 [&_select]:pr-3 [&_select]:text-base [&_select]:outline-none [&_select]:focus-visible:border-purple-400 [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-purple-400/30 sm:[&_input]:h-10 sm:[&_input]:text-sm sm:[&_select]:h-10 sm:[&_select]:text-sm dark:[&_input]:border-purple-300/25 dark:[&_input]:bg-white/5 dark:[&_select]:border-purple-300/25 dark:[&_select]:bg-[#26233d]">
    {children}<Icon aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 size-4 text-purple-500/80 dark:text-purple-200/65" />
  </div>;
}

export function AnimalRegistrationForm({ onCreated, onCancel, initial = {}, responsibleName = '' }: {
  onCreated: (animal: Animal) => void; onCancel?: () => void; initial?: Record<string, string>; responsibleName?: string;
}) {
  const { authData } = useAuth();
  const queryClient = useQueryClient();
  const [responsibleId, setResponsibleId] = useState('');
  const [addingResponsible, setAddingResponsible] = useState(false);
  const canManageResponsibles = Boolean(authData?.user.permissions?.some(code => code === '*' || code === 'veterinary.responsibles.manage'));
  const species = useQuery({ queryKey: ['veterinary', 'species'], queryFn: () => get<Choice[]>('/veterinary/species') });
  const breeds = useQuery({ queryKey: ['veterinary', 'breeds'], queryFn: () => get<Choice[]>('/veterinary/breeds') });
  const responsibles = useQuery({ queryKey: ['veterinary', 'responsibles'],
    queryFn: () => get<Responsible[]>('/veterinary/responsibles'), enabled: canManageResponsibles });

  return <div className="space-y-4">
    {addingResponsible && <div className="space-y-4">
      <RegistrationSection title="Nuevo responsable" icon={UserRound}>
      <div className="sm:col-span-2">
      <VeterinaryForm fields={[
        { key: 'name', label: 'Nombre del responsable', required: true },
        { key: 'document', label: 'Documento del responsable' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Teléfono' },
      ]} initial={{ name: responsibleName }} markRequired renderFields={fields => <div className="grid gap-4 sm:grid-cols-2">
        <RegistrationField icon={UserRound}>{fields.name}</RegistrationField>
        <RegistrationField icon={IdCard}>{fields.document}</RegistrationField>
        <RegistrationField icon={Mail}>{fields.email}</RegistrationField>
        <RegistrationField icon={Phone}>{fields.phone}</RegistrationField>
      </div>} renderActions={busy => <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" disabled={busy} onClick={() => setAddingResponsible(false)}>Volver al animal</Button>
        <Button type="submit" disabled={busy} className="bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-500 hover:to-violet-500">
          {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}{busy ? 'Guardando…' : 'Crear responsable'}
        </Button>
      </div>} onSubmit={async values => {
        const saved = await post<Responsible>('/veterinary/responsibles', { ...values, kind: 'person' });
        setResponsibleId(saved.id);
        await queryClient.invalidateQueries({ queryKey: ['veterinary', 'responsibles'] });
        setAddingResponsible(false);
      }} label="Crear responsable" />
      </div>
      </RegistrationSection>
    </div>}
    <div className={addingResponsible ? 'hidden' : 'space-y-4'}>
      {canManageResponsibles && <RegistrationSection title="Información del responsable" icon={UserRound}>
        <div className="space-y-2 sm:col-span-2">
        <label className="block text-sm font-medium" htmlFor="image-animal-responsible">Responsable <span className="font-normal text-muted-foreground">(opcional)</span></label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
          <UserRound aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-purple-500/80 dark:text-purple-200/65" />
          <select id="image-animal-responsible" aria-label="Responsable del nuevo animal" value={responsibleId} onChange={event => setResponsibleId(event.target.value)}
            className="h-11 w-full min-w-0 rounded-lg border border-purple-200 bg-white/70 pl-10 pr-3 text-base outline-none focus-visible:border-purple-400 focus-visible:ring-2 focus-visible:ring-purple-400/30 sm:h-10 sm:text-sm dark:border-purple-300/25 dark:bg-[#26233d]">
            <option value="">Responsable pendiente</option>
            {responsibles.data?.filter(party => party.is_active).map(party =>
              <option key={party.id} value={party.id}>{party.name}{party.document ? ` · ${party.document}` : ''}</option>)}
          </select>
          </div>
        <Button variant="outline" className="h-11 border-purple-300 bg-purple-50/50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 sm:h-10 dark:border-purple-400/40 dark:bg-purple-400/10 dark:text-purple-200 dark:hover:bg-purple-400/20" onClick={() => setAddingResponsible(true)}><Plus aria-hidden="true" />Nuevo responsable</Button>
        </div>
        <p className="text-xs text-muted-foreground">Podés vincular un responsable ahora o dejarlo pendiente.</p>
        </div>
      </RegistrationSection>}
      {(species.isError || breeds.isError || responsibles.isError) && <p role="alert" className="text-sm text-destructive">No se pudieron cargar todos los catálogos veterinarios.</p>}
      <VeterinaryForm fields={[
        { key: 'name', label: 'Nombre del animal', required: true, placeholder: 'Ej. Canela' },
        { key: 'species_id', label: 'Especie', type: 'select', options: species.data?.map(item => ({ value: item.id, label: item.name })) },
        { key: 'breed_id', label: 'Raza', type: 'select', options: breeds.data?.map(item => ({ value: item.id, label: item.name, parent: item.species_id })) },
        { key: 'gender', label: 'Sexo', type: 'select', required: true, options: [{ value: 'M', label: 'Macho' }, { value: 'F', label: 'Hembra' }, { value: 'O', label: 'Desconocido / otro' }] },
        { key: 'birthdate', label: 'Fecha de nacimiento', type: 'date' },
        { key: 'birthdate_estimated', label: 'Fecha de nacimiento estimada', type: 'checkbox' },
        { key: 'reproductive_status', label: 'Estado reproductivo', type: 'select', options: [{ value: 'unknown', label: 'Desconocido' }, { value: 'intact', label: 'No esterilizado' }, { value: 'neutered', label: 'Esterilizado' }] },
        { key: 'weight_kg', label: 'Peso registrado (kg)', type: 'number', placeholder: 'Ej. 12.5' },
      ]} markRequired renderFields={fields => <div className="space-y-3">
        <RegistrationSection title="Datos del animal" icon={PawPrint}>
          <RegistrationField icon={PawPrint}>{fields.name}</RegistrationField>
          <RegistrationField icon={PawPrint}>{fields.species_id}</RegistrationField>
          <RegistrationField icon={Layers}>{fields.breed_id}</RegistrationField>
          <RegistrationField icon={VenusAndMars}>{fields.gender}</RegistrationField>
        </RegistrationSection>
        <RegistrationSection title="Información adicional" icon={CalendarDays}>
          <RegistrationField icon={CalendarDays}>{fields.birthdate}</RegistrationField>
          <div className="flex min-h-11 items-center gap-2 sm:pt-5 [&>div]:flex [&>div]:flex-row-reverse [&>div]:items-center [&>div]:justify-end [&>div]:gap-2 [&>div]:space-y-0 [&_input]:m-0 [&_input]:size-4 [&_input]:shrink-0 [&_input]:accent-purple-600 [&_label]:cursor-pointer [&_label]:text-xs [&_label]:leading-5">
            {fields.birthdate_estimated}<Info aria-hidden="true" className="size-3.5 shrink-0 text-purple-500 dark:text-purple-300" />
          </div>
          <RegistrationField icon={Heart}>{fields.reproductive_status}</RegistrationField>
          <RegistrationField icon={Scale}>{fields.weight_kg}</RegistrationField>
        </RegistrationSection>
      </div>} renderActions={busy => <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="outline" disabled={busy} onClick={onCancel} className="h-11 rounded-lg border-purple-200 bg-white/60 px-6 dark:border-purple-300/20 dark:bg-white/5">Cancelar</Button>}
        <Button type="submit" disabled={busy} className="h-11 rounded-lg border border-purple-400/40 bg-gradient-to-r from-purple-500 to-violet-700 px-5 text-white shadow-lg shadow-purple-600/20 transition-shadow hover:from-purple-500 hover:to-violet-600 hover:shadow-purple-600/30">
          {busy ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}{busy ? 'Guardando…' : 'Crear animal y continuar'}
        </Button>
      </div>} initial={{ gender: 'O', reproductive_status: 'unknown', ...initial }} label="Crear animal y continuar" onSubmit={async values => {
        animalSchema.parse({ name: values.name, birthdate: values.birthdate || '', gender: values.gender });
        const animal = await post<Animal>('/patients', {
          patient_kind: 'animal', name: values.name, gender: values.gender, birthdate: values.birthdate || null,
          ...(responsibleId ? { responsible_id: responsibleId } : {}),
          veterinary: { species_id: values.species_id || null, breed_id: values.breed_id || null,
            birthdate_estimated: values.birthdate_estimated === 'true', reproductive_status: values.reproductive_status || 'unknown',
            ...(values.weight_kg ? { weight_kg: Number(values.weight_kg) } : {}) },
        });
        await queryClient.invalidateQueries({ queryKey: ['veterinary'] });
        onCreated(animal);
      }} />
    </div>
  </div>;
}
