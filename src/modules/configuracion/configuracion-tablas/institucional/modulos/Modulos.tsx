import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PrimaryButton } from '@/components';
import TablaDynamic from '@/components/TableDynamic';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TableColumn } from '@/types/table';
import { useFacilities } from '../facilities/hooks/useFacilities';
import { useModuleChangeLogs } from './hooks/useModuleChangeLogs';
import { useModulesByFacility } from './hooks/useModulesByFacility';
import type { FacilityModuleChangeLog } from './types/modules.types';

export const Modulos = () => {
  const [activeSubTab, setActiveSubTab] = useState<'configuracion' | 'historial'>('configuracion');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  const { facilities, isLoading: isFacilitiesLoading } = useFacilities();
  const { modules, isLoading: isModulesLoading, syncModules, isSyncing } = useModulesByFacility(selectedFacilityId);
  const {
    logs,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    refetch: refetchLogs,
  } = useModuleChangeLogs(selectedFacilityId, 200);

  const facilityOptions = facilities?.data ?? [];

  const historyColumns: TableColumn<FacilityModuleChangeLog>[] = useMemo(
    () => [
      {
        key: 'changed_at',
        label: 'FECHA',
        render: (value) => {
          if (!value) {
            return <span className="text-muted-foreground">-</span>;
          }

          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) {
            return String(value);
          }

          return parsed.toLocaleString('es-AR', {
            dateStyle: 'short',
            timeStyle: 'medium',
          });
        },
      },
      {
        key: 'module_code',
        label: 'MÓDULO',
        className: 'font-medium',
      },
      {
        key: 'action',
        label: 'ACCIÓN',
        render: (value) => (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
              value === 'enabled'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {value === 'enabled' ? 'Activado' : 'Desactivado'}
          </span>
        ),
      },
      {
        key: 'changed_by_username',
        label: 'USUARIO',
        render: (value) => value || '-',
      },
      {
        key: 'reason',
        label: 'MOTIVO',
        render: (value) => value || '-',
      },
      {
        key: 'request_ip',
        label: 'IP',
        render: (value) => value || '-',
      },
      {
        key: 'row_hash',
        label: 'HASH',
        render: (value) => {
          if (!value) {
            return '-';
          }
          const hashText = String(value);
          return `${hashText.slice(0, 10)}...${hashText.slice(-8)}`;
        },
      },
    ],
    [],
  );

  useEffect(() => {
    const nextDraft = modules.reduce<Record<string, boolean>>((acc, moduleItem) => {
      acc[moduleItem.module_code] = Boolean(moduleItem.is_active);
      return acc;
    }, {});

    setDraft((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextDraft);

      if (prevKeys.length !== nextKeys.length) {
        return nextDraft;
      }

      for (const key of nextKeys) {
        if (prev[key] !== nextDraft[key]) {
          return nextDraft;
        }
      }

      return prev;
    });
  }, [modules]);

  const enabledCount = Object.values(draft).filter(Boolean).length;

  const handleToggle = (moduleCode: string, checked: boolean) => {
    setDraft((prev) => ({ ...prev, [moduleCode]: checked }));
  };

  const handleSave = () => {
    setCurrentPassword('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (!currentPassword.trim()) {
      toast.error('Debe ingresar su contraseña para confirmar');
      return;
    }

    const selectedCodes = Object.entries(draft)
      .filter(([, active]) => active)
      .map(([code]) => code);

    syncModules({
      module_codes: selectedCodes,
      current_password: currentPassword,
    }, {
      onSuccess: () => {
        toast.success('Módulos actualizados exitosamente');
        setIsConfirmOpen(false);
        setCurrentPassword('');
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'No se pudieron actualizar los módulos';
        toast.error(msg);
      },
    });
  };

  const handleSelectAll = (enabled: boolean) => {
    const nextDraft = modules.reduce<Record<string, boolean>>((acc, moduleItem) => {
      acc[moduleItem.module_code] = enabled;
      return acc;
    }, {});
    setDraft(nextDraft);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-wide dark:text-foreground">Módulos por institución</h2>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap dark:text-foreground">Institución:</label>
        <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId} disabled={isFacilitiesLoading}>
          <SelectTrigger className="min-w-60">
            <SelectValue placeholder="— Seleccione una institución —" />
          </SelectTrigger>
          <SelectContent>
            {facilityOptions.map((facility) => (
              <SelectItem key={facility.guid} value={facility.guid}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeSubTab} onValueChange={(value) => setActiveSubTab(value as 'configuracion' | 'historial')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          <TabsTrigger value="historial">Historial de cambios</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracion" className="space-y-4 mt-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => handleSelectAll(false)}
              disabled={!selectedFacilityId || isModulesLoading || isSyncing}
              variant="outline"
            >
              Desactivar todo
            </Button>
            <Button
              onClick={() => handleSelectAll(true)}
              disabled={!selectedFacilityId || isModulesLoading || isSyncing}
              variant="outline"
            >
              Activar todo
            </Button>
            <PrimaryButton onClick={handleSave} disabled={!selectedFacilityId || isModulesLoading || isSyncing}>
              {isSyncing ? 'Guardando...' : 'Guardar módulos'}
            </PrimaryButton>
          </div>

          {selectedFacilityId ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              <div className="px-4 py-3 text-sm text-muted-foreground">
                {isModulesLoading ? 'Cargando módulos...' : `${enabledCount} de ${modules.length} módulos activos`}
              </div>
              {!isModulesLoading && modules.map((moduleItem) => (
                <div key={moduleItem.module_code} className="px-4 py-3 flex items-start gap-3">
                  <Checkbox
                    checked={Boolean(draft[moduleItem.module_code])}
                    onCheckedChange={(checked) => handleToggle(moduleItem.module_code, Boolean(checked))}
                    disabled={isSyncing || !moduleItem.module_active}
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{moduleItem.module_name}</p>
                    <p className="text-xs text-muted-foreground">{moduleItem.module_description || 'Sin descripción'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Seleccione una institución para activar o desactivar módulos.
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="space-y-4 mt-4">
          {selectedFacilityId ? (
            <>
              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  onClick={() => refetchLogs()}
                  disabled={isLogsLoading || isLogsFetching}
                >
                  {isLogsFetching ? 'Actualizando...' : 'Actualizar historial'}
                </Button>
              </div>
              <TablaDynamic
                data={logs}
                columns={historyColumns}
                loading={isLogsLoading}
                emptyMessage="No hay cambios registrados para esta institución."
              />
            </>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              Seleccione una institución para visualizar el historial de cambios.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cambios de módulos</DialogTitle>
            <DialogDescription>
              Para activar o desactivar módulos debe ingresar su contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contraseña actual</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Ingrese su contraseña"
              autoComplete="current-password"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmOpen(false);
                setCurrentPassword('');
              }}
              disabled={isSyncing}
            >
              Cancelar
            </Button>
            <PrimaryButton onClick={handleConfirmSave} disabled={isSyncing}>
              {isSyncing ? 'Validando...' : 'Confirmar y guardar'}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
