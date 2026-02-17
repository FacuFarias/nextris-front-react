import { useState } from 'react';
import { ClipboardList, User, Building2, Stethoscope } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrimaryButton } from '@/components/PrimaryButton';
import { toast } from 'sonner';
import { useCrearCita } from '../hooks/use-crear-cita';
import { useMedicosPorLocacion, useObrasSocialesPorLocacion } from '@/hooks/use-global';

interface PrestacionProps {
    selectedPatient: any;
    selectedDireccion: string;
    allEvents: { [equipoGuid: string]: any[] };
    onSuccess?: () => void;
}

interface EventConfig {
    eventId: string;
    physician_id: string;
    obra_social_id: string;
}

export const Prestacion: React.FC<PrestacionProps> = ({
    selectedPatient,
    selectedDireccion,
    allEvents,
    onSuccess
}) => {
    const [eventConfigs, setEventConfigs] = useState<{ [eventId: string]: EventConfig }>({});

    // Obtener médicos y obras sociales
    const { data: medicos, isLoading: isLoadingMedicos } = useMedicosPorLocacion(selectedDireccion);
    const { data: obrasSociales, isLoading: isLoadingObrasSociales } = useObrasSocialesPorLocacion(selectedDireccion);
    const crearCitaMutation = useCrearCita();

    // Obtener todos los eventos de usuario (no bloqueados)
    const userEvents = Object.values(allEvents)
        .flat()
        .filter(ev => !ev.extendedProps?.blocked);

    const handlePhysicianChange = (eventId: string, physicianId: string) => {
        setEventConfigs(prev => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                eventId,
                physician_id: physicianId,
                obra_social_id: prev[eventId]?.obra_social_id || ''
            }
        }));
    };

    const handleObraSocialChange = (eventId: string, obraSocialId: string) => {
        setEventConfigs(prev => ({
            ...prev,
            [eventId]: {
                ...prev[eventId],
                eventId,
                physician_id: prev[eventId]?.physician_id || '',
                obra_social_id: obraSocialId
            }
        }));
    };

    const handleSubmit = () => {
        // Médico y obra social son opcionales

        // Formatear datos para el backend
        const calendar_events = userEvents.map(ev => {
            const config = eventConfigs[ev.id];
            const startDate = new Date(ev.start);
            const endDate = new Date(ev.end);

            return {
                exam_id: ev.extendedProps?.study?.guid,
                start_datetime: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
                end_datetime: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
                physician_id: config?.physician_id || null,
                obra_social_id: config?.obra_social_id || null,
                equipment_id: ev.extendedProps?.equipo?.guid
            };
        });

        const appointmentData = {
            patient_id: selectedPatient.guid,
            appointment_type: 'equipment',
            location_id: selectedDireccion,
            calendar_events
        };
        crearCitaMutation.mutate(appointmentData, {
            onSuccess: () => {
                toast.success('Citas creadas exitosamente');
                if (onSuccess) onSuccess();
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Error al crear las citas');
            }
        });
    };

    const allConfigured = userEvents.length > 0;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-purple-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-brand-purple" />
                    <h3 className="text-lg font-semibold text-gray-800">
                        Configurar Prestaciones
                    </h3>
                </div>

                <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4 text-brand-purple" />
                        <span className="font-semibold">Paciente:</span>
                        <span>{selectedPatient?.name} {selectedPatient?.surname}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {userEvents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay estudios agendados
                        </div>
                    ) : (
                        userEvents.map((ev, idx) => {
                            const config = eventConfigs[ev.id] || {};
                            const isComplete = config.physician_id || config.obra_social_id;

                            return (
                                <div
                                    key={ev.id || idx}
                                    className={`bg-white border-2 rounded-lg shadow-sm p-4 transition-all ${isComplete ? 'border-green-300 bg-green-50' : 'border-purple-200'
                                        }`}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Información del estudio */}
                                        <div className="space-y-2">
                                            <div className="font-bold text-brand-purple text-lg flex items-center gap-2">
                                                <Stethoscope className="w-5 h-5" />
                                                {ev.extendedProps?.study?.description}
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>
                                                    <span className="font-semibold">Código:</span>{' '}
                                                    {ev.extendedProps?.study?.externalcode}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Equipo:</span>{' '}
                                                    {ev.extendedProps?.equipo?.description}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Inicio:</span>{' '}
                                                    {new Date(ev.start).toLocaleString('es-ES', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                        hour12: false
                                                    })}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Fin:</span>{' '}
                                                    {new Date(ev.end).toLocaleString('es-ES', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short',
                                                        hour12: false
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selección de médico y obra social */}
                                        <div className="space-y-3">
                                            {/* Select de Médico */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-brand-purple" />
                                                    Médico Solicitante
                                                </label>
                                                <Select
                                                    value={config.physician_id || ''}
                                                    onValueChange={(value) => handlePhysicianChange(ev.id, value)}
                                                    disabled={isLoadingMedicos}
                                                >
                                                    <SelectTrigger className="w-full py-6 border-2 border-gray-300 focus:border-brand-purple">
                                                        <SelectValue placeholder="Seleccione médico..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {medicos && medicos.length > 0 ? (
                                                            medicos.map((medico: any) => (
                                                                <SelectItem key={medico.guid} value={medico.guid}>
                                                                    {medico.description}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="no-data" disabled>
                                                                No hay médicos disponibles
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Select de Obra Social */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-brand-purple" />
                                                    Obra Social
                                                </label>
                                                <Select
                                                    value={config.obra_social_id || ''}
                                                    onValueChange={(value) => handleObraSocialChange(ev.id, value)}
                                                    disabled={isLoadingObrasSociales}
                                                >
                                                    <SelectTrigger className="w-full py-6 border-2 border-gray-300 focus:border-brand-purple">
                                                        <SelectValue placeholder="Seleccione obra social..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {obrasSociales && obrasSociales.length > 0 ? (
                                                            obrasSociales.map((obraSocial: any) => (
                                                                <SelectItem key={obraSocial.guid} value={obraSocial.guid}>
                                                                    {obraSocial.description}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <SelectItem value="no-data" disabled>
                                                                No hay obras sociales disponibles
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {isComplete && (
                                        <div className="mt-2 text-xs text-green-700 font-semibold flex items-center gap-1">
                                            ✓ Configuración completa
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {userEvents.length > 0 && (
                    <div className="mt-6 flex justify-end gap-3">
                        <div className="text-sm text-gray-600">
                            {Object.keys(eventConfigs).filter(id => {
                                const config = eventConfigs[id];
                                return config?.physician_id || config?.obra_social_id;
                            }).length} / {userEvents.length} configurados
                        </div>
                        <PrimaryButton
                            onClick={handleSubmit}
                            disabled={!allConfigured || crearCitaMutation.isPending}
                        >
                            {crearCitaMutation.isPending ? 'Creando...' : 'Crear Citas'}
                        </PrimaryButton>
                    </div>
                )}
            </div>
        </div>
    );
};
