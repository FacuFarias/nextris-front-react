import React, { useRef, useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { Draggable } from '@fullcalendar/interaction'
import { ClipboardList, GripVertical, Monitor, Calendar } from 'lucide-react'
import { useEquiposPorLocacion } from '@/hooks/use-global'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PrimaryButton } from '@/components/PrimaryButton';
import { toast } from 'sonner'
import { useCalendarEventos } from '../hooks/use-calendar-eventos'

interface AgendaProps {
    selectedPatient: any;
    selectedEstudios: any[];
    selectedEquipo: any;
    onAgendaSelected: (agenda: any) => void;
    selectedDireccion: string;
    setAllEvents?: React.Dispatch<React.SetStateAction<{ [equipoGuid: string]: any[] }>>;
    allEvents?: { [equipoGuid: string]: any[] };
    onGoNext?: () => void;
}

export const Agenda: React.FC<AgendaProps & { onGoNext?: () => void; isGoNextDisabled?: boolean }> = ({
    selectedPatient,
    selectedEstudios,
    selectedEquipo,
    onAgendaSelected,
    selectedDireccion,
    setAllEvents = () => { },
    allEvents = {},
    onGoNext = () => { }

}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<FullCalendar>(null);
    // Eventos globales por equipo
    // Eventos visibles en el calendario (solo del equipo seleccionado)
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEquipoLocal, setSelectedEquipoLocal] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const calendarEventosMutation = useCalendarEventos();
    const [horariosDisponibles, setHorariosDisponibles] = useState<any[]>([]);
    const [blockedEventsByEquipo, setBlockedEventsByEquipo] = useState<{ [equipoGuid: string]: any[] }>({});
    const [estudiosAgendados, setEstudiosAgendados] = useState<Set<string>>(new Set());
    // Obtener equipos por locación
    const { data: equipos, isLoading: isLoadingEquipos } = useEquiposPorLocacion(selectedDireccion);
    // Obtener el equipo completo seleccionado
    const equipoSeleccionado = React.useMemo(() => {
        if (!selectedEquipoLocal || !equipos) return null;
        return equipos.find((eq: any) => eq.guid === selectedEquipoLocal);
    }, [selectedEquipoLocal, equipos]);
    // Obtener modalidades únicas de los estudios seleccionados
    const modalidadesSeleccionadas = React.useMemo(() => {
        if (!selectedEstudios || selectedEstudios.length === 0) return [];
        const modalidades = selectedEstudios.map((estudio: any) => estudio.modalityName).filter(Boolean);
        return [...new Set(modalidades)]; // Eliminar duplicados
    }, [selectedEstudios]);
    // Filtrar equipos por las modalidades de los estudios seleccionados
    const equiposFiltrados = React.useMemo(() => {
        if (!equipos || modalidadesSeleccionadas.length === 0) return [];
        return equipos.filter((equipo: any) =>
            modalidadesSeleccionadas.includes(equipo.modality)
        );
    }, [equipos, modalidadesSeleccionadas]);

    // Seleccionar automáticamente el equipo si solo hay uno disponible
    useEffect(() => {
        if (equiposFiltrados.length === 1 && !selectedEquipoLocal) {
            const unicoEquipo = equiposFiltrados[0];
            handleEquipoChange(unicoEquipo.guid);
        }
    }, [equiposFiltrados]);

    // Sincronizar estudiosAgendados con los eventos existentes cuando se monta o cambia allEvents
    useEffect(() => {
        const todosLosEventos = Object.values(allEvents).flat();
        const estudiosEnCalendario = new Set<string>();

        todosLosEventos.forEach((evento: any) => {
            if (evento?.extendedProps?.study) {
                const studyId = evento.extendedProps.study.guid || evento.extendedProps.study.externalcode;
                estudiosEnCalendario.add(studyId);
            }
        });

        setEstudiosAgendados(estudiosEnCalendario);
    }, [allEvents]);

    // Sincronizar events con allEvents y blockedEventsByEquipo cuando cambian
    useEffect(() => {
        if (selectedEquipoLocal) {
            const userEvents = allEvents[selectedEquipoLocal] || [];
            const blocked = blockedEventsByEquipo[selectedEquipoLocal] || [];
            setEvents([...userEvents, ...blocked]);
        }
    }, [allEvents, blockedEventsByEquipo, selectedEquipoLocal]);

    // Inicializar draggable para los estudios (solo los activos)
    useEffect(() => {
        if (containerRef.current) {
            const draggable = new Draggable(containerRef.current, {
                itemSelector: '.draggable-study:not(.disabled-study)',
                eventData: function (eventEl) {
                    const studyData = eventEl.getAttribute('data-study');
                    if (studyData) {
                        const study = JSON.parse(studyData);
                        if (!equipoSeleccionado) {
                            toast.error("Debe seleccionar un equipo antes de agendar un estudio.");
                            return null;
                        }
                        // Solo guardar los campos esenciales del equipo
                        const equipoSimple = equipoSeleccionado
                            ? {
                                guid: equipoSeleccionado.guid,
                                description: equipoSeleccionado.description,
                                modalityName: equipoSeleccionado.modalityName
                            }
                            : null;
                        return {
                            title: `${study.externalcode} - ${study.description}`,
                            duration: '01:00', // duración por defecto de 1 hora
                            extendedProps: {
                                study: study,
                                patient: selectedPatient,
                                equipo: equipoSimple
                            },
                            backgroundColor: '#8b5cf6',
                            borderColor: '#7c3aed'
                        };
                    }
                    return null;
                }
            });

            return () => {
                draggable.destroy();
            };
        }
    }, [selectedEstudios, selectedPatient, equipoSeleccionado]);

    const handleDateSelect = (selectInfo: any) => {
        const { start, end, allDay } = selectInfo;
        onAgendaSelected({
            start,
            end,
            allDay,
            patient: selectedPatient,
            estudios: selectedEstudios,
            equipo: selectedEquipo
        });
    };

    // Función para verificar si hay solapamiento entre dos eventos
    const checkEventOverlap = (newStart: Date, newEnd: Date, existingEvents: any[]) => {
        return existingEvents.some(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            // Verifica si hay cualquier tipo de solapamiento
            return (newStart < eventEnd && newEnd > eventStart);
        });
    };

    const handleEventReceive = (info: any) => {
        // Obtener los datos del elemento draggable
        const draggedEl = info.draggedEl;
        const studyData = draggedEl.getAttribute('data-study');

        if (studyData) {
            const study = JSON.parse(studyData);
            const startDate = info.date;
            const endDate = new Date(info.date.getTime() + 60 * 60 * 1000); // +1 hora

            // Verificar si hay solapamiento con eventos existentes
            if (checkEventOverlap(startDate, endDate, events)) {
                toast.error("No se puede agendar aquí porque se solapa con otro evento existente.");
                if (info && typeof info.revert === 'function') info.revert();
                return;
            }

            // Validar horario permitido
            if (horariosDisponibles && horariosDisponibles.length > 0) {
                const jsDay = startDate.getDay();
                const dia = jsDay === 0 ? 7 : jsDay;
                const horario = horariosDisponibles.find((h: any) => h.day === dia);
                if (horario) {
                    const [startHour, startMin, startSec] = horario.start.split(":").map(Number);
                    const [endHour, endMin, endSec] = horario.end.split(":").map(Number);
                    const startAllowed = new Date(startDate);
                    startAllowed.setHours(startHour, startMin, startSec || 0, 0);
                    const endAllowed = new Date(startDate);
                    endAllowed.setHours(endHour, endMin, endSec || 0, 0);
                    if (startDate < startAllowed || endDate > endAllowed) {
                        toast.error("El horario seleccionado está fuera del rango permitido para este equipo.");
                        if (info && typeof info.revert === 'function') info.revert();
                        return;
                    }
                }
            }

            // Buscar el equipo seleccionado actual (por si FullCalendar lo perdió)
            let equipoSimple = null;
            if (equipoSeleccionado) {
                equipoSimple = {
                    guid: equipoSeleccionado.guid,
                    description: equipoSeleccionado.description,
                    modalityName: equipoSeleccionado.modalityName,
                    title: equipoSeleccionado.aeTitle
                };
            } else if (selectedEquipoLocal && Array.isArray(equipos)) {
                const eq = equipos.find((e: any) => e.guid === selectedEquipoLocal);
                if (eq) {
                    equipoSimple = {
                        guid: eq.guid,
                        description: eq.description,
                        modalityName: eq.modalityName,
                        title: eq.aeTitle

                    };
                }
            }

            const eventData = {
                id: Date.now().toString(),
                title: `${study.externalcode} - ${study.description}`,
                start: startDate,
                end: endDate,
                extendedProps: {
                    study: study,
                    patient: selectedPatient,
                    equipo: equipoSimple,
                    blocked: false
                },
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed'
            };

            // Guardar evento en el equipo correspondiente
            setAllEvents(prev => {
                const equipoId = selectedEquipoLocal;
                const prevEvents = prev[equipoId] || [];
                return { ...prev, [equipoId]: [...prevEvents, eventData] };
            });

            // Trackear el estudio como agendado
            setEstudiosAgendados(prev => {
                const newSet = new Set(prev);
                newSet.add(study.guid || study.externalcode);

                // Verificar si todos los estudios están agendados
                const totalEstudios = selectedEstudios.length;
                const agendados = newSet.size;

                if (agendados === totalEstudios) {
                    toast.success('¡Todos los estudios han sido agendados!', {
                        description: `${agendados} de ${totalEstudios} estudios ubicados en el calendario`,
                        duration: 4000
                    });
                } else {
                    toast.success(`Estudio agendado (${agendados}/${totalEstudios})`, {
                        description: `${study.externalcode} - ${study.description}`,
                        duration: 3000
                    });
                }

                return newSet;
            });
        }
    };

    const handleEventDrop = (info: any) => {
        // Cuando se mueve un evento existente
        const movedEvent = info.event;
        const newStart = movedEvent.start;
        const newEnd = movedEvent.end || new Date(newStart.getTime() + 60 * 60 * 1000);

        // Verificar solapamiento con otros eventos (excluyendo el que se está moviendo)
        const otherEvents = events.filter(ev => ev.id !== movedEvent.id);
        if (checkEventOverlap(newStart, newEnd, otherEvents)) {
            toast.error("No se puede mover aquí porque se solapa con otro evento.");
            info.revert();
            return;
        }

        // Actualizar el evento en el estado
        const eventId = movedEvent.id;
        const updatedEvent = {
            id: eventId,
            title: movedEvent.title,
            start: newStart,
            end: newEnd,
            extendedProps: movedEvent.extendedProps,
            backgroundColor: movedEvent.backgroundColor,
            borderColor: movedEvent.borderColor
        };

        setEvents(prev => prev.map(ev => ev.id === eventId ? updatedEvent : ev));
        setAllEvents(prev => {
            const equipoId = selectedEquipoLocal;
            const prevEvents = prev[equipoId] || [];
            return {
                ...prev,
                [equipoId]: prevEvents.map(ev => ev.id === eventId ? updatedEvent : ev)
            };
        });
    };



    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        if (calendarRef.current && date) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.gotoDate(date);
        }
    };

    // Nueva función para manejar la selección de equipo
    const handleEquipoChange = (equipoGuid: string) => {
        setSelectedEquipoLocal(equipoGuid);
        // Buscar el equipo seleccionado
        const equipo = equipos?.find((eq: any) => eq.guid === equipoGuid);
        if (equipo) {
            const payload = {
                equipment_aetitle: equipo.aeTitle,
                guid: equipo.guid
            };
            calendarEventosMutation.mutate({ data: payload }, {
                onSuccess: (data: any) => {
                    setHorariosDisponibles(data?.data?.work_hours || []);
                    if (Array.isArray(data?.data?.events)) {
                        const backendEvents = data.data.events.map((ev: any) => ({
                            ...ev,
                            editable: false,
                            overlap: false,
                            backgroundColor: '#1e2939',
                            borderColor: '#1e2939',
                            extendedProps: {
                                ...(ev.extendedProps || {}),
                                blocked: true
                            }
                        }));
                        setBlockedEventsByEquipo(prev => ({
                            ...prev,
                            [equipoGuid]: backendEvents
                        }));
                    }
                }
            });
        }
    };
    // Calcular slotMinTime y slotMaxTime dinámicamente según horariosDisponibles
    // Fijar el rango de horario del calendario siempre de 05:00 a 22:00
    let slotMinTime = "05:00:00";
    let slotMaxTime = "23:00:00";

    // Convertir horariosDisponibles a formato businessHours de FullCalendar
    const businessHours = React.useMemo(() => {
        if (!horariosDisponibles || horariosDisponibles.length === 0) return undefined;
        return horariosDisponibles.map((horario: any) => {
            // day: 1=Lunes, 7=Domingo en nuestro backend
            // FullCalendar: 0=Domingo, 1=Lunes, 6=Sábado
            const fcDay = horario.day === 7 ? 0 : horario.day;
            return {
                daysOfWeek: [fcDay],
                startTime: horario.start,
                endTime: horario.end
            };
        });
    }, [horariosDisponibles]);

    // Estado para mostrar/agrupar los eventos de usuario actuales (no bloqueados)
    const userEvents = events.filter(ev => !ev.extendedProps?.blocked);
    // Botón habilitado solo si hay al menos un evento de usuario
    const canGoNext = userEvents.length > 0;

    return (
        <div className="space-y-6">
            {/* Tarjeta principal con layout solicitado */}
            <div className="bg-white rounded-lg border border-purple-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-brand-purple" />
                    <h3 className="text-lg font-semibold text-gray-800">
                        Agenda de equipos y estudios
                    </h3>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Columna izquierda */}
                    <div className="flex flex-col gap-6 w-full md:w-80 max-w-xs">
                        {/* Select de Equipo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Equipos disponibles
                            </label>
                            <Select
                                onValueChange={handleEquipoChange}
                                value={selectedEquipoLocal}
                                disabled={isLoadingEquipos || equiposFiltrados.length === 0}
                            >
                                <SelectTrigger className="w-full h-11! border-2 border-gray-300 focus:border-brand-purple focus:ring-brand-purple bg-white text-base">
                                    <SelectValue placeholder={
                                        isLoadingEquipos
                                            ? "Cargando equipos..."
                                            : equiposFiltrados.length === 0
                                                ? "No hay equipos disponibles"
                                                : "Seleccione un equipo..."
                                    } />
                                </SelectTrigger>
                                <SelectContent className=''>
                                    {equiposFiltrados && equiposFiltrados.length > 0 ? (
                                        equiposFiltrados.map((equipo: any) => (
                                            <SelectItem key={equipo.guid} value={equipo.guid}>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{equipo.description}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {equipo.modalityName}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-data" disabled>
                                            No hay equipos disponibles
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Input de fecha deseada */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-brand-purple" />
                                Fecha deseada
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="w-full h-11 px-4 border-2 border-gray-300 rounded-lg focus:border-brand-purple focus:ring-2 focus:ring-brand-purple focus:outline-none bg-white text-gray-700 text-base"
                            />
                        </div>
                        {/* Modalidades seleccionadas */}
                        {modalidadesSeleccionadas.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs text-gray-600">Modalidades:</span>
                                {modalidadesSeleccionadas.map((modalidad, index) => (
                                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
                                        {modalidad}
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* Panel de estudios seleccionados */}
                        {selectedEstudios && selectedEstudios.length > 0 && (
                            <div className="bg-gray-50 rounded-lg border border-purple-100 shadow-sm p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <ClipboardList className="w-5 h-5 text-brand-purple" />
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Estudios a mover ({selectedEstudios.length})
                                    </h3>
                                    {estudiosAgendados.size > 0 && (
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${estudiosAgendados.size === selectedEstudios.length
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {estudiosAgendados.size}/{selectedEstudios.length} agendados
                                        </span>
                                    )}
                                </div>
                                <div ref={containerRef} className="flex flex-wrap gap-3">
                                    {selectedEstudios.map((estudio: any, index: number) => {
                                        const isActive = equipoSeleccionado ? estudio.modalityName === equipoSeleccionado.modality : true;
                                        const isAgendado = estudiosAgendados.has(estudio.guid || estudio.externalcode);
                                        const baseClasses = "draggable-study inline-flex items-center gap-2 rounded-lg px-4 py-3";
                                        const activeClasses = isAgendado
                                            ? "disabled-study bg-blue-50 border-2 border-blue-500 cursor-not-allowed"
                                            : isActive
                                                ? "bg-green-50 border-2 border-green-500 cursor-move hover:bg-green-100 hover:border-green-600 hover:shadow-md"
                                                : "disabled-study bg-gray-100 border-2 border-gray-300 cursor-not-allowed opacity-60";
                                        return (
                                            <div
                                                key={estudio.guid || index}
                                                className={`${baseClasses} ${activeClasses}`}
                                                data-study={JSON.stringify(estudio)}
                                            >
                                                <GripVertical className={`w-5 h-5 ${isAgendado ? 'text-blue-600' : isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-bold ${isAgendado ? 'text-blue-700' : isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                                            {estudio.externalcode}
                                                        </span>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${isAgendado
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {estudio.modalityName}
                                                        </span>
                                                        {isAgendado && (
                                                            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs mt-1 ${isAgendado ? 'text-blue-700' : isActive ? 'text-gray-700' : 'text-gray-500'}`}>
                                                        {estudio.description}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Columna derecha: calendario grande */}
                    <div className="flex-1 min-w-0">
                        {selectedEquipoLocal ? (
                            <div className="h-[600px] w-full">
                                <div className="flex items-center mb-4 justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-brand-purple" />
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Seleccionar fecha y hora
                                        </h3>
                                        <span className="text-xs text-gray-500 ml-2">
                                            (Arrastra los estudios al calendario)
                                        </span>
                                    </div>
                                    <PrimaryButton onClick={onGoNext} disabled={!canGoNext}>
                                        Siguiente
                                    </PrimaryButton>
                                </div>
                                <div className="agenda-container h-full" style={{ height: 'calc(100% - 48px)' }}>
                                    <style>{`
                                        .fc .fc-button-primary {
                                            background-color: #440f6d !important;
                                            border-color: #7c3aed !important;
                                            color: white !important;
                                        }
                                        .fc .fc-button-primary:hover {
                                            background-color: #7c3aed !important;
                                            border-color: #6d28d9 !important;
                                        }
                                        .fc .fc-button-primary:not(:disabled):active,
                                        .fc .fc-button-primary:not(:disabled).fc-button-active {
                                            background-color: #6d28d9 !important;
                                            border-color: #5b21b6 !important;
                                        }
                                        .fc .fc-button-primary:disabled {
                                            background-color: #c4b5fd !important;
                                            border-color: #c4b5fd !important;
                                            opacity: 0.6;
                                        }
                                        /* Horarios no laborales (fuera de businessHours) */
                                        .fc .fc-non-business {
                                            background-color: #1f2937 !important;
                                            opacity: 0.15;
                                        }
                                        /* Optimización del drag and drop */
                                        .disabled-study {
                                            pointer-events: none !important;
                                            user-select: none !important;
                                        }
                                        .draggable-study:not(.disabled-study) {
                                            transition: transform 0.1s ease, box-shadow 0.1s ease !important;
                                            will-change: transform;
                                        }
                                        .draggable-study:not(.disabled-study):active {
                                            cursor: grabbing !important;
                                            transform: scale(1.02);
                                        }
                                    `}</style>
                                    <FullCalendar
                                        ref={calendarRef}
                                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                        initialView="timeGridWeek"
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: ''
                                        }}
                                        buttonText={{
                                            today: 'hoy'
                                        }}
                                        selectable={true}
                                        selectMirror={true}
                                        select={handleDateSelect}
                                        droppable={true}
                                        drop={handleEventReceive}
                                        eventDrop={handleEventDrop}
                                        businessHours={businessHours}
                                        eventAllow={(dropInfo) => {

                                            // Verificar solapamiento con eventos existentes
                                            const startDate = dropInfo.start;
                                            const endDate = dropInfo.end || new Date(startDate.getTime() + 60 * 60 * 1000);

                                            // Para eventos existentes que se mueven, excluir el propio evento de la validación
                                            // Para eventos nuevos (drop externo), validar contra todos los eventos
                                            const eventsToCheck = 'event' in dropInfo && dropInfo.event
                                                ? events.filter((ev: any) => ev.id !== (dropInfo.event as any).id)
                                                : events;

                                            if (checkEventOverlap(startDate, endDate, eventsToCheck)) {
                                                return false; // No permitir drop si hay solapamiento
                                            }

                                            // Validar horarios de negocio
                                            if (!horariosDisponibles || horariosDisponibles.length === 0) return true;
                                            const jsDay = startDate.getDay();
                                            const dia = jsDay === 0 ? 7 : jsDay;
                                            const horario = horariosDisponibles.find((h) => h.day === dia);
                                            if (!horario) return false;
                                            const [startHour, startMin, startSec] = horario.start.split(":").map(Number);
                                            const [endHour, endMin, endSec] = horario.end.split(":").map(Number);
                                            const startAllowed = new Date(startDate);
                                            startAllowed.setHours(startHour, startMin, startSec || 0, 0);
                                            const endAllowed = new Date(startDate);
                                            endAllowed.setHours(endHour, endMin, endSec || 0, 0);
                                            return startDate >= startAllowed && endDate <= endAllowed;
                                        }}
                                        events={events}
                                        allDaySlot={false}
                                        slotMinTime={slotMinTime}
                                        slotMaxTime={slotMaxTime}
                                        slotDuration="00:30:00"
                                        height="100%"
                                        locale="es"
                                        firstDay={0}
                                        weekends={true}
                                        dayMaxEvents={true}
                                        nowIndicator={true}
                                        editable={true}
                                        eventOverlap={false}
                                        selectOverlap={false}
                                        timeZone="local"
                                        eventClick={(info => {
                                            const eventTitle = info.event.title;
                                            toast.info(`Evento: ${eventTitle}`, {
                                                description: 'Puede arrastrar el evento para cambiar su fecha u hora, o eliminarlo usando el botón ✕.',
                                                duration: 4000
                                            });
                                        })}
                                        eventContent={(eventInfo) => {
                                            const isBlocked = eventInfo.event.extendedProps?.blocked === true;
                                            return (
                                                <div
                                                    className={`flex items-center justify-between gap-2 p-1 w-full cursor-pointer group ${isBlocked ? 'bg-gray-800' : ''}`}
                                                    style={isBlocked ? { backgroundColor: '#1e2939', color: '#e5e7eb' } : {}}
                                                >
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-xs font-semibold truncate">
                                                            {eventInfo.event.title}
                                                        </div>
                                                        <div className="text-xs opacity-80">
                                                            {eventInfo.timeText}
                                                        </div>
                                                    </div>
                                                    {!isBlocked && (
                                                        <button
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded px-1.5 py-0.5 text-xs font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const eventId = eventInfo.event.id;

                                                                // Remover del tracking de estudios agendados
                                                                const event = events.find(ev => ev.id === eventId);
                                                                if (event?.extendedProps?.study) {
                                                                    const studyId = event.extendedProps.study.guid || event.extendedProps.study.externalcode;
                                                                    setEstudiosAgendados(prev => {
                                                                        const newSet = new Set(prev);
                                                                        newSet.delete(studyId);
                                                                        return newSet;
                                                                    });
                                                                }

                                                                // Eliminar el evento directamente
                                                                setEvents(prev => prev.filter(ev => ev.id !== eventId));
                                                                setAllEvents(prev => {
                                                                    const equipoId = selectedEquipoLocal;
                                                                    const prevEvents = prev[equipoId] || [];
                                                                    return {
                                                                        ...prev,
                                                                        [equipoId]: prevEvents.filter(ev => ev.id !== eventId)
                                                                    };
                                                                });
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
                                <Calendar className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                                <p className="text-gray-600 font-medium">
                                    Seleccione un equipo para ver el calendario
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    El calendario se mostrará cuando elija un equipo médico
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}