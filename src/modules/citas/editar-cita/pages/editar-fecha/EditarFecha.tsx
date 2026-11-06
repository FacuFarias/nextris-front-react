import { MainLayout } from "@/layouts/layout";
import { useCalendarEventos } from "@/modules/citas/nueva-cita/hooks/use-calendar-eventos";
import { CalendarPlus, ArrowLeft, Check, MonitorSmartphone } from "lucide-react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { toast } from "sonner";
import { useEditarFecha } from "./hooks/use-editar-fecha";
import { useEquiposPorLocacion } from "@/hooks/use-global";
import { DateInput } from "@/components/ui/date-input";


export const EditarFecha = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { cita } = location.state || {};
    const calendarEventosMutation = useCalendarEventos();
    const reprogramarCitaMutation = useEditarFecha();
    const [fechaDeseada, setFechaDeseada] = useState("");
    const [equipoSeleccionado, setEquipoSeleccionado] = useState("");
    const [, setEventosPrevios] = useState<any[]>([]);
    const [workHours, setWorkHours] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [businessHours, setBusinessHours] = useState<any[]>([]);
    const { data: equipos } = useEquiposPorLocacion(cita?.location_id || '');

    let slotMinTime = "05:00:00";
    let slotMaxTime = "23:00:00";
    // Actualizar slotMinTime y slotMaxTime basado en workHours
    useEffect(() => {
        if (workHours.length > 0) {
            const minTimes = workHours.map(w => w.start);
            const maxTimes = workHours.map(w => w.end);
            slotMinTime = minTimes.sort()[0] || "05:00:00";
            slotMaxTime = maxTimes.sort().reverse()[0] || "23:00:00";
        }
    }, [workHours]);

    // Función reutilizable para cargar eventos del calendario
    const cargarEventosCalendario = (equipmentAetitle: string) => {
        const payload = {
            equipment_aetitle: equipmentAetitle,
        };

        if (payload.equipment_aetitle) {
            calendarEventosMutation.mutate(
                { data: payload },
                {
                    onSuccess: (data) => {
                        // Guardar work_hours
                        const workHoursData = data?.data?.work_hours || [];
                        setWorkHours(workHoursData);

                        // Convertir work_hours a businessHours para FullCalendar
                        // Backend ya envía formato FullCalendar: 0=Domingo, 1=Lunes, ..., 6=Sábado
                        const businessHoursFormatted = workHoursData.map((wh: any) => ({
                            daysOfWeek: [wh.day],
                            startTime: wh.start,
                            endTime: wh.end
                        }));
                        setBusinessHours(businessHoursFormatted);

                        // Buscar el evento con el id y cambiar editable a true
                        let eventosActualizados = data?.data?.events.map((evento: any) => {
                            const isEditable = evento.guid === id || evento.guid === Number(id);

                            return {
                                id: evento.guid,
                                title: evento.title || 'Evento',
                                start: evento.start,
                                end: evento.end,
                                editable: isEditable,
                                backgroundColor: isEditable ? '#7c3aed' : '#6b7280', // purple para editable, gris para no editable
                                borderColor: isEditable ? '#6d28d9' : '#4b5563',
                                textColor: '#ffffff',
                                extendedProps: {
                                    ...evento,
                                    blocked: !isEditable
                                }
                            };
                        });

                        // Verificar si la cita actual está en los eventos
                        const citaEnEventos = eventosActualizados.find((ev: any) =>
                            ev.id === id || ev.id === cita?.guid || String(ev.id) === String(id) || String(ev.id) === String(cita?.guid)
                        );

                        // Si la cita no está en los eventos del nuevo equipo, agregarla
                        if (!citaEnEventos && cita) {
                            const eventoCita = {
                                id: cita.guid || id,
                                title: cita.patient_name || 'Mi Cita',
                                start: cita.start,
                                end: cita.end,
                                editable: true,
                                backgroundColor: '#7c3aed',
                                borderColor: '#6d28d9',
                                textColor: '#ffffff',
                                extendedProps: {
                                    blocked: false
                                }
                            };
                            eventosActualizados = [eventoCita, ...eventosActualizados];
                        }

                        setEventosPrevios(eventosActualizados);
                        setEvents(eventosActualizados);

                        // Navegar el calendario a la fecha del evento editable
                        const eventoEditable = eventosActualizados.find((ev: any) => ev.editable);
                        if (eventoEditable && calendarRef.current) {
                            setTimeout(() => {
                                const calendarApi = calendarRef.current?.getApi();
                                if (calendarApi) {
                                    calendarApi.gotoDate(eventoEditable.start);
                                    // Actualizar también el input de fecha deseada
                                    const fechaEvento = new Date(eventoEditable.start);
                                    const year = fechaEvento.getFullYear();
                                    const month = String(fechaEvento.getMonth() + 1).padStart(2, '0');
                                    const day = String(fechaEvento.getDate()).padStart(2, '0');
                                    const fechaStr = `${year}-${month}-${day}`;
                                    setFechaDeseada(fechaStr);
                                }
                            }, 100);
                        }
                    },
                    onError: (error) => {
                        console.error("Error al obtener eventos:", error);
                        toast.error("Error al cargar eventos del calendario");
                    }
                }
            );
        }
    };

    // Cargar eventos inicialmente con el equipo de la cita
    useEffect(() => {
        if (cita?.equipment) {
            cargarEventosCalendario(cita.equipment);
        }
    }, []);
    const equiposFiltrados = useMemo(() => {
        if (!equipos || !cita?.modality) return [];
        return equipos.filter((equipo: any) =>
            equipo.modality === cita.modality
        );
    }, [equipos, cita?.modality]);



    // Establecer el equipo seleccionado por defecto cuando se cargan los equipos filtrados
    useEffect(() => {
        if (equiposFiltrados.length > 0 && cita?.equipment_id && !equipoSeleccionado) {
            const equipoActual = equiposFiltrados.find((equipo: any) =>
                equipo.guid === cita.equipment_id || equipo.guid === String(cita.equipment_id)
            );
            if (equipoActual) {
                setEquipoSeleccionado(String(equipoActual.guid));
            }
        }
    }, [equiposFiltrados, cita?.equipment_id, equipoSeleccionado]);


    // Manejar cambio de equipo
    const handleEquipoChange = (nuevoEquipoId: string) => {
        setEquipoSeleccionado(nuevoEquipoId);

        // Buscar el equipo seleccionado para obtener su aetitle
        const equipoSeleccionadoObj = equiposFiltrados.find((equipo: any) =>
            equipo.guid === nuevoEquipoId || equipo.guid === String(nuevoEquipoId)
        );
        if (equipoSeleccionadoObj?.aeTitle) {
            toast.info("Cargando eventos del equipo...");
            cargarEventosCalendario(equipoSeleccionadoObj.aeTitle);
        }
    };

    const parseLocalDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, (month || 1) - 1, day || 1);
    };

    const getTargetEvent = (eventList: any[]) => {
        const targetId = id || cita?.guid;
        return eventList.find((ev: any) => {
            if (ev?.editable) return true;
            if (!targetId) return false;
            return String(ev?.id) === String(targetId);
        });
    };


    const handleAplicarCambios = () => {
        const eventoEditable = getTargetEvent(events);

        if (!eventoEditable) {
            toast.error("No se encontró el evento a reprogramar");
            return;
        }

        // Formatear las fechas en formato UTC
        const startDate = new Date(eventoEditable.start);
        const endDate = new Date(eventoEditable.end);

        // Función para formatear fecha en formato UTC con Z
        const formatToUTC = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const payload = {
            id_cita: cita?.id_cita || id || '',
            start_datetime: formatToUTC(startDate),
            end_datetime: formatToUTC(endDate),
            equipment_id: equipoSeleccionado || cita?.equipment_id,
        };


        reprogramarCitaMutation.mutate(payload);
    };

    // Manejar cambio de fecha deseada
    const handleFechaDeseadaChange = (nuevaFecha: string) => {
        setFechaDeseada(nuevaFecha);

        if (nuevaFecha && calendarRef.current) {
            // Navegar el calendario a la fecha seleccionada
            const calendarApi = calendarRef.current.getApi();
            calendarApi.gotoDate(nuevaFecha);

            // Encontrar el evento editable y moverlo a la nueva fecha
            const eventoEditable = getTargetEvent(events);

            if (eventoEditable) {
                // Calcular la duración original del evento
                const originalStart = new Date(eventoEditable.start);
                const originalEnd = new Date(eventoEditable.end);
                const duracionMs = originalEnd.getTime() - originalStart.getTime();

                // Crear nueva fecha manteniendo la hora original
                const nuevaFechaDate = parseLocalDate(nuevaFecha);
                nuevaFechaDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

                // Calcular el nuevo end
                const nuevoEnd = new Date(nuevaFechaDate.getTime() + duracionMs);

                // Actualizar el evento
                setEvents(prevEvents =>
                    prevEvents.map(ev =>
                        String(ev.id) === String(eventoEditable.id)
                            ? { ...ev, start: nuevaFechaDate, end: nuevoEnd }
                            : ev
                    )
                );

                toast.success("Fecha actualizada", {
                    description: `El evento se ha movido a ${nuevaFecha}`,
                    duration: 3000
                });
            }
        }
    };

    // Función para detectar solapamiento de eventos
    const checkEventOverlap = (startDate: Date, endDate: Date, eventsToCheck: any[]) => {
        return eventsToCheck.some((event: any) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return (startDate < eventEnd && endDate > eventStart);
        });
    };

    // Manejar la selección de fecha en el calendario
    /*  const handleDateSelect = (selectInfo: any) => {
         console.log("Fecha seleccionada:", selectInfo);
     };
  */
    // Manejar cuando se suelta un evento externo en el calendario
    const handleEventReceive = (info: any) => {
        console.log("Evento recibido:", info);
    };

    // Manejar cuando se mueve un evento en el calendario
    const handleEventDrop = (info: any) => {
        const event = info.event;

        // Verificar si el evento es editable usando la definición correcta
        const isEditable = event.id === id || event.id === Number(id);

        if (!isEditable) {
            info.revert();
            toast.error("No se puede mover este evento", {
                description: "Solo puedes mover tu cita agendada.",
                duration: 3000
            });
            return;
        }

        // Validar solapamiento con otros eventos
        const startDate = event.start;
        const endDate = event.end || new Date(startDate.getTime() + 60 * 60 * 1000);

        const eventsToCheck = events.filter(e => e.id !== event.id);

        if (checkEventOverlap(startDate, endDate, eventsToCheck)) {
            info.revert();
            toast.error("Conflicto de horario", {
                description: "Ya existe una cita en este horario.",
                duration: 3000
            });
            return;
        }

        // Validar horarios de negocio
        if (workHours && workHours.length > 0) {
            const jsDay = startDate.getDay();
            const dia = jsDay === 0 ? 7 : jsDay;
            const horario = workHours.find((h: any) => h.day === dia);

            if (!horario) {
                info.revert();
                toast.error("Día no laborable", {
                    description: "No se puede agendar en este día.",
                    duration: 3000
                });
                return;
            }

            const [startHour, startMin] = horario.start.split(":").map(Number);
            const [endHour, endMin] = horario.end.split(":").map(Number);

            const startAllowed = new Date(startDate);
            startAllowed.setHours(startHour, startMin, 0, 0);

            const endAllowed = new Date(startDate);
            endAllowed.setHours(endHour, endMin, 0, 0);

            if (startDate < startAllowed || endDate > endAllowed) {
                info.revert();
                toast.error("Fuera del horario laboral", {
                    description: `Horario permitido: ${horario.start} - ${horario.end}`,
                    duration: 3000
                });
                return;
            }
        }

        /*  console.log("Evento movido exitosamente:", {
             id: event.id,
             title: event.title,
             start: event.start,
             end: event.end
         }); */

        // Actualizar el estado de eventos
        setEvents(prevEvents =>
            prevEvents.map(e =>
                e.id === event.id
                    ? { ...e, start: event.start, end: event.end }
                    : e
            )
        );

        toast.success("Cita movida", {
            description: "El horario de la cita ha sido actualizado.",
            duration: 3000
        });
    };

    const actionButtonClass = "h-9 rounded-lg border border-brand-purple bg-white px-3 text-sm font-semibold text-brand-purple hover:bg-brand-purple/10 dark:bg-brand-purple dark:text-white dark:hover:bg-text-400";


    return (
        <MainLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="bg-card rounded-lg p-3 sm:p-6 shadow-md border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-purple p-2.5 rounded-lg">
                                <CalendarPlus className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-brand-purple dark:text-purple-400">Editar Cita</h1>
                        </div>
                        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:flex md:items-center">
                            <Button
                                onClick={handleAplicarCambios}
                                className={`${actionButtonClass} hidden md:inline-flex`}
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Aplicar cambios
                            </Button>
                            <Button
                                onClick={() => navigate(-1)}
                                className={actionButtonClass}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-center text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200 md:hidden">
                        <MonitorSmartphone className="mx-auto mb-3 h-8 w-8" />
                        <h2 className="font-semibold">La reprogramación requiere una pantalla mayor</h2>
                        <p className="mt-1 text-sm">Utiliza una tablet o computadora para mover la cita dentro de la agenda.</p>
                    </div>

                    <div className="mt-4 hidden grid-cols-1 gap-4 md:grid xl:grid-cols-12">
                        <div className="xl:col-span-4">
                            <Card className="bg-white dark:bg-[#2a2e32] shadow-lg border-0 overflow-hidden rounded-xl p-0 h-full">
                                <CardContent className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <p className="font-bold text-base text-brand-purple dark:text-purple-400">{cita?.patient_name || 'No especificado'}</p>
                                        <div className="border-t pt-2">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 dark:text-gray-200">Examen</p>
                                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{cita?.exam || 'No especificado'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 border-t pt-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 dark:text-gray-200">Equipo Actual</p>
                                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-200">{cita?.equipment || 'No especificado'}</p>
                                        </div>
                                        <div className="border-t pt-2">
                                            <p className="text-xs font-medium text-gray-500  uppercase tracking-wide mb-2 dark:text-gray-200 ">Cambiar Equipo</p>
                                            {equiposFiltrados && equiposFiltrados.length > 0 ? (
                                                <Select value={equipoSeleccionado} onValueChange={handleEquipoChange}>
                                                    <SelectTrigger className="w-full h-9 border-2 border-gray-200 rounded-lg focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all">
                                                        <SelectValue placeholder="Selecciona un equipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {equiposFiltrados.map((equipo: any) => (
                                                            <SelectItem key={equipo.guid} value={equipo.guid}>
                                                                {equipo.description}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="flex items-center justify-center h-9 text-sm font-semibold text-red-600 bg-red-50 rounded-lg border-2 border-red-300">
                                                    No hay equipos disponibles
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t pt-3">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 dark:text-gray-200">Fecha deseada</p>
                                        <DateInput
                                            value={fechaDeseada}
                                            onChange={handleFechaDeseadaChange}
                                            className="w-full h-9 border-2 border-gray-200 rounded-lg focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                                            placeholder="DD/MM/AA"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="xl:col-span-8 dark:bg-[#2a2e32]">
                            <Card className="bg-white dark:bg-[#2a2e32] shadow-lg border-0 overflow-hidden rounded-xl p-0 h-auto md:h-[750px]">
                                <CardContent className="pt-4 pb-6 h-full">
                                    <p className="text-base font-semibold text-brand-purple mb-4 dark:text-purple-400">Arrastra el evento donde lo requieras</p>
                                    <div className="agenda-container h-full" >
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
                                        .fc-day-sat, .fc-col-header-cell.fc-day-sat {
                                            background-color: white !important;
                                        }
                                        .dark .fc-day-sat, .dark .fc-col-header-cell.fc-day-sat {
                                            background-color: #2a2e32 !important;
                                        }
                                        /* Horarios no laborales (fuera de businessHours) */
                                        .fc .fc-non-business {
                                            background-color: #1f2937 !important;
                                            opacity: 0.15;
                                        }
                                        .dark .fc .fc-non-business {
                                            background-color: #7c3aed !important;
                                            opacity: 0.2;
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
                                        .fc-desired-date {
                                            background-color: rgba(139, 92, 246, 0.10) !important;
                                        }
                                        .fc .fc-col-header-cell.fc-desired-date-header {
                                            background-color: rgba(139, 92, 246, 0.18) !important;
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
                                            customButtons={{
                                                today: {
                                                    text: 'hoy',
                                                    click: () => {
                                                        if (calendarRef.current) {
                                                            const calendarApi = calendarRef.current.getApi();
                                                            calendarApi.today();

                                                            // Actualizar la fecha deseada al día de hoy
                                                            const today = new Date();
                                                            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                                            setFechaDeseada(todayStr);

                                                            // Mover el evento editable a hoy
                                                            const eventoEditable = getTargetEvent(events);
                                                            if (eventoEditable) {
                                                                // Calcular la duración original del evento
                                                                const originalStart = new Date(eventoEditable.start);
                                                                const originalEnd = new Date(eventoEditable.end);
                                                                const duracionMs = originalEnd.getTime() - originalStart.getTime();

                                                                // Crear nueva fecha manteniendo la hora original
                                                                const nuevaFechaDate = new Date(today);
                                                                nuevaFechaDate.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);

                                                                // Calcular el nuevo end
                                                                const nuevoEnd = new Date(nuevaFechaDate.getTime() + duracionMs);

                                                                // Actualizar el evento
                                                                setEvents(prevEvents =>
                                                                    prevEvents.map(ev =>
                                                                        String(ev.id) === String(eventoEditable.id)
                                                                            ? { ...ev, start: nuevaFechaDate, end: nuevoEnd }
                                                                            : ev
                                                                    )
                                                                );

                                                                toast.success("Cita movida", {
                                                                    description: `El evento se ha movido a ${todayStr}`,
                                                                    duration: 3000
                                                                });
                                                            }
                                                        }
                                                    }
                                                }
                                            }}
                                            selectable={false}
                                            selectMirror={false}
                                            droppable={true}
                                            drop={handleEventReceive}
                                            eventDrop={handleEventDrop}
                                            businessHours={businessHours}
                                            eventAllow={(dropInfo) => {
                                                // Verificar solapamiento con eventos existentes
                                                const startDate = dropInfo.start;
                                                const endDate = dropInfo.end || new Date(startDate.getTime() + 60 * 60 * 1000);

                                                // Para eventos existentes que se mueven, excluir el propio evento de la validación
                                                const eventsToCheck = 'event' in dropInfo && dropInfo.event
                                                    ? events.filter((ev: any) => ev.id !== (dropInfo.event as any).id)
                                                    : events;

                                                if (checkEventOverlap(startDate, endDate, eventsToCheck)) {
                                                    return false; // No permitir drop si hay solapamiento
                                                }

                                                // Validar horarios de negocio (work_hours)
                                                if (!workHours || workHours.length === 0) return true;

                                                const jsDay = startDate.getDay();
                                                const dia = jsDay === 0 ? 7 : jsDay; // Convertir domingo de 0 a 7
                                                const horario = workHours.find((h: any) => h.day === dia);

                                                if (!horario) return false;

                                                const [startHour, startMin] = horario.start.split(":").map(Number);
                                                const [endHour, endMin] = horario.end.split(":").map(Number);

                                                const startAllowed = new Date(startDate);
                                                startAllowed.setHours(startHour, startMin, 0, 0);

                                                const endAllowed = new Date(startDate);
                                                endAllowed.setHours(endHour, endMin, 0, 0);

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
                                            dayCellClassNames={(arg) => {
                                                if (!fechaDeseada) return [];
                                                const d = arg.date;
                                                const cellDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                return cellDate === fechaDeseada ? ['fc-desired-date'] : [];
                                            }}
                                            dayHeaderClassNames={(arg) => {
                                                if (!fechaDeseada) return [];
                                                const d = arg.date;
                                                const headerDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                return headerDate === fechaDeseada ? ['fc-desired-date-header'] : [];
                                            }}
                                            eventContent={(eventInfo) => {
                                                const isBlocked = eventInfo.event.extendedProps?.blocked === true;
                                                return (
                                                    <div
                                                        className={`flex items-center justify-between gap-2 p-1 w-full ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer'} group`}
                                                    >
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="text-xs font-semibold truncate">
                                                                {eventInfo.event.title}
                                                            </div>
                                                            <div className="text-xs opacity-80">
                                                                {eventInfo.timeText}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout >
    )
}
