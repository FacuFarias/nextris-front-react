import { useState } from 'react';
import './animal-registration-modal.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { isAxiosError } from 'axios';
import { Cat, Dog, Loader2, PawPrint, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AnimalRegistrationForm } from '@/modules/veterinary/AnimalRegistrationForm';
import { get } from '@/modules/veterinary/api';
import type { Animal, AnimalDicomReference } from '@/modules/veterinary/api';
import type { PacsStudy } from '../hooks/use-studies-by-location';

export function VeterinaryReassignImagesModal({ open, onOpenChange, study, onSuccess }: {
  open: boolean; onOpenChange: (open: boolean) => void; study: PacsStudy; onSuccess: () => void;
}) {
  const { authData } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Animal | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const canCreate = Boolean(authData?.user.permissions?.some(code => code === '*' || code === 'patients.manage'));
  const reassigning = study.is_linked;
  const actionTitle = reassigning ? 'Reasignar imágenes a otro animal' : 'Asignar imágenes a otro animal';
  const reference = useQuery({ queryKey: ['veterinary', 'image-animal-reference', study.pk],
    queryFn: () => get<AnimalDicomReference>(`/veterinary/image-studies/${study.pk}/animal-reference`),
    enabled: open && canCreate, staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 });
  const dicomName = (study.patient_name.split('=').find(part => part.trim()) || '')
    .replace(/\^/g, ' ').replace(/\s+/g, ' ').trim();
  const fallbackName = ['unknown', 'n/a', 'none', 'null', '—'].includes(dicomName.toLowerCase()) ? '' : dicomName;
  const animals = useQuery({ queryKey: ['veterinary', 'image-assignment', debouncedSearch, page],
    queryFn: () => get<{ data: Animal[]; total: number }>('/patients?' + new URLSearchParams({
      paginated: 'true', search: debouncedSearch, page: String(page), per_page: '10',
    })), enabled: open && !creating && !selected });
  const choose = (animal: Animal) => { setSelected(animal); setCreating(false); setConfirmed(false); setError(''); };
  const assign = async () => {
    if (!selected || !confirmed) return;
    setBusy(true); setError('');
    try {
      await api.post('/dicom/studies/reassign', { study_pk: study.pk, animal_guid: selected.guid, confirm_identity: true });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['veterinary'] }),
        queryClient.invalidateQueries({ queryKey: ['informes'] }),
        queryClient.invalidateQueries({ queryKey: ['studies-by-location'] }),
      ]);
      toast.success(reassigning ? 'Imágenes reasignadas al animal correctamente' : 'Imágenes asignadas al animal correctamente');
      onSuccess(); onOpenChange(false);
    } catch (failure) {
      const message = reassigning ? 'No se pudo reasignar el estudio' : 'No se pudo asignar el estudio';
      setError(isAxiosError(failure) ? String(failure.response?.data?.message || message) : message);
    } finally { setBusy(false); }
  };

  return <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value); }}>
    <DialogContent overlayClassName={creating ? 'bg-slate-950/60 backdrop-blur-sm' : undefined}
      className={creating
        ? 'animal-registration-modal flex max-h-[calc(100dvh-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border-purple-200 bg-gradient-to-br from-white via-purple-50/90 to-violet-100/80 p-0 shadow-[0_24px_90px_-20px_rgba(64,27,115,0.45)] sm:max-h-[calc(100dvh-3rem)] sm:max-w-[720px] sm:gap-0 sm:p-0 dark:border-purple-400/30 dark:from-[#191a30] dark:via-[#1c1931] dark:to-[#231b3d] [&>[data-slot=dialog-close]]:text-purple-700 dark:[&>[data-slot=dialog-close]]:text-purple-100'
        : 'max-h-[85vh] overflow-y-auto sm:max-w-2xl'}>
      <DialogHeader className={creating ? 'relative isolate shrink-0 overflow-hidden border-b border-purple-200/50 px-4 pb-4 pt-6 text-left sm:px-6 sm:pb-5 sm:pt-7 dark:border-purple-300/10' : undefined}>
        {creating ? <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.28),transparent_65%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-10 -z-10 hidden items-end gap-1 text-purple-500/15 sm:flex dark:text-purple-300/10">
            <Dog className="size-20 -rotate-6" /><Cat className="size-16" />
          </div>
          <div className="flex items-start gap-3.5 pr-7">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/70 bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-lg shadow-purple-600/20">
              <PawPrint aria-hidden="true" className="size-7" />
            </div>
            <div className="min-w-0 space-y-2">
              <DialogTitle className="text-lg leading-snug font-semibold tracking-tight sm:text-xl">Nuevo animal para las imágenes</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed sm:text-sm">Registrá un nuevo animal para asociarlo a estudios DICOM.</DialogDescription>
            </div>
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground" title={`Estudio: ${study.study_desc || '—'} · Acc. Nº: ${study.accession_no || '—'} · Animal en DICOM: ${study.patient_name}`}>
            Estudio: {study.study_desc || '—'} · Acc. Nº: {study.accession_no || '—'} · Animal en DICOM: {study.patient_name}
          </p>
        </> : <>
          <DialogTitle>{actionTitle}</DialogTitle>
          <DialogDescription>Estudio: {study.study_desc || '—'} · Acc. Nº: {study.accession_no || '—'} · Animal en DICOM: {study.patient_name}</DialogDescription>
        </>}
      </DialogHeader>
      {creating ? <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4 sm:px-6 sm:pb-6 sm:pt-4">
        {reference.isPending ? <div className="space-y-4">
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-4 animate-spin" />Leyendo los datos del DICOM…</p>
          <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
        </div> : <>
          <p className="text-xs leading-relaxed text-muted-foreground">Los datos disponibles se toman del DICOM como referencia. Revisalos antes de crear el animal.</p>
          {reference.isError && <p role="alert" className="text-xs text-destructive">No se pudieron leer todos los datos DICOM. Podés completar el formulario con el nombre del listado.</p>}
          {reference.data && <div className="space-y-1 text-xs text-muted-foreground">
            {reference.data.dicom.species && !reference.data.initial.species_id && <p>Especie en DICOM: {reference.data.dicom.species}</p>}
            {reference.data.dicom.breed && !reference.data.initial.breed_id && <p>Raza en DICOM: {reference.data.dicom.breed}</p>}
            {reference.data.dicom.responsible_name && <p>Responsable en DICOM: {reference.data.dicom.responsible_name}</p>}
            {reference.data.dicom.responsible_organization && <p>Organización en DICOM: {reference.data.dicom.responsible_organization}</p>}
          </div>}
          <AnimalRegistrationForm onCreated={choose} onCancel={() => setCreating(false)}
            initial={reference.data?.initial || { name: fallbackName }} responsibleName={reference.data?.dicom.responsible_name} />
        </>}
      </div> : selected ? <div className="space-y-4">
        <section className="space-y-2 rounded-lg border border-purple-300 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
          <h3 className="font-semibold">Animal de destino</h3>
          <p className="font-medium">{selected.name} · {selected.patientid}</p>
          <p className="text-sm">{selected.veterinary.species_name || 'Especie pendiente'} · {selected.veterinary.breed_name || 'Raza sin informar'}</p>
          <p className="text-sm">Responsables: {selected.responsibles.map(party => party.name).join(', ') || 'Pendiente'}</p>
        </section>
        <p className="text-sm text-muted-foreground">Se vinculará el estudio al animal seleccionado y se conservarán las imágenes originales del PACS.</p>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} disabled={busy} />
          Confirmo que las imágenes corresponden a este animal.
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => { setSelected(null); setConfirmed(false); }}>Elegir otro animal</Button>
          <Button disabled={!confirmed || busy} onClick={() => void assign()}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{busy ? (reassigning ? 'Reasignando…' : 'Asignando…') : (reassigning ? 'Reasignar al animal' : 'Asignar al animal')}</Button>
        </DialogFooter>
      </div> : <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={reassigning ? 'Buscar animal para reasignar imágenes' : 'Buscar animal para asignar imágenes'} placeholder="Animal, ID o responsable" value={search}
            onChange={event => { setSearch(event.target.value); setPage(1); }} className="pl-9" />
        </div>
        {animals.isLoading ? <p role="status" className="text-sm text-muted-foreground">Buscando animales…</p> : animals.isError ?
          <p role="alert" className="text-sm text-destructive">No se pudieron buscar los animales. <button onClick={() => void animals.refetch()} className="underline">Reintentar</button></p> :
          <div className="max-h-72 space-y-2 overflow-y-auto" aria-label="Animales disponibles">
            {animals.data?.data.map(animal => <button type="button" key={animal.guid} onClick={() => choose(animal)}
              className="w-full rounded-lg border p-3 text-left text-sm hover:border-purple-400 hover:bg-accent">
              <strong>{animal.name} · {animal.patientid}</strong>
              <span className="block text-muted-foreground">{animal.veterinary.species_name || 'Especie pendiente'} · {animal.responsibles.map(party => party.name).join(', ') || 'Responsable pendiente'}</span>
            </button>)}
            {animals.data?.data.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron animales.</p>}
          </div>}
        {(animals.data?.total || 0) > 10 && <div className="flex items-center justify-between gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page}</span><Button variant="outline" size="sm" disabled={page * 10 >= (animals.data?.total || 0)} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>}
        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          {canCreate && <Button onClick={() => setCreating(true)}><PawPrint className="mr-1 h-4 w-4" />Crear nuevo animal</Button>}
        </DialogFooter>
      </div>}
    </DialogContent>
  </Dialog>;
}
