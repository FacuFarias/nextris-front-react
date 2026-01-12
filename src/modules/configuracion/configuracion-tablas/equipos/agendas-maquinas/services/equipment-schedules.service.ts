import { api } from '@/lib/api';
import type {
    EquipmentResponse,
    EquipmentSchedule,
    EquipmentScheduleFormData,
    EquipmentScheduleResponse
} from '../types/equipment-schedules.types';

export const equipmentScheduleService = {
    // Obtener todos los equipos
    getAllEquipment: async (): Promise<EquipmentResponse> => {
        const response = await api.get('/config/equipment');
        return response.data;
    },

    // Obtener agendas de un equipo específico
    getSchedulesByEquipment: async (equipmentId: string): Promise<EquipmentScheduleResponse> => {
        const response = await api.get(`/config/equipment/${equipmentId}/schedule`);
        return response.data;
    },

    // Crear nueva agenda para un equipo
    create: async (equipmentId: string, scheduleData: EquipmentScheduleFormData): Promise<EquipmentSchedule> => {
        const response = await api.post(`/config/equipment/${equipmentId}/schedule`, scheduleData);
        return response.data;
    },

    // Actualizar agenda
    update: async (
        equipmentId: string,
        scheduleId: string,
        scheduleData: Partial<EquipmentScheduleFormData>
    ): Promise<void> => {
        const response = await api.put(`/config/equipment/${equipmentId}/schedule/${scheduleId}`, scheduleData);
        return response.data;
    },

    // Eliminar agenda
    delete: async (equipmentId: string, scheduleId: string): Promise<void> => {
        await api.delete(`/config/equipment/${equipmentId}/schedule/${scheduleId}`);
    },
};
