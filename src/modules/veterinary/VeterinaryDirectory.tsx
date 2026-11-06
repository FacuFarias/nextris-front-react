import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { PawPrint, Users, Plus, SlidersHorizontal, RefreshCcw, X } from 'lucide-react';
import TablaDynamic from '@/components/TableDynamic';
import { InputSearch } from '@/components/InputSearch';
import { Button } from '@/components/ui/button';
import type { TableColumn } from '@/types/table';
import tableBackground from '@/assets/patients.jpg';
import tableBackgroundDark from '@/assets/back-dark.jpg';
import { get } from './api';
import type { Animal, Choice, Responsible } from './api';

type Page<T> = { data: T[]; page: number; per_page: number; total: number };
type Filters = Record<string, string>;
type AnimalRow = Animal & { species_name: string; breed_name: string; responsible_names: string; weight_kg: number | null };
type ResponsibleRow = Responsible & { kind_label: string; status_label: string };
const controlClass = 'h-9 w-full min-w-0 rounded-md border border-purple-300 bg-background px-2 text-sm text-foreground dark:border-purple-700';

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground"><span>{label}</span><select aria-label={label} className={controlClass} value={value} onChange={e => onChange(e.target.value)}>{children}</select></label>;
}

function useDirectory<T>(path: string, kind: string) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [columns, setColumns] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sort, setSort] = useState({ column: 'name', direction: 'asc' as 'asc' | 'desc' });
  const [resetKey, setResetKey] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const debouncedSearch = useDebounce(search, 300);
  const debouncedColumns = useDebounce(columns, 300);
  const queryString = new URLSearchParams({ paginated: 'true', page: String(page), per_page: String(perPage), search: debouncedSearch, sort_column: sort.column, sort_direction: sort.direction });
  Object.entries(filters).forEach(([key, value]) => { if (value) queryString.set(key, value); });
  Object.entries(debouncedColumns).forEach(([key, value]) => { if (value) queryString.set('filter_' + key, value); });
  const query = useQuery({ queryKey: ['veterinary', kind, 'directory', queryString.toString()], queryFn: () => get<Page<T>>(path + '?' + queryString) });
  const changeFilter = (key: string, value: string) => { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); };
  const clear = () => { setSearch(''); setFilters({}); setColumns({}); setPage(1); setResetKey(key => key + 1); };
  const activeCount = Object.values(filters).filter(Boolean).length + Object.values(columns).filter(Boolean).length + (search.trim() ? 1 : 0);
  return { query, search, changeSearch: (value: string) => { setSearch(value); setPage(1); }, filters, changeFilter, page, setPage, perPage, changePerPage: (value: number) => { setPerPage(value); setPage(1); }, sort, changeSort: (column: string, direction: 'asc' | 'desc') => { setSort({ column, direction }); setPage(1); }, changeColumns: (value: Filters) => { setColumns(value); setPage(1); }, clear, resetKey, showFilters, setShowFilters, activeCount };
}

function DirectoryToolbar({ title, count, search, changeSearch, showFilters, toggleFilters, activeCount, refresh, refreshing, clear, onCreate, createLabel, children }: {
  title: string; count: number; search: string; changeSearch: (value: string) => void; showFilters: boolean; toggleFilters: () => void; activeCount: number; refresh: () => void; refreshing: boolean; clear: () => void; onCreate?: () => void; createLabel: string; children: ReactNode;
}) {
  return <>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-medium text-foreground">{title} <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-brand-purple dark:bg-purple-950 dark:text-purple-300">{count}</span></p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={refresh} aria-label="Actualizar listado"><RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></Button>
        <Button size="sm" variant="outline" onClick={toggleFilters} aria-expanded={showFilters} aria-controls="directory-filters"><SlidersHorizontal className="h-4 w-4" />Filtros{activeCount > 0 && <span className="rounded-full bg-brand-purple px-1.5 text-xs text-white">{activeCount}</span>}</Button>
        {onCreate && <Button size="sm" className="bg-brand-purple text-white hover:bg-brand-purple/90" onClick={onCreate}><Plus className="h-4 w-4" />{createLabel}</Button>}
      </div>
    </div>
    {showFilters && <section id="directory-filters" aria-label="Filtros del listado" className="report-filters-panel mb-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between"><span className="report-filters-panel__heading text-[11px] font-semibold uppercase tracking-wide text-gray-500">Filtros</span><button type="button" onClick={clear} disabled={!activeCount} className="flex items-center gap-1 text-xs text-brand-purple disabled:opacity-40 dark:text-purple-300"><X className="h-3 w-3" />Limpiar filtros</button></div>
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="min-w-0 text-xs text-muted-foreground sm:col-span-2"><span className="mb-1 block">Búsqueda</span><InputSearch searchTerm={search} setSearchTerm={changeSearch} placeholder={title === 'Animales' ? 'Nombre, ID del animal o responsable' : 'Nombre, documento, email o teléfono'} /></label>{children}</div>
    </section>}
  </>;
}

const animalColumns: TableColumn<AnimalRow>[] = [
  { key: 'patientid', hideOnMobile: true, label: 'ID animal', sortable: true, filterable: true, render: (_value, row) => <span className="font-medium text-brand-purple dark:text-purple-300">{row.patientid}</span> },
  { key: 'name', label: 'Nombre', sortable: true, filterable: true },
  { key: 'species_name', label: 'Especie', sortable: true, filterable: true, render: (_value, row) => row.species_name || 'Por definir' },
  { key: 'breed_name', hideOnMobile: true, label: 'Raza', sortable: true, filterable: true, render: (_value, row) => row.breed_name || 'Sin informar' },
  { key: 'weight_kg', hideOnMobile: true, label: 'Peso (kg)', sortable: true, render: (_value, row) => row.weight_kg ?? '—' },
  { key: 'responsible_names', hideOnMobile: true, label: 'Responsables', sortable: true, filterable: true, render: (_value, row) => row.responsible_names || <span className="text-muted-foreground">Pendiente</span> },
  { key: 'study_count', hideOnMobile: true, label: 'Estudios', sortable: true },
];
const responsibleColumns: TableColumn<ResponsibleRow>[] = [
  { key: 'name', label: 'Nombre / razón social', sortable: true, filterable: true },
  { key: 'document', hideOnMobile: true, label: 'Documento', sortable: true, filterable: true },
  { key: 'email', hideOnMobile: true, label: 'Email', sortable: true, filterable: true },
  { key: 'phone', hideOnMobile: true, label: 'Teléfono', sortable: true, filterable: true },
  { key: 'kind_label', hideOnMobile: true, label: 'Tipo', sortable: true, filterable: true },
  { key: 'status_label', label: 'Estado', sortable: true, filterable: true, render: (_value, row) => <span className={`rounded-full px-2 py-1 text-xs ${row.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{row.status_label}</span> },
];

export function AnimalDirectory({ species, breeds, onSelect, onCreate }: { species: Choice[]; breeds: Choice[]; onSelect: (animal: Animal) => void; onCreate?: () => void }) {
  const d = useDirectory<Animal>('/patients', 'patients');
  const rows: AnimalRow[] = (d.query.data?.data || []).map(animal => ({ ...animal, species_name: animal.veterinary.species_name || '', breed_name: animal.veterinary.breed_name || '', responsible_names: animal.responsibles.map(r => r.name).join(', '), weight_kg: animal.veterinary.weight_kg }));
  return <div className="flex min-h-0 flex-1 flex-col">
    <DirectoryToolbar title="Animales" count={d.query.data?.total || 0} search={d.search} changeSearch={d.changeSearch} showFilters={d.showFilters} toggleFilters={() => d.setShowFilters(!d.showFilters)} activeCount={d.activeCount} refresh={() => void d.query.refetch()} refreshing={d.query.isFetching} clear={d.clear} onCreate={onCreate} createLabel="Nuevo animal">
      <FilterSelect label="Especie" value={d.filters.species_id || ''} onChange={value => { d.changeFilter('species_id', value); d.changeFilter('breed_id', ''); }}><option value="">Todas las especies</option>{species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</FilterSelect>
      <FilterSelect label="Raza" value={d.filters.breed_id || ''} onChange={value => d.changeFilter('breed_id', value)}><option value="">Todas las razas</option>{breeds.filter(b => !d.filters.species_id || b.species_id === d.filters.species_id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</FilterSelect>
      <FilterSelect label="Responsable" value={d.filters.responsible_status || ''} onChange={value => d.changeFilter('responsible_status', value)}><option value="">Todos los animales</option><option value="linked">Con responsable</option><option value="pending">Responsable pendiente</option></FilterSelect>
    </DirectoryToolbar>
    {d.query.isError && <p role="alert" className="mb-2 text-sm text-destructive">No se pudo cargar el listado. Intente actualizarlo.</p>}
    <TablaDynamic<AnimalRow> key={d.resetKey} data={rows} columns={animalColumns} allColumns={animalColumns} loading={d.query.isLoading} refreshing={d.query.isFetching && !d.query.isLoading} refreshError={d.query.isError} emptyMessage="No se encontraron animales con estos filtros." serverSideFiltering onColumnFiltersChange={d.changeColumns} sortColumn={d.sort.column} sortDirection={d.sort.direction} onSortChange={d.changeSort} pagination={{ page: d.page, pageSize: d.perPage, total: d.query.data?.total || 0 }} onPaginationChange={d.setPage} perPageValue={d.perPage} onPerPageChange={d.changePerPage} perPageOptions={[10, 20, 50, 100]} tableBackgroundImage={tableBackground} tableBackgroundImageDark={tableBackgroundDark} onRowClick={onSelect} actions={[{ label: 'Ver ficha', icon: <PawPrint className="h-4 w-4" />, onClick: onSelect }]} />
  </div>;
}

export function ResponsibleDirectory({ onSelect, onCreate }: { onSelect: (party: Responsible) => void; onCreate: () => void }) {
  const d = useDirectory<ResponsibleRow>('/veterinary/responsibles', 'responsibles');
  return <div className="flex min-h-0 flex-1 flex-col">
    <DirectoryToolbar title="Responsables" count={d.query.data?.total || 0} search={d.search} changeSearch={d.changeSearch} showFilters={d.showFilters} toggleFilters={() => d.setShowFilters(!d.showFilters)} activeCount={d.activeCount} refresh={() => void d.query.refetch()} refreshing={d.query.isFetching} clear={d.clear} onCreate={onCreate} createLabel="Nuevo responsable">
      <FilterSelect label="Tipo de responsable" value={d.filters.kind || ''} onChange={value => d.changeFilter('kind', value)}><option value="">Todos los tipos</option><option value="person">Persona</option><option value="organization">Organización</option></FilterSelect>
      <FilterSelect label="Estado del responsable" value={d.filters.is_active || ''} onChange={value => d.changeFilter('is_active', value)}><option value="">Todos los estados</option><option value="true">Activo</option><option value="false">Inactivo</option></FilterSelect>
    </DirectoryToolbar>
    {d.query.isError && <p role="alert" className="mb-2 text-sm text-destructive">No se pudo cargar el listado. Intente actualizarlo.</p>}
    <TablaDynamic<ResponsibleRow> key={d.resetKey} data={d.query.data?.data || []} columns={responsibleColumns} allColumns={responsibleColumns} rowIdKey="id" loading={d.query.isLoading} refreshing={d.query.isFetching && !d.query.isLoading} refreshError={d.query.isError} emptyMessage="No se encontraron responsables con estos filtros." serverSideFiltering onColumnFiltersChange={d.changeColumns} sortColumn={d.sort.column} sortDirection={d.sort.direction} onSortChange={d.changeSort} pagination={{ page: d.page, pageSize: d.perPage, total: d.query.data?.total || 0 }} onPaginationChange={d.setPage} perPageValue={d.perPage} onPerPageChange={d.changePerPage} perPageOptions={[10, 20, 50, 100]} tableBackgroundImage={tableBackground} tableBackgroundImageDark={tableBackgroundDark} onRowClick={onSelect} actions={[{ label: 'Ver responsable', icon: <Users className="h-4 w-4" />, onClick: onSelect }]} />
  </div>;
}
